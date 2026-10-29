<?php

namespace App\Controller\Api;

use App\Entity\Consola;
use App\Entity\Movil;
use App\Entity\Producto;
use App\Entity\Videojuego;
use App\Enum\FormatoMovil;
use App\Http\ApiException;
use App\Http\Paginacion;
use App\Repository\AlquilerRepository;
use App\Repository\ProductoRepository;
use App\Service\Presentador;
use App\Service\ProductoService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Catálogo: /api/productos (todos) y /api/videojuegos, /api/moviles, /api/consolas (cada subtipo).
 * Lectura: pública (web, ADR-028) y con token (apps). Escritura: solo admin.
 */
#[Route('/api')]
final class ProductoController extends ApiController
{
    /** Recurso de la URL → clase del subtipo */
    private const RECURSOS = ['videojuegos' => Videojuego::class, 'moviles' => Movil::class, 'consolas' => Consola::class];
    private const TIPOS = ['videojuego' => Videojuego::class, 'movil' => Movil::class, 'consola' => Consola::class];

    public function __construct(
        private readonly ProductoRepository $productos,
        private readonly AlquilerRepository $alquileres,
        private readonly ProductoService $servicio,
        private readonly Presentador $presentador,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /** ?tipo=videojuego|movil|consola &marca={id} &q={texto} &page &limit (+ ?activo=0 solo admin) */
    #[Route('/productos', methods: ['GET'])]
    public function listarTodos(Request $request): JsonResponse
    {
        $tipo = $request->query->get('tipo');
        if ($tipo !== null && $tipo !== '' && !isset(self::TIPOS[$tipo])) {
            throw ApiException::validacion(['tipo' => 'Valor no válido. Valores posibles: videojuego, movil, consola.']);
        }
        $clase = $tipo ? self::TIPOS[$tipo] : Producto::class;

        return $this->listar($request, $this->consulta($request, $clase));
    }

    /**
     * /videojuegos: ?plataforma={id} &genero &pegi &alquilable=1
     * /moviles: ?formato=movil|tablet
     * Todos: ?marca &q &page &limit
     */
    #[Route('/{recurso}', requirements: ['recurso' => 'videojuegos|moviles|consolas'], methods: ['GET'])]
    public function listarSubtipo(Request $request, string $recurso): JsonResponse
    {
        $qb = $this->consulta($request, self::RECURSOS[$recurso]);

        if ($recurso === 'videojuegos') {
            if (null !== $plataforma = $this->enteroQuery($request, 'plataforma')) {
                $qb->andWhere('p.plataforma = :plataforma')->setParameter('plataforma', $plataforma);
            }
            if ('' !== $genero = (string) $request->query->get('genero', '')) {
                $qb->andWhere('p.genero = :genero')->setParameter('genero', $genero);
            }
            if (null !== $pegi = $this->enteroQuery($request, 'pegi')) {
                $qb->andWhere('p.pegi = :pegi')->setParameter('pegi', $pegi);
            }
            if ($request->query->getBoolean('alquilable')) {
                $qb->andWhere('p.copiasAlquiler > 0');
            }
        }
        if ($recurso === 'moviles' && null !== $formato = $this->enumQuery($request, 'formato', FormatoMovil::class)) {
            $qb->andWhere('p.formato = :formato')->setParameter('formato', $formato);
        }

        return $this->listar($request, $qb);
    }

    #[Route('/productos/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function verProducto(int $id): JsonResponse
    {
        return $this->respuesta($this->json1($this->buscarVisible(Producto::class, $id)));
    }

    #[Route('/{recurso}/{id}', requirements: ['recurso' => 'videojuegos|moviles|consolas', 'id' => '\d+'], methods: ['GET'])]
    public function verSubtipo(string $recurso, int $id): JsonResponse
    {
        return $this->respuesta($this->json1($this->buscarVisible(self::RECURSOS[$recurso], $id)));
    }

    #[Route('/{recurso}', requirements: ['recurso' => 'videojuegos|moviles|consolas'], methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function crear(Request $request, string $recurso): JsonResponse
    {
        $producto = $this->servicio->crear(self::RECURSOS[$recurso], $this->datos($request));

        return $this->respuesta($this->json1($producto), Response::HTTP_CREATED);
    }

    /** PUT parcial: solo cambia los campos enviados. Para retirar un producto: {"activo": false} (ADR-018). */
    #[Route('/{recurso}/{id}', requirements: ['recurso' => 'videojuegos|moviles|consolas', 'id' => '\d+'], methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function editar(Request $request, string $recurso, int $id): JsonResponse
    {
        $producto = $this->existe($this->em->find(self::RECURSOS[$recurso], $id), 'Ese producto no existe.');
        $this->servicio->actualizar($producto, $this->datos($request));

        return $this->respuesta($this->json1($producto));
    }

    /** Un producto vendido o alquilado alguna vez no se borra (409 EN_USO): se retira con activo = false. */
    #[Route('/{recurso}/{id}', requirements: ['recurso' => 'videojuegos|moviles|consolas', 'id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function borrar(string $recurso, int $id): Response
    {
        $producto = $this->existe($this->em->find(self::RECURSOS[$recurso], $id), 'Ese producto no existe.');
        if ($this->productos->tieneHistorial($producto)) {
            throw ApiException::conflicto('EN_USO', 'Este producto tiene ventas o alquileres: retíralo del catálogo (activo = false) en vez de borrarlo.');
        }
        $this->em->remove($producto);
        $this->em->flush();

        return $this->sinContenido();
    }

    // ---------------------------------------------------------------------------------

    /** @param class-string<Producto> $clase */
    private function consulta(Request $request, string $clase): QueryBuilder
    {
        // Los retirados (activo = 0) solo los ve el admin, y solo si los pide con ?activo=0
        $activo = true;
        if ($this->esAdmin() && $request->query->has('activo')) {
            $activo = $request->query->getBoolean('activo');
        }

        return $this->productos->consultaCatalogo($clase, $activo, $this->enteroQuery($request, 'marca'), $request->query->get('q'));
    }

    private function listar(Request $request, QueryBuilder $qb): JsonResponse
    {
        $ocupadas = [];

        return $this->respuesta(Paginacion::paginar(
            $qb,
            $request,
            // closure con "use (&...)": una función flecha (fn) copiaría $ocupadas vacío al crearse
            function (Producto $p) use (&$ocupadas): array {
                return $this->presentador->producto($p, $ocupadas[$p->getId()] ?? null);
            },
            // Copias alquiladas de todos los videojuegos de la página en UNA consulta (no una por juego)
            function (array $productos) use (&$ocupadas): void {
                $ids = array_map(fn (Producto $p) => $p->getId(), array_filter($productos, fn ($p) => $p instanceof Videojuego));
                $ocupadas = $this->alquileres->copiasOcupadas(array_values($ids));
            },
        ));
    }

    /**
     * @param class-string<Producto> $clase
     */
    private function buscarVisible(string $clase, int $id): Producto
    {
        $producto = $this->em->find($clase, $id);
        if ($producto === null || (!$producto->isActivo() && !$this->esAdmin())) {
            throw ApiException::noEncontrado('Ese producto no existe.');
        }

        return $producto;
    }

    /** JSON de un solo producto (con sus copias disponibles si es un videojuego). */
    private function json1(Producto $p): array
    {
        $ocupadas = $p instanceof Videojuego ? $this->alquileres->copiasOcupadas([$p->getId()])[$p->getId()] : null;

        return $this->presentador->producto($p, $ocupadas);
    }
}
