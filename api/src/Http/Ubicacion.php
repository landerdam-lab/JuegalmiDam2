<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\Request;

/**
 * Lee la ubicación que las apps mandan en CADA petición (ADR-014):
 *   X-Latitud: 43.2630126   X-Longitud: -2.9349852
 */
final class Ubicacion
{
    /** @return array{0: string, 1: string}|null [latitud, longitud] con 7 decimales, o null si faltan o no son válidas */
    public static function desdeCabeceras(Request $request): ?array
    {
        $lat = $request->headers->get('X-Latitud');
        $lon = $request->headers->get('X-Longitud');
        if (!is_numeric($lat) || !is_numeric($lon)) {
            return null;
        }
        $lat = (float) $lat;
        $lon = (float) $lon;
        if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
            return null;
        }

        return [number_format($lat, 7, '.', ''), number_format($lon, 7, '.', '')];
    }

    /**
     * P-28: pedir o solicitar una reparación SIN ubicación no se permite (422).
     * La app debe pedir el permiso y explicar por qué.
     */
    public static function exigir(Request $request): void
    {
        if (self::desdeCabeceras($request) === null) {
            throw ApiException::validacion(
                ['ubicacion' => 'Activa la ubicación del móvil: la tienda necesita saber desde dónde haces la operación.'],
                'Falta la ubicación (cabeceras X-Latitud y X-Longitud)',
            );
        }
    }
}
