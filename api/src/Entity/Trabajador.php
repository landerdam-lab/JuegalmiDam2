<?php

namespace App\Entity;

use App\Enum\Puesto;
use App\Repository\TrabajadorRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

/**
 * Trabajador de la tienda (ADR-032): técnico (con departamento) o admin (sin departamento).
 * Solo usa la web: el admin para la gestión y el técnico para las reparaciones de su departamento.
 */
#[ORM\Entity(repositoryClass: TrabajadorRepository::class)]
#[ORM\Table(name: 'trabajador')]
class Trabajador extends Usuario
{
    #[ORM\Column(length: 10, enumType: Puesto::class)]
    #[Assert\NotNull]
    private ?Puesto $puesto = null;

    /** Solo los técnicos tienen departamento (CHECK chk_trabajador_departamento). */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'departamento_id', nullable: true)]
    private ?Departamento $departamento = null;

    public function getTipo(): string
    {
        return 'trabajador';
    }

    public function getRoles(): array
    {
        return [$this->puesto === Puesto::Admin ? 'ROLE_ADMIN' : 'ROLE_TECNICO'];
    }

    public function getPuesto(): ?Puesto
    {
        return $this->puesto;
    }

    public function setPuesto(?Puesto $puesto): static
    {
        $this->puesto = $puesto;

        return $this;
    }

    public function esAdmin(): bool
    {
        return $this->puesto === Puesto::Admin;
    }

    public function esTecnico(): bool
    {
        return $this->puesto === Puesto::Tecnico;
    }

    public function getDepartamento(): ?Departamento
    {
        return $this->departamento;
    }

    public function setDepartamento(?Departamento $departamento): static
    {
        $this->departamento = $departamento;

        return $this;
    }

    /** Misma regla que el CHECK de la BBDD: departamento ⇔ técnico. */
    #[Assert\Callback]
    public function validarDepartamento(ExecutionContextInterface $context): void
    {
        if ($this->puesto === Puesto::Tecnico && $this->departamento === null) {
            $context->buildViolation('Un técnico tiene que tener departamento.')
                ->atPath('departamentoId')->addViolation();
        }
        if ($this->puesto === Puesto::Admin && $this->departamento !== null) {
            $context->buildViolation('Un admin no tiene departamento.')
                ->atPath('departamentoId')->addViolation();
        }
    }
}
