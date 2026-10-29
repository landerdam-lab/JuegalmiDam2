<?php

namespace App\Security;

use App\Http\RespuestaError;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

/**
 * Respuesta 401 en JSON. Ante un 401, las apps borran la sesión y vuelven al login.
 * - onAuthenticationFailure: el token es inválido o ha caducado.
 * - start: la ruta necesita token y no se ha enviado ninguno.
 */
final class FalloAutenticacionHandler implements AuthenticationFailureHandlerInterface, AuthenticationEntryPointInterface
{
    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        if ($exception->getMessageKey() === 'TOKEN_CADUCADO') {
            return RespuestaError::crear(401, 'TOKEN_CADUCADO', 'Tu sesión ha caducado. Vuelve a iniciar sesión.');
        }

        return RespuestaError::crear(401, 'NO_AUTENTICADO', 'La sesión no es válida. Vuelve a iniciar sesión.');
    }

    public function start(Request $request, ?AuthenticationException $authException = null): Response
    {
        return RespuestaError::crear(401, 'NO_AUTENTICADO', 'Tienes que iniciar sesión.');
    }
}
