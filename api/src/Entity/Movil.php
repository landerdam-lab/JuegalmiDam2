<?php

namespace App\Entity;

use App\Enum\FormatoMovil;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/** Móvil o tablet. El campo se llama `formato` para no chocar con producto.tipo (ADR-012). */
#[ORM\Entity]
#[ORM\Table(name: 'movil')]
class Movil extends Producto
{
    #[ORM\Column(length: 10, enumType: FormatoMovil::class)]
    #[Assert\NotNull]
    private ?FormatoMovil $formato = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 3, scale: 1)]
    #[Assert\NotNull]
    #[Assert\Positive]
    #[Assert\LessThan(100)]
    private ?string $pantallaPulgadas = null;

    #[ORM\Column(type: Types::SMALLINT)]
    #[Assert\NotNull]
    #[Assert\Positive]
    private ?int $ramGb = null;

    #[ORM\Column(type: Types::SMALLINT)]
    #[Assert\NotNull]
    #[Assert\Positive]
    private ?int $almacenamientoGb = null;

    public function getTipo(): string
    {
        return 'movil';
    }

    public function getFormato(): ?FormatoMovil
    {
        return $this->formato;
    }

    public function setFormato(?FormatoMovil $formato): static
    {
        $this->formato = $formato;

        return $this;
    }

    public function getPantallaPulgadas(): ?string
    {
        return $this->pantallaPulgadas;
    }

    public function setPantallaPulgadas(?string $pantallaPulgadas): static
    {
        $this->pantallaPulgadas = $pantallaPulgadas;

        return $this;
    }

    public function getRamGb(): ?int
    {
        return $this->ramGb;
    }

    public function setRamGb(?int $ramGb): static
    {
        $this->ramGb = $ramGb;

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
