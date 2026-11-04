<?php

namespace App\Service;

use App\Http\ApiException;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * Convierte una dirección escrita en coordenadas con Nominatim (OpenStreetMap), sin clave.
 * Va en la API y no en cada app para tener un solo código y que Nominatim no vea la IP del móvil.
 * Su política de uso pide identificar la aplicación, guardar los resultados y no buscar mientras se
 * escribe: por eso hay User-Agent y caché, y las apps solo buscan al pulsar el botón o al confirmar.
 */
class Geocodificador
{
    private const URL = 'https://nominatim.openstreetmap.org/search';
    private const USER_AGENT = 'AlmiCompanion/1.0 (proyecto academico DAM2)';
    private const SEGUNDOS_ESPERA = 5;
    private const SEGUNDOS_CACHE = 2592000; // 30 días

    public function __construct(private readonly CacheInterface $cache)
    {
    }

    /**
     * @return array{latitud: float, longitud: float, direccion: string}|null null si no la encuentra
     *
     * @throws ApiException 503 si no se puede consultar el servicio (ese caso no se guarda en la caché)
     */
    public function buscar(string $texto): ?array
    {
        $clave = 'direccion_'.sha1(mb_strtolower(trim($texto)));

        return $this->cache->get($clave, function (ItemInterface $item) use ($texto): ?array {
            $item->expiresAfter(self::SEGUNDOS_CACHE);

            return $this->consultar($texto);
        });
    }

    /** @return array{latitud: float, longitud: float, direccion: string}|null */
    protected function consultar(string $texto): ?array
    {
        $url = self::URL.'?'.http_build_query([
            'q' => $texto,
            'format' => 'jsonv2',
            'limit' => 1,
            'countrycodes' => 'es',
            'accept-language' => 'es',
        ]);
        $contexto = stream_context_create(['http' => [
            'timeout' => self::SEGUNDOS_ESPERA,
            'user_agent' => self::USER_AGENT,
        ]]);

        $respuesta = @file_get_contents($url, false, $contexto);
        $lista = $respuesta === false ? null : json_decode($respuesta, true);
        if (!is_array($lista)) {
            throw new ApiException(503, 'GEOCODIFICACION_NO_DISPONIBLE', 'No se ha podido buscar la dirección. Marca el punto tocando el mapa.');
        }
        if ($lista === []) {
            return null;
        }

        return [
            'latitud' => (float) $lista[0]['lat'],
            'longitud' => (float) $lista[0]['lon'],
            'direccion' => (string) $lista[0]['display_name'],
        ];
    }
}
