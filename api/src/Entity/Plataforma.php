<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Validator\Constraints as Assert;

/** Plataforma de un videojuego: PS5, Switch 2, PC… (ADR-016). */
#[ORM\Entity]
#[ORM\Table(name: 'plataforma')]
#[ORM\UniqueConstraint(name: 'uq_plataforma_nombre', columns: ['nombre'])]
#[UniqueEntity(fields: ['nombre'], message: 'Ya existe una plataforma con ese nombre.')]
class Plataforma
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 50)]
    private ?string $nombre = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNombre(): ?string
    {
        return $this->nombre;
    }

    public function setNombre(?string $nombre): static
    {
        $this->nombre = $nombre === null ? null : trim($nombre);

        return $this;
    }
}
