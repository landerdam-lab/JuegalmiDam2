<?php

namespace App\Entity;

use App\Enum\LineaServicio;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Validator\Constraints as Assert;

/** Servicio que se ofrece en una de las 3 pestañas de Servicios (ADR-030). */
#[ORM\Entity]
#[ORM\Table(name: 'servicio')]
#[ORM\UniqueConstraint(name: 'uq_servicio_linea_nombre', columns: ['linea', 'nombre'])]
#[UniqueEntity(fields: ['linea', 'nombre'], message: 'Ya existe un servicio con ese nombre en esa línea.', errorPath: 'nombre')]
class Servicio
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private ?string $nombre = null;

    #[ORM\Column(type: Types::TEXT, length: 65535)] // TEXT (sin length, Doctrine crearía LONGTEXT)
    #[Assert\NotBlank]
    private ?string $descripcion = null;

    /** "Desde X €"; null = consultar en tienda */
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Assert\PositiveOrZero]
    private ?string $precioOrientativo = null;

    #[ORM\Column(length: 15, enumType: LineaServicio::class)]
    #[Assert\NotNull]
    private ?LineaServicio $linea = null;

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

    public function getDescripcion(): ?string
    {
        return $this->descripcion;
    }

    public function setDescripcion(?string $descripcion): static
    {
        $this->descripcion = $descripcion;

        return $this;
    }

    public function getPrecioOrientativo(): ?string
    {
        return $this->precioOrientativo;
    }

    public function setPrecioOrientativo(?string $precioOrientativo): static
    {
        $this->precioOrientativo = $precioOrientativo;

        return $this;
    }

    public function getLinea(): ?LineaServicio
    {
        return $this->linea;
    }

    public function setLinea(?LineaServicio $linea): static
    {
        $this->linea = $linea;

        return $this;
    }
}
