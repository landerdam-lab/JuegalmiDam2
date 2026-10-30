<?php

namespace App\Controller\Api;

use App\Service\Presentador;
use App\Service\SesionService;
use App\Service\UsuarioService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/** Autenticación y perfil propio: /api/login, /api/registro, /api/logout, /api/me */
#[Route('/api')]
final class AuthController extends ApiController
{
    public function __construct(
        private readonly SesionService $sesiones,
        private readonly UsuarioService $usuarios,
        private readonly Presentador $presentador,
    ) {
    }

    /** Público. {email, password} → 200 {token, expira, usuario} · 401 */
    #[Route('/login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $datos = $this->datos($request);
        $sesion = $this->sesiones->iniciarSesion($datos->texto('email', true), $datos->texto('password', true));

        return $this->respuesta([
            'token' => $sesion['token'],
            'expira' => $sesion['expira']->format(DATE_ATOM),
            'usuario' => $this->presentador->usuario($sesion['usuario']),
        ]);
    }

    /** Público. Crea siempre un CLIENTE. {nombre, apellidos, email, password, telefono, dni} → 201 usuario */
    #[Route('/registro', methods: ['POST'])]
    public function registro(Request $request): JsonResponse
    {
        $cliente = $this->usuarios->crearCliente($this->datos($request));

        return $this->respuesta($this->presentador->usuario($cliente), Response::HTTP_CREATED);
    }

    /** Borra el token actual: a partir de ahora da 401. */
    #[Route('/logout', methods: ['POST'])]
    public function logout(Request $request): Response
    {
        $cabecera = (string) $request->headers->get('Authorization');
        $this->sesiones->cerrarSesion(trim(substr($cabecera, strlen('Bearer '))));

        return $this->sinContenido();
    }

    #[Route('/me', methods: ['GET'])]
    public function verPerfil(): JsonResponse
    {
        return $this->respuesta($this->presentador->usuario($this->usuario()));
    }

    /** {nombre?, apellidos?, telefono?, foto?, password?} (el email, el DNI y "activo" solo los cambia el admin) */
    #[Route('/me', methods: ['PUT'])]
    public function editarPerfil(Request $request): JsonResponse
    {
        $usuario = $this->usuario();
        $this->usuarios->actualizar($usuario, $this->datos($request), false);

        return $this->respuesta($this->presentador->usuario($usuario));
    }
}
