<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

/** Cliente de la tienda: el único que usa las apps (ADR-024, ADR-032). */
#[ORM\Entity]
#[ORM\Table(name: 'cliente')]
#[ORM\UniqueConstraint(name: 'uq_cliente_dni', columns: ['dni'])]
class Cliente extends Usuario
{
    /** DNI o NIE en mayúsculas: 12345678Z o X1234567L (ADR-021). */
    #[ORM\Column(length: 9, options: ['fixed' => true])]
    #[Assert\NotBlank]
    private ?string $dni = null;

    /** Ruta relativa de la foto de perfil (ADR-019), p. ej. uploads/usuarios/ab12.jpg */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $foto = null;

    public function getTipo(): string
    {
        return 'cliente';
    }

    public function getRoles(): array
    {
        return ['ROLE_CLIENTE'];
    }

    public function getDni(): ?string
    {
        return $this->dni;
    }

    public function setDni(?string $dni): static
    {
        $this->dni = $dni === null ? null : strtoupper(str_replace([' ', '-'], '', $dni));

        return $this;
    }

    public function getFoto(): ?string
    {
        return $this->foto;
    }

    public function setFoto(?string $foto): static
    {
        $this->foto = $foto;

        return $this;
    }

    /**
     * Comprueba el formato y la letra de control del DNI/NIE.
     * La letra es "TRWAGMYFPDXBNJZSQVHLCKE"[número % 23]; en el NIE, X/Y/Z valen 0/1/2.
     */
    #[Assert\Callback]
    public function validarDni(ExecutionContextInterface $context): void
    {
        if ($this->dni === null || $this->dni === '') {
            return;
        }
        if (!preg_match('/^([0-9]{8}|[XYZ][0-9]{7})([A-Z])$/', $this->dni, $m)) {
            $context->buildViolation('El DNI o NIE no tiene un formato válido (12345678Z o X1234567L).')
                ->atPath('dni')->addViolation();

            return;
        }
        $numero = (int) strtr($m[1], ['X' => '0', 'Y' => '1', 'Z' => '2']);
        if ('TRWAGMYFPDXBNJZSQVHLCKE'[$numero % 23] !== $m[2]) {
            $context->buildViolation('La letra del DNI o NIE no es correcta.')
                ->atPath('dni')->addViolation();
        }
    }
}
