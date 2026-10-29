<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/** Consola: solo se vende (no se alquila, ADR-029). */
#[ORM\Entity]
#[ORM\Table(name: 'consola')]
class Consola extends Producto
{
    #[ORM\Column(length: 80)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 80)]
    private ?string $modelo = null;

    #[ORM\Column(type: Types::SMALLINT)]
    #[Assert\NotNull]
    #[Assert\Positive]
    private ?int $almacenamientoGb = null;

    public function getTipo(): string
    {
        return 'consola';
    }

    public function getModelo(): ?string
    {
        return $this->modelo;
    }

    public function setModelo(?string $modelo): static
    {
        $this->modelo = $modelo;

        return $this;
    }

    public function getAlmacenamientoGb(): ?int
    {
        return $this->almacenamientoGb;
    }

    public function setAlmacenamientoGb(?int $almacenamientoGb): static
    {
        $this->almacenamientoGb = $almacenamientoGb;

        return $this;
    }
}
