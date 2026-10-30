<?php

namespace App\Controller\Api;

use App\Entity\Cliente;
use App\Entity\Trabajador;
use App\Entity\Usuario;
use App\Http\ApiException;
use App\Http\Datos;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Base de todos los controladores de la API. Controladores finos: leen la petición,
 * comprueban permisos y llaman a un Service; el JSON lo construye el Presentador.
 */
abstract class ApiController extends AbstractController
{
    /** Tildes y barras sin escapar, y 10.0 sale como 10.0 (no como 10). */
    private const OPCIONES_JSON = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION;

    protected function datos(Request $request): Datos
    {
        return Datos::desdeJson($request->getContent());
    }

    protected function respuesta(mixed $datos, int $estado = Response::HTTP_OK): JsonResponse
    {
        $respuesta = new JsonResponse(null, $estado);
        $respuesta->setEncodingOptions(self::OPCIONES_JSON);

        return $respuesta->setData($datos);
    }

    protected function sinContenido(): Response
    {
        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * @template T of object
     *
     * @param T|null $entidad
     *
     * @return T
     */
    protected function existe(?object $entidad, string $mensaje = 'No existe.'): object
    {
        return $entidad ?? throw ApiException::noEncontrado($mensaje);
    }

    protected function usuario(): Usuario
    {
        $usuario = $this->getUser();
        if (!$usuario instanceof Usuario) {
            throw new ApiException(401, 'NO_AUTENTICADO', 'Tienes que iniciar sesión.');
        }

        return $usuario;
    }

    /** Usuario que tiene que ser cliente (comprar, alquilar, pedir reparaciones). */
    protected function cliente(): Cliente
    {
        $usuario = $this->usuario();
        if (!$usuario instanceof Cliente) {
            throw ApiException::prohibido('Esta acción es solo para clientes.');
        }

        return $usuario;
    }

    protected function esAdmin(): bool
    {
        $usuario = $this->getUser();

        return $usuario instanceof Trabajador && $usuario->esAdmin();
    }

    /** Filtro opcional ?campo=numero */
    protected function enteroQuery(Request $request, string $campo): ?int
    {
        $valor = $request->query->get($campo);
        if ($valor === null || $valor === '') {
            return null;
        }
        if (!preg_match('/^\d+$/', (string) $valor)) {
            throw ApiException::validacion([$campo => 'Tiene que ser un número entero.']);
        }

        return (int) $valor;
    }

    /**
     * Filtro opcional ?campo=valor de un enumerado.
     *
     * @template T of \BackedEnum
     *
     * @param class-string<T> $enum
     *
     * @return T|null
     */
    protected function enumQuery(Request $request, string $campo, string $enum): ?\BackedEnum
    {
        $valor = $request->query->get($campo);
        if ($valor === null || $valor === '') {
            return null;
        }

        return $enum::tryFrom((string) $valor)
            ?? throw ApiException::validacion([$campo => 'Valor no válido. Valores posibles: '.implode(', ', $enum::valores()).'.']);
    }
}
