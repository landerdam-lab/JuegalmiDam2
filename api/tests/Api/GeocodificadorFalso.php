<?php

namespace App\Tests\Api;

use App\Http\ApiException;
use App\Service\Geocodificador;

/** Sustituye a Nominatim en las pruebas: así no dependen de la red ni de un servicio externo. */
final class GeocodificadorFalso extends Geocodificador
{
    protected function consultar(string $texto): ?array
    {
        if (str_contains($texto, 'caido')) {
            throw new ApiException(503, 'GEOCODIFICACION_NO_DISPONIBLE', 'No se ha podido buscar la dirección.');
        }
        if (str_contains($texto, 'inexistente')) {
            return null;
        }

        return ['latitud' => 43.2630126, 'longitud' => -2.9349852, 'direccion' => $texto.', Bilbao'];
    }
}
