<?php

namespace App\Controller\Api;

use App\Entity\Departamento;
use App\Entity\Servicio;
use App\Enum\LineaServicio;
use App\Service\Presentador;
use App\Service\Validacion;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * /api/servicios: los servicios de las 3 pestañas de "Servicios" (ADR-030), y
 * /api/departamentos: los 2 departamentos de soporte (solo lectura, para el formulario de reparación).
 */
#[Route('/api')]
final class ServicioController extends ApiController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly Validacion $validacion,
        private readonly Presentador $presentador,
    ) {
    }

    #[Route('/departamentos', methods: ['GET'])]
    public function departamentos(): JsonResponse
    {
        $todos = $this->em->getRepository(Departamento::class)->findBy([], ['nombre' => 'ASC']);

        return $this->respuesta(array_map(fn (Departamento $d) => $this->presentador->departamento($d), $todos));
    }

    /** ?linea=videojuegos|consolas|telefonia (una pestaña). Sin filtro, todos. */
    #[Route('/servicios', methods: ['GET'])]
    public function listar(Request $request): JsonResponse
    {
        $criterio = [];
        if (null !== $linea = $this->enumQuery($request, 'linea', LineaServicio::class)) {
            $criterio['linea'] = $linea;
        }
        $servicios = $this->em->getRepository(Servicio::class)->findBy($criterio, ['linea' => 'ASC', 'nombre' => 'ASC']);

        return $this->respuesta(array_map(fn (Servicio $s) => $this->presentador->servicio($s), $servicios));
    }

    #[Route('/servicios/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function ver(int $id): JsonResponse
    {
        return $this->respuesta($this->presentador->servicio($this->existe($this->em->find(Servicio::class, $id))));
    }

    /** {linea, nombre, descripcion, precioOrientativo?} → 201 */
    #[Route('/servicios', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function crear(Request $request): JsonResponse
    {
        return $this->guardar(new Servicio(), $request, true);
    }

    #[Route('/servicios/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function editar(Request $request, int $id): JsonResponse
    {
        return $this->guardar($this->existe($this->em->find(Servicio::class, $id)), $request, false);
    }

    #[Route('/servicios/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function borrar(int $id): Response
    {
        $this->em->remove($this->existe($this->em->find(Servicio::class, $id)));
        $this->em->flush();

        return $this->sinContenido();
    }

    private function guardar(Servicio $s, Request $request, bool $crear): JsonResponse
    {
        $d = $this->datos($request);
        if ($crear || $d->tiene('linea')) {
            $s->setLinea($d->enum('linea', LineaServicio::class));
        }
        if ($crear || $d->tiene('nombre')) {
            $s->setNombre($d->texto('nombre'));
        }
        if ($crear || $d->tiene('descripcion')) {
            $s->setDescripcion($d->texto('descripcion'));
        }
        if ($d->tiene('precioOrientativo')) {
            $s->setPrecioOrientativo($d->decimal('precioOrientativo'));
        }
        $this->validacion->validar($s);
        $this->em->persist($s);
        $this->em->flush();

        return $this->respuesta($this->presentador->servicio($s), $crear ? Response::HTTP_CREATED : Response::HTTP_OK);
    }
}
