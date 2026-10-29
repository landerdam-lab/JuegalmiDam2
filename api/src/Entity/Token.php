<?php

namespace App\Entity;

use App\Repository\TokenRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Sesión iniciada (ADR-008, ADR-021). Solo se guarda el SHA-256 del token:
 * si alguien lee la BBDD no puede usar los tokens (igual que con las contraseñas).
 */
#[ORM\Entity(repositoryClass: TokenRepository::class)]
#[ORM\Table(name: 'token')]
#[ORM\UniqueConstraint(name: 'uq_token_hash', columns: ['token_hash'])]
#[ORM\Index(name: 'idx_token_fecha_expira', columns: ['fecha_expira'])]
class Token
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 64, options: ['fixed' => true])]
    private string $tokenHash;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $fechaCreacion;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $fechaExpira;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'usuario_id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    public function __construct(Usuario $usuario, string $tokenHash, \DateTimeImmutable $fechaCreacion, \DateTimeImmutable $fechaExpira)
    {
        $this->usuario = $usuario;
        $this->tokenHash = $tokenHash;
        $this->fechaCreacion = $fechaCreacion;
        $this->fechaExpira = $fechaExpira;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTokenHash(): string
    {
        return $this->tokenHash;
    }

    public function getFechaCreacion(): \DateTimeImmutable
    {
        return $this->fechaCreacion;
    }

    public function getFechaExpira(): \DateTimeImmutable
    {
        return $this->fechaExpira;
    }

    public function getUsuario(): Usuario
    {
        return $this->usuario;
    }

    public function haCaducado(\DateTimeImmutable $ahora): bool
    {
        return $this->fechaExpira <= $ahora;
    }
}
