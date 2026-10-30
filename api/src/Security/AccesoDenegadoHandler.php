<?php

namespace App\Security;

use App\Http\RespuestaError;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Security\Http\Authorization\AccessDeniedHandlerInterface;

/** 403 en JSON: hay sesión, pero el rol no permite hacer esto (p. ej. un cliente en /api/usuarios). */
final class AccesoDenegadoHandler implements AccessDeniedHandlerInterface
{
    public function handle(Request $request, AccessDeniedException $accessDeniedException): ?Response
    {
        return RespuestaError::crear(403, 'PROHIBIDO', 'No tienes permiso para hacer esto.');
    }
}
