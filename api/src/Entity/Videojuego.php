<?php

namespace App\Entity;

use App\Repository\VideojuegoRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/** Videojuego: se vende (stock) y se alquila (copias_alquiler). Una plataforma por juego (ADR-016). */
#[ORM\Entity(repositoryClass: VideojuegoRepository::class)]
#[ORM\Table(name: 'videojuego')]
class Videojuego extends Producto
{
    public const PEGI = [3, 7, 12, 16, 18];

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 50)]
    private ?string $genero = null;

    #[ORM\Column(type: Types::SMALLINT)]
    #[Assert\NotNull]
    #[Assert\Choice(choices: self::PEGI, message: 'El PEGI tiene que ser 3, 7, 12, 16 o 18.')]
    private ?int $pegi = null;

    /** Precio por día de alquiler. */
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Assert\NotNull]
    #[Assert\PositiveOrZero]
    private ?string $precioAlquiler = null;

    /** Copias dedicadas al alquiler (no se descuentan del stock de venta). */
    #[ORM\Column(options: ['default' => 0])]
    #[Assert\PositiveOrZero]
    private int $copiasAlquiler = 0;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'plataforma_id', nullable: false)]
    #[Assert\NotNull]
    private ?Plataforma $plataforma = null;

    public function getTipo(): string
    {
        return 'videojuego';
    }

    public function getGenero(): ?string
    {
        return $this->genero;
    }

    public function setGenero(?string $genero): static
    {
        $this->genero = $genero;

        return $this;
    }

    public function getPegi(): ?int
    {
        return $this->pegi;
    }

    public function setPegi(?int $pegi): static
    {
        $this->pegi = $pegi;

        return $this;
    }

    public function getPrecioAlquiler(): ?string
    {
        return $this->precioAlquiler;
    }

    public function setPrecioAlquiler(?string $precioAlquiler): static
    {
        $this->precioAlquiler = $precioAlquiler;

        return $this;
    }

    public function getCopiasAlquiler(): int
    {
        return $this->copiasAlquiler;
    }

    public function setCopiasAlquiler(int $copiasAlquiler): static
    {
        $this->copiasAlquiler = $copiasAlquiler;

        return $this;
    }

    public function getPlataforma(): ?Plataforma
    {
        return $this->plataforma;
    }

    public function setPlataforma(?Plataforma $plataforma): static
    {
        $this->plataforma = $plataforma;

        return $this;
    }
}
