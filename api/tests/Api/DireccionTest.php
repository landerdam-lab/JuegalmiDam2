<?php

namespace App\Tests\Api;

/** Búsqueda de la dirección de entrega (ADR-040), con Nominatim sustituido por GeocodificadorFalso. */
final class DireccionTest extends ApiTestCase
{
    public function testHaceFaltaToken(): void
    {
        [$estado] = $this->peticion('GET', '/api/direcciones?texto=Gran+Via+1');

        self::assertSame(401, $estado);
    }

    public function testDevuelveLasCoordenadas(): void
    {
        [$estado, $json] = $this->peticion('GET', '/api/direcciones?texto=Gran+Via+1', null, 'cliente1');

        self::assertSame(200, $estado);
        self::assertSame(43.2630126, $json['latitud']);
        self::assertSame(-2.9349852, $json['longitud']);
        self::assertSame('Gran Via 1, Bilbao', $json['direccion']);
    }

    public function testTextoDemasiadoCorto(): void
    {
        [$estado, $json] = $this->peticion('GET', '/api/direcciones?texto=abc', null, 'cliente1');

        self::assertSame(422, $estado);
        self::assertArrayHasKey('texto', $json['error']['campos']);
    }

    public function testDireccionQueNoExiste(): void
    {
        [$estado, $json] = $this->peticion('GET', '/api/direcciones?texto=calle+inexistente', null, 'cliente1');

        self::assertSame(404, $estado);
        self::assertSame('NO_ENCONTRADO', $json['error']['codigo']);
    }

    public function testServicioCaido(): void
    {
        [$estado, $json] = $this->peticion('GET', '/api/direcciones?texto=servicio+caido', null, 'cliente1');

        self::assertSame(503, $estado);
        self::assertSame('GEOCODIFICACION_NO_DISPONIBLE', $json['error']['codigo']);
    }
}
