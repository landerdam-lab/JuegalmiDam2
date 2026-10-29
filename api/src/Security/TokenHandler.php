<?php

namespace App\Security;

use App\Repository\TokenRepository;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\AccessToken\AccessTokenHandlerInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;

/**
 * Valida el token de "Authorization: Bearer <token>" en cada petición (ADR-008).
 * Symfony extrae el token de la cabecera y nos lo pasa; aquí comprobamos que existe,
 * que no ha caducado y que el usuario sigue activo. Si algo falla → 401.
 */
final class TokenHandler implements AccessTokenHandlerInterface
{
    public function __construct(private readonly TokenRepository $tokens)
    {
    }

    public function getUserBadgeFrom(#[\SensitiveParameter] string $accessToken): UserBadge
    {
        $token = $this->tokens->buscarPorTokenEnClaro($accessToken);
        if ($token === null) {
            throw new CustomUserMessageAuthenticationException('NO_AUTENTICADO');
        }
        if ($token->haCaducado(new \DateTimeImmutable())) {
            throw new CustomUserMessageAuthenticationException('TOKEN_CADUCADO');
        }
        $usuario = $token->getUsuario();
        if (!$usuario->isActivo()) {
            throw new CustomUserMessageAuthenticationException('NO_AUTENTICADO');
        }

        // Devolvemos directamente el usuario que ya hemos cargado (evita otra consulta).
        return new UserBadge($usuario->getUserIdentifier(), fn () => $usuario);
    }
}
