<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/** La tienda física: sección "La tienda" (Ubicación, Galería, Historia). ADR-007. */
#[ORM\Entity]
#[ORM\Table(name: 'tienda')]
class Tienda
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private ?string $nombre = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private ?string $direccion = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 7)]
    #[Assert\NotNull]
    #[Assert\Range(min: -90, max: 90)]
    private ?string $latitud = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 7)]
    #[Assert\NotNull]
    #[Assert\Range(min: -180, max: 180)]
    private ?string $longitud = null;

    #[ORM\Column(type: Types::TEXT, length: 65535)] // TEXT (sin length, Doctrine crearía LONGTEXT)
    #[Assert\NotBlank]
    private ?string $historia = null;

    /** @var Collection<int, FotoTienda> Galería (se borra con la tienda: ON DELETE CASCADE) */
    #[ORM\OneToMany(targetEntity: FotoTienda::class, mappedBy: 'tienda')]
    #[ORM\OrderBy(['id' => 'ASC'])]
    private Collection $fotos;

    public function __construct()
    {
        $this->fotos = new ArrayCollection();
    }

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
        $this->nombre = $nombre;

        return $this;
    }

    public function getDireccion(): ?string
    {
        return $this->direccion;
    }

    public function setDireccion(?string $direccion): static
    {
        $this->direccion = $direccion;

        return $this;
    }

    public function getLatitud(): ?string
    {
        return $this->latitud;
    }

    public function setLatitud(?string $latitud): static
    {
        $this->latitud = $latitud;

        return $this;
    }

    public function getLongitud(): ?string
    {
        return $this->longitud;
    }

    public function setLongitud(?string $longitud): static
    {
        $this->longitud = $longitud;

        return $this;
    }

    public function getHistoria(): ?string
    {
        return $this->historia;
    }

    public function setHistoria(?string $historia): static
    {
        $this->historia = $historia;

        return $this;
    }

    /** @return Collection<int, FotoTienda> */
    public function getFotos(): Collection
    {
        return $this->fotos;
    }
}
