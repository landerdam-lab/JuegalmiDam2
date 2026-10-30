<?php

namespace App\Tests\Api;

/** Pedidos: stock, copias de alquiler, transacción, permisos y ubicación. */
final class PedidoTest extends ApiTestCase
{
    public function testSinUbicacionNoSePuedePedir(): void
    {
        [$estado, $json] = $this->peticion('POST', '/api/pedidos', ['metodoPago' => 'tarjeta', 'lineas' => []], 'cliente1', false);

        self::assertSame(422, $estado);
        self::assertArrayHasKey('ubicacion', $json['error']['campos']);
    }

    public function testPedidoConCompraYAlquilerRestaStockYCalculaElTotal(): void
    {
        $redmi = $this->productoPorNombre('Xiaomi Redmi Note 15 Pro');
        $forza = $this->productoPorNombre('Forza Horizon 5');

        [$estado, $pedido] = $this->peticion('POST', '/api/pedidos', ['metodoPago' => 'bizum', 'lineas' => [
            ['productoId' => $redmi['id'], 'tipo' => 'compra', 'cantidad' => 2],
            ['productoId' => $forza['id'], 'tipo' => 'alquiler', 'dias' => 7],
        ]], 'cliente2');

        self::assertSame(201, $estado);
        self::assertSame('pendiente', $pedido['estado']);
        self::assertSame(349.0, $pedido['compras'][0]['precioUnitario']); // el precio lo pone la API
        self::assertSame(7, $pedido['alquileres'][0]['dias']);
        self::assertSame(2 * 349.0 + 7 * 2.0, $pedido['total']);
        self::assertSame($redmi['stock'] - 2, $this->productoPorNombre('Xiaomi Redmi Note 15 Pro')['stock']);

        // Se ha registrado la ubicación de la petición (ADR-014)
        [, $registros] = $this->peticion('GET', '/api/registros-ubicacion?limit=100', null, 'admin');
        $rutas = array_column($registros['items'], 'ruta');
        self::assertContains('/api/pedidos', $rutas);
    }

    public function testPorDefectoSeRecogeEnLaTienda(): void
    {
        $redmi = $this->productoPorNombre('Xiaomi Redmi Note 15 Pro');
        [$estado, $pedido] = $this->peticion('POST', '/api/pedidos', ['metodoPago' => 'tarjeta', 'lineas' => [
            ['productoId' => $redmi['id'], 'tipo' => 'compra', 'cantidad' => 1],
        ]], 'cliente1');

        self::assertSame(201, $estado);
        self::assertSame('tienda', $pedido['entrega']);
        self::assertNull($pedido['direccionEntrega']);
        self::assertNull($pedido['latitudEntrega']);
    }

    public function testEnvioADomicilioGuardaLaDireccionYElPunto(): void
    {
        $redmi = $this->productoPorNombre('Xiaomi Redmi Note 15 Pro');
        [$estado, $pedido] = $this->peticion('POST', '/api/pedidos', [
            'metodoPago' => 'tarjeta',
            'entrega' => 'domicilio',
            'direccionEntrega' => 'Calle Autonomía 10, 3.º B, 48012 Bilbao',
            'latitudEntrega' => 43.2581234,
            'longitudEntrega' => -2.9381234,
            'lineas' => [['productoId' => $redmi['id'], 'tipo' => 'compra', 'cantidad' => 1]],
        ], 'cliente1');

        self::assertSame(201, $estado);
        self::assertSame('domicilio', $pedido['entrega']);
        self::assertSame('Calle Autonomía 10, 3.º B, 48012 Bilbao', $pedido['direccionEntrega']);
        self::assertSame(43.2581234, $pedido['latitudEntrega']);
        self::assertSame(-2.9381234, $pedido['longitudEntrega']);
    }

    public function testADomicilioSinDireccionNiPuntoNoSeGuardaNada(): void
    {
        $redmi = $this->productoPorNombre('Xiaomi Redmi Note 15 Pro');
        [$estado, $json] = $this->peticion('POST', '/api/pedidos', ['metodoPago' => 'tarjeta', 'entrega' => 'domicilio',
            'lineas' => [['productoId' => $redmi['id'], 'tipo' => 'compra', 'cantidad' => 1]]], 'cliente1');

        self::assertSame(422, $estado);
        self::assertArrayHasKey('direccionEntrega', $json['error']['campos']);
        self::assertArrayHasKey('ubicacionEntrega', $json['error']['campos']);
        // No se ha tocado el stock
        self::assertSame($redmi['stock'], $this->productoPorNombre('Xiaomi Redmi Note 15 Pro')['stock']);

        [$estado, $json] = $this->peticion('POST', '/api/pedidos', ['metodoPago' => 'tarjeta', 'entrega' => 'dron',
            'lineas' => [['productoId' => $redmi['id'], 'tipo' => 'compra', 'cantidad' => 1]]], 'cliente1');
        self::assertSame(422, $estado);
        self::assertArrayHasKey('entrega', $json['error']['campos']);
    }

