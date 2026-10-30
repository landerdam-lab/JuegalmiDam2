<?php

namespace App\EventListener;

use App\Entity\RegistroUbicacion;
use App\Entity\Usuario;
use App\Http\Ubicacion;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * "Saber la localización de la persona en el momento de CUALQUIER consulta" (enunciado, ADR-014).
 * Se ejecuta en cada petición a /api, DESPUÉS del firewall (prioridad 0 < 8), cuando ya sabemos
 * quién es el usuario. Si la petición trae X-Latitud y X-Longitud válidas, guarda una fila en
 * registro_ubicacion. Sin usuario (peticiones públicas) o sin cabeceras, no guarda nada.
 */
#[AsEventListener(event: KernelEvents::REQUEST, priority: 0)]
final class RegistroUbicacionListener
{
    private const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    public function __construct(
        private readonly Security $security,
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function __invoke(RequestEvent $event): void
    {
        $request = $event->getRequest();
        if (!$event->isMainRequest() || !str_starts_with($request->getPathInfo(), '/api/')
            || !in_array($request->getMethod(), self::METODOS, true)) {
            return;
        }
        $usuario = $this->security->getUser();
        $ubicacion = Ubicacion::desdeCabeceras($request);
        if (!$usuario instanceof Usuario || $ubicacion === null) {
            return;
        }

        $ruta = $request->getPathInfo().($request->getQueryString() !== null ? '?'.$request->getQueryString() : '');
        $this->em->persist(new RegistroUbicacion($usuario, $ubicacion[0], $ubicacion[1], $request->getMethod(), $ruta, new \DateTimeImmutable()));
        $this->em->flush();
    }
}
