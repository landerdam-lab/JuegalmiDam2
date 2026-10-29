<?php

namespace App\Controller\Api;

use App\Entity\Cliente;
use App\Entity\RegistroUbicacion;
use App\Http\ApiException;
use App\Http\Paginacion;
use App\Repository\RegistroUbicacionRepository;
use App\Service\Imagenes;
use App\Service\Presentador;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** /api/registros-ubicacion (admin, RF-11) y /api/imagenes (subida de fotos, ADR-019). */
#[Route('/api')]
final class UbicacionImagenController extends ApiController
{
    /** Carpetas en las que puede subir cada uno: el cliente, su foto de perfil y la de la reparación. */
    private const CARPETAS_CLIENTE = ['usuarios', 'reparaciones'];

    public function __construct(
        private readonly RegistroUbicacionRepository $registros,
        private readonly Imagenes $imagenes,
        private readonly Presentador $presentador,
    ) {
    }

    /** ?usuario={id} &desde=AAAA-MM-DD &hasta=AAAA-MM-DD (incluido) &page &limit. Solo lectura. */
    #[Route('/registros-ubicacion', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function registros(Request $request): JsonResponse
    {
        $desde = $this->fechaQuery($request, 'desde');
        $hasta = $this->fechaQuery($request, 'hasta')?->modify('+1 day');
        $qb = $this->registros->consultaListado($this->enteroQuery($request, 'usuario'), $desde, $hasta);

        return $this->respuesta(Paginacion::paginar($qb, $request, fn (RegistroUbicacion $r) => $this->presentador->registroUbicacion($r)));
    }

    /**
     * multipart/form-data: imagen=<fichero>, carpeta=productos|usuarios|reparaciones|tienda
     * → 201 {"ruta": "uploads/…", "url": "https://…/uploads/…"}.
     * La app sube primero la foto y después manda esa URL (o la ruta) en el JSON del recurso.
     */
    #[Route('/imagenes', methods: ['POST'])]
    public function subir(Request $request): JsonResponse
    {
        $carpeta = (string) $request->request->get('carpeta', '');
        if (!in_array($carpeta, Imagenes::CARPETAS, true)) {
            throw ApiException::validacion(['carpeta' => 'Valor no válido. Valores posibles: '.implode(', ', Imagenes::CARPETAS).'.']);
        }
        if (!$this->esAdmin() && !($this->usuario() instanceof Cliente && in_array($carpeta, self::CARPETAS_CLIENTE, true))) {
            throw ApiException::prohibido('No puedes subir imágenes a esa carpeta.');
        }
        $fichero = $request->files->get('imagen');
        if (!$fichero instanceof UploadedFile) {
            throw ApiException::validacion(['imagen' => 'Falta la imagen (campo "imagen" del formulario).']);
        }

        $ruta = $this->imagenes->guardar($fichero, $carpeta);

        return $this->respuesta(['ruta' => $ruta, 'url' => $this->imagenes->url($ruta)], Response::HTTP_CREATED);
    }

    private function fechaQuery(Request $request, string $campo): ?\DateTimeImmutable
    {
        $valor = (string) $request->query->get($campo, '');
        if ($valor === '') {
            return null;
        }
        $fecha = \DateTimeImmutable::createFromFormat('!Y-m-d', $valor);

        return $fecha ?: throw ApiException::validacion([$campo => 'Tiene que ser una fecha AAAA-MM-DD.']);
    }
}
