<?php

namespace App\Tests\Api;

use App\DataFixtures\AppFixtures;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Base de las pruebas de la API: peticiones HTTP de verdad contra el kernel, con la BBDD de pruebas.
 * Cada clase de pruebas empieza con los datos de ejemplo recién cargados.
 */
abstract class ApiTestCase extends WebTestCase
{
    /** Ubicación de ejemplo (centro de Bilbao) que mandan las apps en cada petición. */
    protected const UBICACION = ['HTTP_X_LATITUD' => '43.2630126', 'HTTP_X_LONGITUD' => '-2.9349852'];

    protected KernelBrowser $cliente;
    /** @var array<string, string> email => token, para no hacer login en cada prueba */
    private static array $tokens = [];

    public static function setUpBeforeClass(): void
    {
        passthru(sprintf('php "%s/bin/console" doctrine:fixtures:load --env=test --no-interaction --quiet', dirname(__DIR__, 2)));
        self::$tokens = [];
    }

    protected function setUp(): void
    {
        $this->cliente = static::createClient();
    }

    /**
     * Hace una petición y devuelve [código HTTP, JSON decodificado].
     *
     * @return array{0: int, 1: mixed}
     */
    protected function peticion(string $metodo, string $url, ?array $cuerpo = null, ?string $quien = null, bool $conUbicacion = true): array
    {
        $cabeceras = ['CONTENT_TYPE' => 'application/json'] + ($conUbicacion ? self::UBICACION : []);
        if ($quien !== null) {
            $cabeceras['HTTP_AUTHORIZATION'] = 'Bearer '.$this->token($quien);
        }
        $this->cliente->request($metodo, $url, [], [], $cabeceras, $cuerpo === null ? null : json_encode($cuerpo));
        $respuesta = $this->cliente->getResponse();

        return [$respuesta->getStatusCode(), json_decode((string) $respuesta->getContent(), true)];
    }

    /** Token de un usuario de los datos de ejemplo (p. ej. "cliente1" → cliente1@juegalmi.test). */
    protected function token(string $quien): string
    {
        $email = str_contains($quien, '@') ? $quien : $quien.'@juegalmi.test';
        if (!isset(self::$tokens[$email])) {
            $this->cliente->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'],
                json_encode(['email' => $email, 'password' => AppFixtures::PASSWORD_DEMO]));
            $json = json_decode((string) $this->cliente->getResponse()->getContent(), true);
            self::assertArrayHasKey('token', $json, 'No se ha podido iniciar sesión como '.$email);
            self::$tokens[$email] = $json['token'];
        }

        return self::$tokens[$email];
    }

    /** Busca un producto del catálogo por nombre (los id cambian al recargar los datos). */
    protected function productoPorNombre(string $nombre, string $quien = 'admin'): array
    {
        [, $json] = $this->peticion('GET', '/api/productos?limit=100&q='.urlencode($nombre), null, $quien);
        foreach ($json['items'] as $producto) {
            if ($producto['nombre'] === $nombre) {
                return $producto;
            }
        }
        self::fail('No existe el producto '.$nombre);
    }
}
