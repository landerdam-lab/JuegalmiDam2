<?php

namespace App\Tests\Api;

/** Login, registro, token y perfil (rúbrica Acceso a datos 5: todo con token). */
final class AutenticacionTest extends ApiTestCase
{
    public function testLoginCorrectoDevuelveTokenYUsuario(): void
    {
        [$estado, $json] = $this->peticion('POST', '/api/login', ['email' => 'CLIENTE1@juegalmi.test', 'password' => 'demo1234']);

        self::assertSame(200, $estado);
        self::assertSame(64, strlen($json['token']));
        self::assertSame('cliente', $json['usuario']['tipo']);
        self::assertArrayNotHasKey('password', $json['usuario']);
    }

    public function testLoginConContrasenaIncorrectaDa401(): void
    {
        [$estado, $json] = $this->peticion('POST', '/api/login', ['email' => 'cliente1@juegalmi.test', 'password' => 'mala']);

        self::assertSame(401, $estado);
        self::assertSame('CREDENCIALES_INCORRECTAS', $json['error']['codigo']);
    }

    public function testUsuarioDesactivadoNoPuedeEntrar(): void
    {
        [$estado, $json] = $this->peticion('POST', '/api/login', ['email' => 'cliente4@juegalmi.test', 'password' => 'demo1234']);

        self::assertSame(401, $estado);
        self::assertSame('CUENTA_DESACTIVADA', $json['error']['codigo']);
    }

    public function testSinTokenOConTokenFalsoDa401EnJson(): void
    {
        [$estado, $json] = $this->peticion('GET', '/api/me');
        self::assertSame(401, $estado);
        self::assertSame('NO_AUTENTICADO', $json['error']['codigo']);

        $this->cliente->request('GET', '/api/me', [], [], ['HTTP_AUTHORIZATION' => 'Bearer inventado']);
        self::assertSame(401, $this->cliente->getResponse()->getStatusCode());
    }

    public function testLogoutInvalidaElToken(): void
    {
        $this->cliente->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'cliente2@juegalmi.test', 'password' => 'demo1234']));
        $token = json_decode($this->cliente->getResponse()->getContent(), true)['token'];

        $this->cliente->request('POST', '/api/logout', [], [], ['HTTP_AUTHORIZATION' => 'Bearer '.$token]);
        self::assertSame(204, $this->cliente->getResponse()->getStatusCode());

        $this->cliente->request('GET', '/api/me', [], [], ['HTTP_AUTHORIZATION' => 'Bearer '.$token]);
        self::assertSame(401, $this->cliente->getResponse()->getStatusCode());
    }

    public function testRegistroCreaUnClienteQuePuedeEntrar(): void
    {
        $nuevo = ['nombre' => 'Unai', 'apellidos' => 'Prueba', 'email' => 'nuevo@juegalmi.test',
            'password' => 'demo1234', 'telefono' => '600000999', 'dni' => '30654987n'];
        [$estado, $json] = $this->peticion('POST', '/api/registro', $nuevo);

        self::assertSame(201, $estado);
        self::assertSame('cliente', $json['tipo']);
        self::assertSame('30654987N', $json['dni']);
        self::assertSame(200, $this->peticion('GET', '/api/me', null, 'nuevo@juegalmi.test')[0]);
    }

    public function testRegistroValidaCadaCampo(): void
    {
        [$estado, $json] = $this->peticion('POST', '/api/registro', ['nombre' => 'X', 'apellidos' => 'Y',
            'email' => 'otro@juegalmi.test', 'password' => 'secreto123', 'telefono' => '600000998', 'dni' => '12345678A']);
        self::assertSame(422, $estado);
        self::assertArrayHasKey('dni', $json['error']['campos']); // letra del DNI incorrecta

        [$estado, $json] = $this->peticion('POST', '/api/registro', ['nombre' => 'X', 'apellidos' => 'Y',
            'email' => 'cliente1@juegalmi.test', 'password' => 'secreto123', 'telefono' => '600000998', 'dni' => '11223344B']);
        self::assertSame(409, $estado);
        self::assertSame('EMAIL_REPETIDO', $json['error']['codigo']);
    }

    public function testEditarPerfilPropio(): void
    {
        [$estado, $json] = $this->peticion('PUT', '/api/me', ['telefono' => '611222333', 'email' => 'cambiado@x.test'], 'cliente3');

        self::assertSame(200, $estado);
        self::assertSame('611222333', $json['telefono']);
        self::assertSame('cliente3@juegalmi.test', $json['email']); // el email solo lo cambia el admin
    }
}
