<?php

namespace App\Controller\Api;

use App\Entity\Cliente;
use App\Entity\Reparacion;
use App\Entity\Trabajador;
use App\Enum\EstadoReparacion;
use App\Http\ApiException;
use App\Http\Paginacion;
use App\Http\Ubicacion;
use App\Repository\ReparacionRepository;
use App\Service\Presentador;
use App\Service\ReparacionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Soporte técnico. Quién ve qué:
 * - Cliente (apps): solo sus reparaciones.
 * - Técnico (web): solo las de SU departamento (ADR-032).
 * - Admin (web): todas.
 */
#[Route('/api/reparaciones')]
final class ReparacionController extends ApiController
{
    public function __construct(
        private readonly ReparacionRepository $reparaciones,
        private readonly ReparacionService $servicio,
        private readonly Presentador $presentador,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /** ?estado=recibida|en_reparacion|lista|entregada|cancelada &departamento={id} &page &limit */
    #[Route('', methods: ['GET'])]
    public function listar(Request $request): JsonResponse
    {
        $usuario = $this->usuario();
        $cliente = $usuario instanceof Cliente ? $usuario : null;
        $departamento = $this->enteroQuery($request, 'departamento');
        if ($usuario instanceof Trabajador && $usuario->esTecnico()) {
            $departamento = $usuario->getDepartamento()?->getId(); // el técnico no puede mirar otro departamento
        }
        $qb = $this->reparaciones->consultaListado($cliente, $departamento, $this->enumQuery($request, 'estado', EstadoReparacion::class));

        return $this->respuesta(Paginacion::paginar($qb, $request, fn (Reparacion $r) => $this->presentador->reparacion($r)));
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function ver(int $id): JsonResponse
    {
        return $this->respuesta($this->presentador->reparacion($this->visible($id)));
    }

    /** Solo clientes, con ubicación (P-28). {departamentoId, dispositivo, problema, foto?} → 201 (estado recibida) */
    #[Route('', methods: ['POST'])]
    public function crear(Request $request): JsonResponse
    {
        $cliente = $this->cliente();
        Ubicacion::exigir($request);
        $reparacion = $this->servicio->crear($cliente, $this->datos($request));

        return $this->respuesta($this->presentador->reparacion($reparacion), Response::HTTP_CREATED);
    }

    /** {estado?, presupuesto?, tecnicoId?}: ver permisos en ReparacionService::actualizar */
    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function editar(Request $request, int $id): JsonResponse
    {
        $reparacion = $this->visible($id);
        $this->servicio->actualizar($reparacion, $this->datos($request), $this->usuario());

        return $this->respuesta($this->presentador->reparacion($reparacion));
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function borrar(int $id): Response
    {
        $this->em->remove($this->existe($this->em->find(Reparacion::class, $id), 'Esa reparación no existe.'));
        $this->em->flush();

        return $this->sinContenido();
    }

    /** Devuelve la reparación si este usuario puede verla; si no, 403. */
    private function visible(int $id): Reparacion
    {
        $reparacion = $this->existe($this->em->find(Reparacion::class, $id), 'Esa reparación no existe.');
        $usuario = $this->usuario();

        $puede = match (true) {
            $usuario instanceof Cliente => $reparacion->getCliente()->getId() === $usuario->getId(),
            $usuario instanceof Trabajador && $usuario->esAdmin() => true,
            $usuario instanceof Trabajador => $reparacion->getDepartamento()?->getId() === $usuario->getDepartamento()?->getId(),
            default => false,
        };
        if (!$puede) {
            throw ApiException::prohibido('No puedes ver esta reparación.');
        }

        return $reparacion;
    }
}
