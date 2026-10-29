<?php

namespace App\Controller\Api;

use App\Entity\Marca;
use App\Entity\Plataforma;
use App\Http\ApiException;
use App\Repository\ProductoRepository;
use App\Service\Presentador;
use App\Service\Validacion;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * /api/marcas y /api/plataformas: catálogos con solo un nombre ({id, nombre}).
 * Son listas cortas, así que se devuelven enteras (sin paginar). Lectura pública; escritura admin.
 */
#[Route('/api/{recurso}', requirements: ['recurso' => 'marcas|plataformas'])]
final class MarcaPlataformaController extends ApiController
{
    private const CLASES = ['marcas' => Marca::class, 'plataformas' => Plataforma::class];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ProductoRepository $productos,
        private readonly Validacion $validacion,
        private readonly Presentador $presentador,
    ) {
    }

    #[Route('', methods: ['GET'])]
    public function listar(string $recurso): JsonResponse
    {
        $todas = $this->em->getRepository(self::CLASES[$recurso])->findBy([], ['nombre' => 'ASC']);

        return $this->respuesta(array_map(fn (Marca|Plataforma $e) => ['id' => $e->getId(), 'nombre' => $e->getNombre()], $todas));
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function ver(string $recurso, int $id): JsonResponse
    {
        $e = $this->buscar($recurso, $id);

        return $this->respuesta(['id' => $e->getId(), 'nombre' => $e->getNombre()]);
    }

    /** {nombre} → 201 */
    #[Route('', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function crear(Request $request, string $recurso): JsonResponse
    {
        $clase = self::CLASES[$recurso];
        $e = new $clase();

        return $this->guardar($e, $request, Response::HTTP_CREATED);
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function editar(Request $request, string $recurso, int $id): JsonResponse
    {
        return $this->guardar($this->buscar($recurso, $id), $request, Response::HTTP_OK);
    }

    /** 409 EN_USO si tiene productos (marca) o videojuegos (plataforma). */
    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function borrar(string $recurso, int $id): Response
    {
        $e = $this->buscar($recurso, $id);
        $enUso = $e instanceof Marca ? $this->productos->marcaTieneProductos($id) : $this->productos->plataformaTieneVideojuegos($id);
        if ($enUso) {
            throw ApiException::conflicto('EN_USO', $e instanceof Marca
                ? 'No se puede borrar: hay productos de esta marca.'
                : 'No se puede borrar: hay videojuegos de esta plataforma.');
        }
        $this->em->remove($e);
        $this->em->flush();

        return $this->sinContenido();
    }

    private function buscar(string $recurso, int $id): Marca|Plataforma
    {
        return $this->existe($this->em->find(self::CLASES[$recurso], $id));
    }

    private function guardar(Marca|Plataforma $e, Request $request, int $estado): JsonResponse
    {
        $e->setNombre($this->datos($request)->texto('nombre'));
        $this->validacion->validar($e);
        $this->em->persist($e);
        $this->em->flush();

        return $this->respuesta(['id' => $e->getId(), 'nombre' => $e->getNombre()], $estado);
    }
}
