<?php

namespace App\Tests\Api;

/** La raíz responde sin token y no enseña datos. */
final class InicioTest extends ApiTestCase
{
    public function testRaizYApiResponden(): void
    {
        foreach (['/', '/api'] as $ruta) {
            [$estado, $json] = $this->peticion('GET', $ruta);

            self::assertSame(200, $estado);
            self::assertSame(['nombre' => 'API de Almi Companion', 'estado' => 'ok'], $json);
        }
    }
}
