<?php

namespace App\Service;

use App\Http\ApiException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Validator\Constraints\Image;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Imágenes como ficheros + ruta en la BBDD (ADR-019).
 * - En la BBDD se guarda la ruta relativa: "uploads/productos/ab12cd34.jpg".
 * - En el JSON se envía la URL completa, construida con el host de la petición
 *   (así funciona igual desde el emulador, la red local o AWS).
 */
final class Imagenes
{
    public const CARPETAS = ['productos', 'usuarios', 'reparaciones', 'tienda'];
    private const PATRON_RUTA = '#^uploads/[a-z0-9_\-/]+\.(jpe?g|png|webp)$#';

    public function __construct(
        private readonly string $uploadsDir,
        private readonly RequestStack $requestStack,
        private readonly ValidatorInterface $validator,
    ) {
    }

    /** Guarda el fichero subido y devuelve su ruta relativa. */
    public function guardar(UploadedFile $fichero, string $carpeta): string
    {
        $errores = $this->validator->validate($fichero, new Image(
            maxSize: '5M',
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            mimeTypesMessage: 'La imagen tiene que ser JPG, PNG o WEBP.',
        ));
        if (count($errores) > 0) {
            throw ApiException::validacion(['imagen' => (string) $errores[0]->getMessage()]);
        }

        $extension = $fichero->guessExtension() ?? 'jpg';
        $nombre = bin2hex(random_bytes(8)).'.'.$extension; // nombre aleatorio: no se puede adivinar ni pisar
        $fichero->move($this->uploadsDir.'/'.$carpeta, $nombre);

        return 'uploads/'.$carpeta.'/'.$nombre;
    }

    /**
     * La app puede mandar la URL completa que le devolvió POST /api/imagenes o la ruta relativa.
     * Se guarda siempre la ruta relativa. Cualquier otra cosa → 422 en ese campo.
     */
    public function aRuta(?string $valor, string $campo): ?string
    {
        if ($valor === null || $valor === '') {
            return null;
        }
        $posicion = strpos($valor, 'uploads/');
        $ruta = $posicion === false ? $valor : substr($valor, $posicion);
        if (!preg_match(self::PATRON_RUTA, $ruta) || str_contains($ruta, '..')) {
            throw ApiException::validacion([$campo => 'La imagen no es válida: súbela antes con POST /api/imagenes.']);
        }

        return $ruta;
    }

    /** Ruta relativa → URL completa para el JSON (o null). */
    public function url(?string $ruta): ?string
    {
        if ($ruta === null || $ruta === '') {
            return null;
        }
        $request = $this->requestStack->getMainRequest();
        $base = $request !== null ? $request->getSchemeAndHttpHost().$request->getBasePath() : '';

        return $base.'/'.ltrim($ruta, '/');
    }
}
