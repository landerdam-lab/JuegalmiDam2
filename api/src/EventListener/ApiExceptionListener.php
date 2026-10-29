<?php

namespace App\EventListener;

use App\Http\ApiException;
use App\Http\RespuestaError;
use Doctrine\DBAL\Exception\ConstraintViolationException;
use Doctrine\DBAL\Exception\DriverException;
use Doctrine\DBAL\Exception\ForeignKeyConstraintViolationException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * Convierte CUALQUIER error de /api en el JSON común {"error": {"codigo", "mensaje", "campos"}}.
 * Así las apps nunca reciben una página HTML de error ni un mensaje de MariaDB.
 *
 * Si la BBDD rechaza algo (CHECK, UNIQUE, FK o el SIGNAL de un trigger, ADR-020), aquí se traduce
 * a un error de la API con un mensaje en español. Normalmente la API lo comprueba antes; esto es la red de seguridad.
 */
#[AsEventListener(event: KernelEvents::EXCEPTION)]
final class ApiExceptionListener
{
    /** Mensajes de los SIGNAL de los triggers (sin tildes en la BBDD) → respuesta de la API */
    private const TRIGGERS = [
        'No quedan copias disponibles' => [409, 'SIN_COPIAS', 'No quedan copias disponibles de este videojuego.'],
        'La fecha de fin es anterior al pedido' => [422, 'VALIDACION', 'La fecha de fin del alquiler es anterior al pedido.'],
        'La reparacion se asigna a un tecnico' => [422, 'VALIDACION', 'La reparación se tiene que asignar a un técnico.'],
        'no se puede cambiar' => [422, 'VALIDACION', 'El tipo no se puede cambiar.'],
    ];

    public function __construct(
        private readonly LoggerInterface $logger,
        #[Autowire('%kernel.debug%')] private readonly bool $debug,
    ) {
    }

    public function __invoke(ExceptionEvent $event): void
    {
        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api/')) {
            return;
        }
        $e = $event->getThrowable();

        $respuesta = match (true) {
            $e instanceof ApiException => RespuestaError::crear($e->getEstadoHttp(), $e->getCodigo(), $e->getMessage(), $e->getCampos()),
            $e instanceof AccessDeniedException => RespuestaError::crear(403, 'PROHIBIDO', 'No tienes permiso para hacer esto.'),
            $e instanceof HttpExceptionInterface => $this->errorHttp($e),
            $e instanceof UniqueConstraintViolationException => RespuestaError::crear(409, 'DUPLICADO', 'Ya existe un registro con esos datos.'),
            $e instanceof ForeignKeyConstraintViolationException => RespuestaError::crear(409, 'EN_USO', 'No se puede borrar porque se está usando en otros datos.'),
            $e instanceof DriverException && $e->getSQLState() === '45000' => $this->errorTrigger($e),
            // CHECK de MariaDB (error 4025, SQLSTATE 23000)
            $e instanceof ConstraintViolationException,
            $e instanceof DriverException && $e->getSQLState() === '23000' => RespuestaError::crear(422, 'VALIDACION', 'Algún dato no cumple las reglas de la tienda.'),
            default => null,
        };

        if ($respuesta === null) {
            // Error no controlado: se registra en el log y la app recibe un mensaje genérico.
            $this->logger->error('Error no controlado en la API', ['exception' => $e]);
            $extra = $this->debug ? ['detalle' => get_class($e).': '.$e->getMessage()] : [];
            $respuesta = RespuestaError::crear(500, 'ERROR_INTERNO', 'Ha ocurrido un error. Inténtalo de nuevo.', [], $extra);
        }

        $event->setResponse($respuesta);
    }

    private function errorHttp(HttpExceptionInterface $e): \Symfony\Component\HttpFoundation\JsonResponse
    {
        return match ($e->getStatusCode()) {
            404 => RespuestaError::crear(404, 'NO_ENCONTRADO', 'No existe.'),
            405 => RespuestaError::crear(405, 'METODO_NO_PERMITIDO', 'Esta ruta no admite ese método HTTP.'),
            400 => RespuestaError::crear(400, 'PETICION_INVALIDA', 'La petición no es válida.'),
            default => RespuestaError::crear($e->getStatusCode(), 'ERROR_HTTP', 'La petición no se ha podido atender.'),
        };
    }

    private function errorTrigger(DriverException $e): \Symfony\Component\HttpFoundation\JsonResponse
    {
        foreach (self::TRIGGERS as $texto => [$estado, $codigo, $mensaje]) {
            if (str_contains($e->getMessage(), $texto)) {
                return RespuestaError::crear($estado, $codigo, $mensaje);
            }
        }

        return RespuestaError::crear(422, 'VALIDACION', 'Algún dato no cumple las reglas de la tienda.');
    }
}
