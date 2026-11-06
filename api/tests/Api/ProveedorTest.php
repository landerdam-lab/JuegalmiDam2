<?php

namespace App\Tests\Api;

/** Proveedores y precio de coste (ADR-042): solo para el admin. */
final class ProveedorTest extends ApiTestCase
{
    public function testSoloElAdminVeLosProveedores(): void
    {
        self::assertSame(401, $this->peticion('GET', '/api/proveedores')[0]);
        self::assertSame(403, $this->peticion('GET', '/api/proveedores', null, 'cliente1')[0]);
        self::assertSame(403, $this->peticion('GET', '/api/proveedores', null, 'tecnico.consolas1')[0]);

        [$codigo, $json] = $this->peticion('GET', '/api/proveedores', null, 'admin');
        self::assertSame(200, $codigo);
        $porNombre = array_column($json, null, 'nombre');
        self::assertSame(0, $porNombre['Retro Import S.L.']['numProductos']);
        self::assertGreaterThan(0, $porNombre['Distribuciones Gamer Norte S.L.']['numProductos']);
    }

    public function testElCatalogoNoMuestraElPrecioDeCoste(): void
    {
        $mario = $this->productoPorNombre('Mario Kart World', 'cliente1');
        self::assertArrayNotHasKey('proveedores', $mario);
        self::assertArrayNotHasKey('precioCoste', $mario);
        // Ni sin token (web pública) ni con token de cliente
        self::assertSame(401, $this->peticion('GET', '/api/productos/'.$mario['id'].'/proveedores')[0]);
        self::assertSame(403, $this->peticion('GET', '/api/productos/'.$mario['id'].'/proveedores', null, 'cliente1')[0]);
    }

    public function testUnProductoConDosProveedores(): void
    {
        $mario = $this->productoPorNombre('Mario Kart World');
        [$codigo, $json] = $this->peticion('GET', '/api/productos/'.$mario['id'].'/proveedores', null, 'admin');
        self::assertSame(200, $codigo);
        self::assertCount(2, $json);
        // El más barato primero: 79,99 × 0,68 = 54,39 (Iberia) y × 0,70 = 55,99 (Gamer Norte)
        self::assertSame(54.39, $json[0]['precioCoste']);
        self::assertSame('Consolas y Accesorios Iberia S.A.', $json[0]['proveedor']['nombre']);
        self::assertSame(55.99, $json[1]['precioCoste']);
    }

    public function testAdminCreaEditaYBorraUnProveedor(): void
    {
        [$codigo, $nuevo] = $this->peticion('POST', '/api/proveedores', [
            'nombre' => 'Móviles Express S.L.', 'cif' => 'b 4811122-3', 'telefono' => '944999000',
            'email' => 'Hola@MovilesExpress.test',
        ], 'admin');
        self::assertSame(201, $codigo);
        self::assertSame('B48111223', $nuevo['cif']); // normalizado
        self::assertSame('hola@movilesexpress.test', $nuevo['email']);
        self::assertNull($nuevo['direccion']);
        self::assertSame(0, $nuevo['numProductos']);

        [$codigo, $editado] = $this->peticion('PUT', '/api/proveedores/'.$nuevo['id'], ['direccion' => 'Gran Vía 1, Bilbao'], 'admin');
        self::assertSame(200, $codigo);
        self::assertSame('Gran Vía 1, Bilbao', $editado['direccion']);
        self::assertSame('Móviles Express S.L.', $editado['nombre']); // lo no enviado no cambia

        // Asignar un producto (201), cambiar su precio (200) y verlo desde el proveedor
        $pixel = $this->productoPorNombre('Google Pixel 10');
        $url = '/api/productos/'.$pixel['id'].'/proveedores/'.$nuevo['id'];
        self::assertSame(201, $this->peticion('PUT', $url, ['precioCoste' => 600], 'admin')[0]);
        [$codigo, $fila] = $this->peticion('PUT', $url, ['precioCoste' => '615.50'], 'admin');
        self::assertSame(200, $codigo);
        self::assertSame(615.5, $fila['precioCoste']);

        [, $conProductos] = $this->peticion('GET', '/api/proveedores/'.$nuevo['id'], null, 'admin');
        self::assertSame(1, $conProductos['numProductos']);
        self::assertSame('Google Pixel 10', $conProductos['productos'][0]['producto']['nombre']);
        self::assertSame(799.0, $conProductos['productos'][0]['producto']['precio']);

        // Con productos no se borra; al quitárselos, sí
        self::assertSame(409, $this->peticion('DELETE', '/api/proveedores/'.$nuevo['id'], null, 'admin')[0]);
        self::assertSame(204, $this->peticion('DELETE', $url, null, 'admin')[0]);
        self::assertSame(404, $this->peticion('DELETE', $url, null, 'admin')[0]);
        self::assertSame(204, $this->peticion('DELETE', '/api/proveedores/'.$nuevo['id'], null, 'admin')[0]);
        self::assertSame(404, $this->peticion('GET', '/api/proveedores/'.$nuevo['id'], null, 'admin')[0]);
    }

