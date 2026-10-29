<?php

namespace App\Service;

use App\Entity\Token;
use App\Entity\Usuario;
use App\Http\ApiException;
use App\Repository\TokenRepository;
use App\Repository\UsuarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Login y logout con token propio (ADR-008, 03-Arquitectura/Seguridad y autenticacion).
 * 1. Se comprueba email + contraseña (hash).
 * 2. Se genera un token aleatorio de 64 caracteres (no es un JWT, no contiene datos).
 * 3. En la BBDD se guarda SOLO su SHA-256; el token en claro se devuelve una vez a la app.
 */
final class SesionService
{
    public function __construct(
        private readonly UsuarioRepository $usuarios,
        private readonly TokenRepository $tokens,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly EntityManagerInterface $em,
        private readonly int $tokenTtlHoras,
    ) {
    }

    /** @return array{token: string, expira: \DateTimeImmutable, usuario: Usuario} */
    public function iniciarSesion(string $email, string $password): array
    {
        $usuario = $this->usuarios->buscarPorEmail($email);
        // Mismo mensaje si el email no existe o la contraseña es mala: no se revela qué cuentas existen.
        if ($usuario === null || !$this->hasher->isPasswordValid($usuario, $password)) {
            throw new ApiException(401, 'CREDENCIALES_INCORRECTAS', 'El email o la contraseña no son correctos.');
        }
        if (!$usuario->isActivo()) {
            throw new ApiException(401, 'CUENTA_DESACTIVADA', 'Esta cuenta está desactivada. Habla con la tienda.');
        }

        $ahora = new \DateTimeImmutable();
        $this->tokens->borrarCaducados($ahora); // limpieza de paso (hay índice en fecha_expira)

        $tokenEnClaro = bin2hex(random_bytes(32));
        $expira = $ahora->modify(sprintf('+%d hours', $this->tokenTtlHoras));
        $this->em->persist(new Token($usuario, hash('sha256', $tokenEnClaro), $ahora, $expira));
        $this->em->flush();

        return ['token' => $tokenEnClaro, 'expira' => $expira, 'usuario' => $usuario];
    }

    /** Logout: borra el token de la BBDD; a partir de ahora ese token da 401. */
    public function cerrarSesion(string $tokenEnClaro): void
    {
        $token = $this->tokens->buscarPorTokenEnClaro($tokenEnClaro);
        if ($token !== null) {
            $this->em->remove($token);
            $this->em->flush();
        }
    }
}
