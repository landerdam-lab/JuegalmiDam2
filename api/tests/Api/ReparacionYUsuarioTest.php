<?php

namespace App\Tests\Api;

/** Reparaciones (asignación de técnico, departamento, estados) y gestión de usuarios del admin. */
final class ReparacionYUsuarioTest extends ApiTestCase
{
    public function testNuevaReparacionSeAsignaAlTecnicoConMenosCarga(): void
    {
        [, $departamentos] = $this->peticion('GET', '/api/departamentos', null, 'cliente2');
        $consolas = array_column($departamentos, 'id', 'nombre')['Consolas'];

        [$estado, $json] = $this->peticion('POST', '/api/reparaciones',
            ['departamentoId' => $consolas, 'dispositivo' => 'Mando Xbox', 'problema' => 'No conecta por Bluetooth'], 'cliente2');

        self::assertSame(201, $estado);
        self::assertSame('recibida', $json['estado']);
        self::assertSame('Consolas', $json['departamento']['nombre']);
        // Iker tiene 1 abierta y Nerea 1 (la otra está entregada) → empate: el de id más bajo (Iker)
        self::assertSame('Iker', $json['tecnico']['nombre']);
    }

    public function testTecnicoSoloVeSuDepartamento(): void
    {
        [, $json] = $this->peticion('GET', '/api/reparaciones?limit=50', null, 'tecnico.telefonia1');
        self::assertNotEmpty($json['items']);
        foreach ($json['items'] as $r) {
            self::assertSame('Telefonía', $r['departamento']['nombre']);
        }

        [, $todas] = $this->peticion('GET', '/api/reparaciones?limit=50', null, 'admin');
        $deConsolas = array_values(array_filter($todas['items'], fn ($r) => $r['departamento']['nombre'] === 'Consolas'));
        self::assertSame(403, $this->peticion('GET', '/api/reparaciones/'.$deConsolas[0]['id'], null, 'tecnico.telefonia1')[0]);
    }

    public function testTransicionesDeEstado(): void
    {
        [, $json] = $this->peticion('GET', '/api/reparaciones?estado=lista', null, 'tecnico.telefonia1');
        $id = $json['items'][0]['id'];

        // lista → recibida no se permite
        self::assertSame(422, $this->peticion('PUT', '/api/reparaciones/'.$id, ['estado' => 'recibida'], 'tecnico.telefonia1')[0]);
        // lista → entregada sí, y pone la fecha de salida
        [$estado, $json] = $this->peticion('PUT', '/api/reparaciones/'.$id, ['estado' => 'entregada'], 'tecnico.telefonia1');
        self::assertSame(200, $estado);
        self::assertNotNull($json['fechaSalida']);
        // El técnico no puede reasignar
        self::assertSame(403, $this->peticion('PUT', '/api/reparaciones/'.$id, ['tecnicoId' => 1], 'tecnico.telefonia1')[0]);
    }

    public function testElClienteSoloPuedeCancelarLaSuya(): void
    {
        [, $json] = $this->peticion('GET', '/api/reparaciones?estado=recibida', null, 'cliente1');
        $id = $json['items'][0]['id'];

        self::assertSame(403, $this->peticion('PUT', '/api/reparaciones/'.$id, ['presupuesto' => 1], 'cliente1')[0]);
        self::assertSame(403, $this->peticion('PUT', '/api/reparaciones/'.$id, ['estado' => 'cancelada'], 'cliente2')[0]);
        [$estado, $json] = $this->peticion('PUT', '/api/reparaciones/'.$id, ['estado' => 'cancelada'], 'cliente1');
        self::assertSame(200, $estado);
        self::assertSame('cancelada', $json['estado']);
    }

    public function testGestionDeUsuariosSoloAdmin(): void
    {
        self::assertSame(403, $this->peticion('GET', '/api/usuarios', null, 'cliente1')[0]);
        self::assertSame(403, $this->peticion('GET', '/api/trabajadores', null, 'tecnico.consolas1')[0]);

        [$estado, $json] = $this->peticion('GET', '/api/trabajadores?puesto=tecnico', null, 'admin');
        self::assertSame(200, $estado);
        self::assertSame(4, $json['total']);
        self::assertArrayHasKey('reparacionesAbiertas', $json['items'][0]);
    }

    public function testUnTecnicoNecesitaDepartamento(): void
    {
        [$estado, $json] = $this->peticion('POST', '/api/trabajadores', ['nombre' => 'Ane', 'apellidos' => 'Técnica',
            'email' => 'tecnico.nuevo@juegalmi.test', 'password' => 'secreto123', 'telefono' => '944000009', 'puesto' => 'tecnico'], 'admin');

        self::assertSame(422, $estado);
        self::assertArrayHasKey('departamentoId', $json['error']['campos']);
    }

    public function testClienteConHistorialNoSeBorraPeroSeDesactiva(): void
    {
        [, $json] = $this->peticion('GET', '/api/usuarios?tipo=cliente&q=cliente2', null, 'admin');
        $id = $json['items'][0]['id'];

        [$estado, $error] = $this->peticion('DELETE', '/api/usuarios/'.$id, null, 'admin');
        self::assertSame(409, $estado);
        self::assertSame('EN_USO', $error['error']['codigo']);

        [$estado, $json] = $this->peticion('PUT', '/api/usuarios/'.$id, ['activo' => false], 'admin');
        self::assertSame(200, $estado);
        self::assertFalse($json['activo']);
    }
}
