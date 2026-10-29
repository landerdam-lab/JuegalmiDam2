<?php

namespace App\Tests\Api;

/** Catálogo público y con token, copias disponibles y CRUD del admin. */
final class CatalogoTest extends ApiTestCase
{
    public function testCatalogoPublicoSinStockExacto(): void
    {
        [$estado, $json] = $this->peticion('GET', '/api/videojuegos?limit=5');

        self::assertSame(200, $estado);
        self::assertSame(5, count($json['items']));
        self::assertArrayHasKey('disponible', $json['items'][0]);
        self::assertArrayNotHasKey('stock', $json['items'][0]); // ADR-028
    }

    public function testConTokenIncluyeStockYCopias(): void
    {
        [, $json] = $this->peticion('GET', '/api/videojuegos?limit=50', null, 'cliente1');

        self::assertArrayHasKey('stock', $json['items'][0]);
        $porNombre = array_column($json['items'], null, 'nombre');
        // Las 2 copias de Gran Turismo 7 están alquiladas
        self::assertSame(0, $porNombre['Gran Turismo 7']['copiasDisponibles']);
        // El alquiler de Halo es de un pedido CANCELADO: no ocupa copia (ADR-034)
        self::assertSame(2, $porNombre['Halo Infinite']['copiasDisponibles']);
    }

    public function testProductoRetiradoNoSaleEnElCatalogo(): void
    {
        [, $json] = $this->peticion('GET', '/api/consolas', null, 'cliente1');
        self::assertNotContains('Xbox Series S', array_column($json['items'], 'nombre'));

        [, $json] = $this->peticion('GET', '/api/consolas?activo=0', null, 'admin');
        self::assertSame(['Xbox Series S'], array_column($json['items'], 'nombre'));
    }

    public function testFiltrosDelCatalogo(): void
    {
        [, $json] = $this->peticion('GET', '/api/moviles?formato=tablet', null, 'cliente1');
        self::assertSame(4, $json['total']);

        [$estado] = $this->peticion('GET', '/api/moviles?formato=reloj', null, 'cliente1');
        self::assertSame(422, $estado);
    }

    public function testElClienteNoPuedeCrearProductos(): void
    {
        [$estado, $json] = $this->peticion('POST', '/api/consolas', ['nombre' => 'X'], 'cliente1');

        self::assertSame(403, $estado);
        self::assertSame('PROHIBIDO', $json['error']['codigo']);
    }

    public function testAdminCreaEditaYBorraUnVideojuego(): void
    {
        [, $marcas] = $this->peticion('GET', '/api/marcas');
        [, $plataformas] = $this->peticion('GET', '/api/plataformas');
        $nuevo = ['nombre' => 'Juego de prueba', 'descripcion' => 'Prueba', 'precio' => 10, 'stock' => 3,
            'imagen' => 'uploads/ejemplo/productos/fc26.jpg', 'marcaId' => $marcas[0]['id'],
            'genero' => 'Puzle', 'pegi' => 7, 'precioAlquiler' => 1.5, 'copiasAlquiler' => 1, 'plataformaId' => $plataformas[0]['id']];

        [$estado, $json] = $this->peticion('POST', '/api/videojuegos', $nuevo, 'admin');
        self::assertSame(201, $estado);
        self::assertSame('videojuego', $json['tipo']);
        $id = $json['id'];

        [$estado, $json] = $this->peticion('PUT', '/api/videojuegos/'.$id, ['precio' => '12.50'], 'admin');
        self::assertSame(200, $estado);
        self::assertSame(12.5, $json['precio']);

        [$estado] = $this->peticion('DELETE', '/api/videojuegos/'.$id, null, 'admin');
        self::assertSame(204, $estado);
    }

    public function testValidacionDevuelveLosCamposMal(): void
    {
        [, $marcas] = $this->peticion('GET', '/api/marcas');
        [, $plataformas] = $this->peticion('GET', '/api/plataformas');
        [$estado, $json] = $this->peticion('POST', '/api/videojuegos', ['nombre' => '', 'pegi' => 5, 'precio' => -1,
            'marcaId' => $marcas[0]['id'], 'plataformaId' => $plataformas[0]['id']], 'admin');

        self::assertSame(422, $estado);
        self::assertSame('VALIDACION', $json['error']['codigo']);
        self::assertArrayHasKey('pegi', $json['error']['campos']);
        self::assertArrayHasKey('precio', $json['error']['campos']);
    }

    public function testNoSeBorraUnProductoConVentas(): void
    {
        $fc26 = $this->productoPorNombre('EA Sports FC 26');
        [$estado, $json] = $this->peticion('DELETE', '/api/videojuegos/'.$fc26['id'], null, 'admin');

        self::assertSame(409, $estado);
        self::assertSame('EN_USO', $json['error']['codigo']);
    }

    public function testMarcaConProductosNoSeBorraYSinProductosSi(): void
    {
        [, $marcas] = $this->peticion('GET', '/api/marcas');
        $porNombre = array_column($marcas, 'id', 'nombre');

        self::assertSame(409, $this->peticion('DELETE', '/api/marcas/'.$porNombre['Sony'], null, 'admin')[0]);
        self::assertSame(204, $this->peticion('DELETE', '/api/marcas/'.$porNombre['Nokia'], null, 'admin')[0]);
    }

    public function testTiendaYServiciosPorLinea(): void
    {
        [, $tiendas] = $this->peticion('GET', '/api/tiendas');
        [$estado, $tienda] = $this->peticion('GET', '/api/tiendas/'.$tiendas[0]['id']);
        self::assertSame(200, $estado);
        self::assertCount(8, $tienda['fotos']);
        self::assertStringStartsWith('http', $tienda['fotos'][0]['imagen']);

        [, $servicios] = $this->peticion('GET', '/api/servicios?linea=telefonia');
        self::assertCount(4, $servicios);
    }
}