    public function testValidacionDelProveedorYDelPrecioDeCoste(): void
    {
        [$codigo, $json] = $this->peticion('POST', '/api/proveedores', [
            'nombre' => '', 'cif' => '12345678Z', 'telefono' => '944', 'email' => 'no-es-un-email',
        ], 'admin');
        self::assertSame(422, $codigo);
        self::assertArrayHasKey('nombre', $json['error']['campos']);
        self::assertArrayHasKey('cif', $json['error']['campos']); // un DNI no es un CIF
        self::assertArrayHasKey('email', $json['error']['campos']);

        // CIF repetido
        [$codigo, $json] = $this->peticion('POST', '/api/proveedores', [
            'nombre' => 'Copia', 'cif' => 'B95123456', 'telefono' => '944', 'email' => 'copia@x.test',
        ], 'admin');
        self::assertSame(422, $codigo);
        self::assertArrayHasKey('cif', $json['error']['campos']);

        // Precio de coste negativo u omitido
        [, $proveedores] = $this->peticion('GET', '/api/proveedores', null, 'admin');
        $retro = array_column($proveedores, null, 'nombre')['Retro Import S.L.'];
        $url = '/api/productos/'.$this->productoPorNombre('Tekken 8')['id'].'/proveedores/'.$retro['id'];
        self::assertSame(422, $this->peticion('PUT', $url, ['precioCoste' => -1], 'admin')[0]);
        self::assertSame(422, $this->peticion('PUT', $url, [], 'admin')[0]);
        self::assertSame(404, $this->peticion('PUT', '/api/productos/999999/proveedores/'.$retro['id'], ['precioCoste' => 1], 'admin')[0]);
    }

    public function testBorrarUnProductoBorraSusProveedores(): void
    {
        [, $marcas] = $this->peticion('GET', '/api/marcas');
        [, $plataformas] = $this->peticion('GET', '/api/plataformas');
        [, $juego] = $this->peticion('POST', '/api/videojuegos', [
            'nombre' => 'Juego de prueba', 'descripcion' => 'Prueba', 'precio' => 10, 'stock' => 1,
            'imagen' => 'uploads/ejemplo/productos/fc26.jpg', 'marcaId' => $marcas[0]['id'],
            'plataformaId' => $plataformas[0]['id'], 'genero' => 'Acción', 'pegi' => 7, 'precioAlquiler' => 1, 'copiasAlquiler' => 0,
        ], 'admin');
        [, $proveedores] = $this->peticion('GET', '/api/proveedores', null, 'admin');
        $retro = array_column($proveedores, null, 'nombre')['Retro Import S.L.'];
        self::assertSame(201, $this->peticion('PUT', '/api/productos/'.$juego['id'].'/proveedores/'.$retro['id'], ['precioCoste' => 5], 'admin')[0]);

        // CASCADE: el producto se borra y el proveedor vuelve a quedarse sin productos (y se puede borrar)
        self::assertSame(204, $this->peticion('DELETE', '/api/videojuegos/'.$juego['id'], null, 'admin')[0]);
        self::assertSame(0, $this->peticion('GET', '/api/proveedores/'.$retro['id'], null, 'admin')[1]['numProductos']);
    }
}
