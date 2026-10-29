<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/** Foto de la galería de la tienda (ADR-007). La imagen es una ruta (ADR-019). */
#[ORM\Entity]
#[ORM\Table(name: 'foto_tienda')]
class FotoTienda
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private ?string $imagen = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private ?string $descripcion = null;

    #[ORM\ManyToOne(inversedBy: 'fotos')]
    #[ORM\JoinColumn(name: 'tienda_id', nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull]
    private ?Tienda $tienda = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getImagen(): ?string
    {
        return $this->imagen;
    }

    public function setImagen(?string $imagen): static
    {
        $this->imagen = $imagen;

        return $this;
    }

    public function getDescripcion(): ?string
    {
        return $this->descripcion;
    }

    public function setDescripcion(?string $descripcion): static
    {
        $this->descripcion = $descripcion;

        return $this;
    }

    public function getTienda(): ?Tienda
    {
        return $this->tienda;
    }

    public function setTienda(?Tienda $tienda): static
    {
        $this->tienda = $tienda;

        return $this;
    }
}
