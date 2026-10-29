<?php

namespace App\Controller\Api;

use App\Entity\FotoTienda;
use App\Entity\Tienda;
use App\Http\Datos;
use App\Service\Imagenes;
use App\Service\Presentador;
use App\Service\Validacion;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Sección "La tienda" (ADR-007): /api/tiendas (ubicación + historia + galería) y /api/fotos-tienda.
 * Lectura pública (web) y con token (apps); escritura solo admin.
 */
#[Route('/api')]
final class TiendaController extends ApiController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly Imagenes $imagenes,
        private readonly Validacion $validacion,
        private readonly Presentador $presentador,
    ) {
    }

    #[Route('/tiendas', methods: ['GET'])]
    public function listar(): JsonResponse
    {
        $tiendas = $this->em->getRepository(Tienda::class)->findBy([], ['id' => 'ASC']);

        return $this->respuesta(array_map(fn (Tienda $t) => $this->presentador->tienda($t, false), $tiendas));
    }

    /** Con historia, latitud, longitud y la galería de fotos. */
    #[Route('/tiendas/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function ver(int $id): JsonResponse
    {
        return $this->respuesta($this->presentador->tienda($this->tienda($id)));
    }

    #[Route('/tiendas/{id}/fotos', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function fotos(int $id): JsonResponse
    {
        $fotos = $this->tienda($id)->getFotos()->toArray();

        return $this->respuesta(array_map(fn (FotoTienda $f) => $this->presentador->fotoTienda($f), $fotos));
    }

    /** {nombre, direccion, latitud, longitud, historia} → 201 */
    #[Route('/tiendas', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function crear(Request $request): JsonResponse
    {
        return $this->guardarTienda(new Tienda(), $this->datos($request), true);
    }

    #[Route('/tiendas/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function editar(Request $request, int $id): JsonResponse
    {
        return $this->guardarTienda($this->tienda($id), $this->datos($request), false);
    }

    /** Borra la tienda y su galería (ON DELETE CASCADE). */
    #[Route('/tiendas/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function borrar(int $id): Response
    {
        $this->em->remove($this->tienda($id));
        $this->em->flush();

        return $this->sinContenido();
    }

    // Fotos de la galería -------------------------------------------------------------

    #[Route('/fotos-tienda/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function verFoto(int $id): JsonResponse
    {
        return $this->respuesta($this->presentador->fotoTienda($this->foto($id)));
    }

    /** {tiendaId, imagen, descripcion} → 201 (la imagen se sube antes con POST /api/imagenes) */
    #[Route('/fotos-tienda', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function crearFoto(Request $request): JsonResponse
    {
        return $this->guardarFoto(new FotoTienda(), $this->datos($request), true);
    }

    #[Route('/fotos-tienda/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function editarFoto(Request $request, int $id): JsonResponse
    {
        return $this->guardarFoto($this->foto($id), $this->datos($request), false);
    }

    #[Route('/fotos-tienda/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function borrarFoto(int $id): Response
    {
        $this->em->remove($this->foto($id));
        $this->em->flush();

        return $this->sinContenido();
    }

    // ---------------------------------------------------------------------------------

    private function tienda(int $id): Tienda
    {
        return $this->existe($this->em->find(Tienda::class, $id), 'Esa tienda no existe.');
    }

    private function foto(int $id): FotoTienda
    {
        return $this->existe($this->em->find(FotoTienda::class, $id), 'Esa foto no existe.');
    }

    private function guardarTienda(Tienda $t, Datos $d, bool $crear): JsonResponse
    {
        if ($crear || $d->tiene('nombre')) {
            $t->setNombre($d->texto('nombre'));
        }
        if ($crear || $d->tiene('direccion')) {
            $t->setDireccion($d->texto('direccion'));
        }
        if ($crear || $d->tiene('latitud')) {
            $t->setLatitud($d->decimal('latitud', false, 7));
        }
        if ($crear || $d->tiene('longitud')) {
            $t->setLongitud($d->decimal('longitud', false, 7));
        }
        if ($crear || $d->tiene('historia')) {
            $t->setHistoria($d->texto('historia'));
        }
        $this->validacion->validar($t);
        $this->em->persist($t);
        $this->em->flush();

        return $this->respuesta($this->presentador->tienda($t), $crear ? Response::HTTP_CREATED : Response::HTTP_OK);
    }

    private function guardarFoto(FotoTienda $f, Datos $d, bool $crear): JsonResponse
    {
        if ($crear || $d->tiene('tiendaId')) {
            $f->setTienda($this->tienda($d->entero('tiendaId', true)));
        }
        if ($crear || $d->tiene('imagen')) {
            $f->setImagen($this->imagenes->aRuta($d->texto('imagen'), 'imagen'));
        }
        if ($crear || $d->tiene('descripcion')) {
            $f->setDescripcion($d->texto('descripcion'));
        }
        $this->validacion->validar($f);
        $this->em->persist($f);
        $this->em->flush();

        return $this->respuesta($this->presentador->fotoTienda($f), $crear ? Response::HTTP_CREATED : Response::HTTP_OK);
    }
}