    public function testSiFaltaStockNoSeGuardaNada(): void
    {
        $ipad = $this->productoPorNombre('iPad Air 11"');
        $gt7 = $this->productoPorNombre('Gran Turismo 7');

        [$estado, $json] = $this->peticion('POST', '/api/pedidos', ['metodoPago' => 'tarjeta', 'lineas' => [
            ['productoId' => $ipad['id'], 'tipo' => 'compra', 'cantidad' => 1],
            ['productoId' => $gt7['id'], 'tipo' => 'compra', 'cantidad' => 999],
        ]], 'cliente1');

        self::assertSame(409, $estado);
        self::assertSame('STOCK_INSUFICIENTE', $json['error']['codigo']);
        // Transacción: la primera línea tampoco ha restado stock
        self::assertSame($ipad['stock'], $this->productoPorNombre('iPad Air 11"')['stock']);
    }

    public function testSinCopiasLibresNoSeAlquila(): void
    {
        $gt7 = $this->productoPorNombre('Gran Turismo 7');
        [$estado, $json] = $this->peticion('POST', '/api/pedidos', ['metodoPago' => 'tarjeta', 'lineas' => [
            ['productoId' => $gt7['id'], 'tipo' => 'alquiler', 'dias' => 3],
        ]], 'cliente1');

        self::assertSame(409, $estado);
        self::assertSame('SIN_COPIAS', $json['error']['codigo']);
    }

    public function testSoloSeAlquilanVideojuegosYEntre1Y14Dias(): void
    {
        $ps5 = $this->productoPorNombre('PlayStation 5 Slim');
        $halo = $this->productoPorNombre('Halo Infinite');

        [$estado] = $this->peticion('POST', '/api/pedidos', ['metodoPago' => 'tarjeta', 'lineas' => [
            ['productoId' => $ps5['id'], 'tipo' => 'alquiler', 'dias' => 3]]], 'cliente1');
        self::assertSame(422, $estado);

        [$estado, $json] = $this->peticion('POST', '/api/pedidos', ['metodoPago' => 'tarjeta', 'lineas' => [
            ['productoId' => $halo['id'], 'tipo' => 'alquiler', 'dias' => 30]]], 'cliente1');
        self::assertSame(422, $estado);
        self::assertArrayHasKey('lineas[0].dias', $json['error']['campos']);
    }

    public function testCadaClienteSoloVeSusPedidos(): void
    {
        [, $propios] = $this->peticion('GET', '/api/pedidos', null, 'cliente3');
        foreach ($propios['items'] as $pedido) {
            self::assertSame('cliente3@juegalmi.test', $pedido['cliente']['email']);
        }
        [, $deOtro] = $this->peticion('GET', '/api/pedidos', null, 'cliente1');
        [$estado] = $this->peticion('GET', '/api/pedidos/'.$deOtro['items'][0]['id'], null, 'cliente3');
        self::assertSame(403, $estado);

        // Los técnicos no ven pedidos
        self::assertSame(403, $this->peticion('GET', '/api/pedidos', null, 'tecnico.consolas1')[0]);
    }

    public function testCancelarDevuelveElStockYLiberaLasCopias(): void
    {
        $tlou = $this->productoPorNombre('The Last of Us Parte II');
        [, $pedido] = $this->peticion('POST', '/api/pedidos', ['metodoPago' => 'en_tienda', 'lineas' => [
            ['productoId' => $tlou['id'], 'tipo' => 'compra', 'cantidad' => 1],
            ['productoId' => $tlou['id'], 'tipo' => 'alquiler', 'dias' => 2],
        ]], 'cliente3');
        self::assertSame($tlou['copiasDisponibles'] - 1, $this->productoPorNombre('The Last of Us Parte II')['copiasDisponibles']);

        // El cliente no puede marcarlo como entregado, pero sí cancelarlo
        self::assertSame(403, $this->peticion('PUT', '/api/pedidos/'.$pedido['id'], ['estado' => 'entregado'], 'cliente3')[0]);
        [$estado, $json] = $this->peticion('PUT', '/api/pedidos/'.$pedido['id'], ['estado' => 'cancelado'], 'cliente3');
        self::assertSame(200, $estado);
        self::assertSame('cancelado', $json['alquileres'][0]['estado']);

        $despues = $this->productoPorNombre('The Last of Us Parte II');
        self::assertSame($tlou['stock'], $despues['stock']);
        self::assertSame($tlou['copiasDisponibles'], $despues['copiasDisponibles']);

        // Un pedido cancelado ya no cambia de estado
        self::assertSame(422, $this->peticion('PUT', '/api/pedidos/'.$pedido['id'], ['estado' => 'preparado'], 'admin')[0]);
    }

    public function testAlquileresRetrasadosYDevolucionSoloAdmin(): void
    {
        [, $retrasados] = $this->peticion('GET', '/api/alquileres?estado=retrasado', null, 'cliente1');
        self::assertSame(1, $retrasados['total']);
        $id = $retrasados['items'][0]['id'];

        self::assertSame(403, $this->peticion('PUT', '/api/alquileres/'.$id, [], 'cliente1')[0]); // P-16
        [$estado, $json] = $this->peticion('PUT', '/api/alquileres/'.$id, ['fechaDevolucion' => (new \DateTimeImmutable('today'))->format('Y-m-d')], 'admin');
        self::assertSame(200, $estado);
        self::assertSame('devuelto', $json['estado']);
    }
}
