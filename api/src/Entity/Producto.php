<?php

namespace App\Entity;

use App\Repository\ProductoRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Supertipo del catálogo (ADR-002): especialización total y disjunta en videojuego, móvil o consola.
 * Herencia JOINED: datos comunes en `producto`, propios en la tabla del subtipo (misma id).
 */
#[ORM\Entity(repositoryClass: ProductoRepository::class)]
#[ORM\Table(name: 'producto')]
#[ORM\Index(name: 'idx_producto_tipo_activo', columns: ['tipo', 'activo'])]
#[ORM\InheritanceType('JOINED')]
#[ORM\DiscriminatorColumn(name: 'tipo', type: 'string', length: 20)]
#[ORM\DiscriminatorMap(['videojuego' => Videojuego::class, 'movil' => Movil::class, 'consola' => Consola::class])]
abstract class Producto
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 150)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 150)]
    private ?string $nombre = null;

    #[ORM\Column(type: Types::TEXT, length: 65535)] // TEXT (sin length, Doctrine crearía LONGTEXT)
    #[Assert\NotBlank]
    private ?string $descripcion = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Assert\NotNull]
    #[Assert\PositiveOrZero]
    private ?string $precio = null;

    /** Unidades a la venta (las copias de alquiler van aparte, en videojuego). */
    #[ORM\Column(options: ['default' => 0])]
    #[Assert\PositiveOrZero]
    private int $stock = 0;

    /** Ruta relativa de la imagen (ADR-019). */
    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private ?string $imagen = null;

    /** Baja lógica (ADR-018): retirado del catálogo pero se conserva el historial. */
    #[ORM\Column(options: ['default' => true])]
    private bool $activo = true;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'marca_id', nullable: false)]
    #[Assert\NotNull]
    private ?Marca $marca = null;

    /** "videojuego", "movil" o "consola" (el valor del discriminador). */
    abstract public function getTipo(): string;

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

    public function getPrecio(): ?string
    {
        return $this->precio;
    }

    public function setPrecio(?string $precio): static
    {
        $this->precio = $precio;

        return $this;
    }

    public function getStock(): int
    {
        return $this->stock;
    }

    public function setStock(int $stock): static
    {
        $this->stock = $stock;

        return $this;
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

    public function isActivo(): bool
    {
        return $this->activo;
    }

    public function setActivo(bool $activo): static
    {
        $this->activo = $activo;

        return $this;
    }

    public function getMarca(): ?Marca
    {
        return $this->marca;
    }

    public function setMarca(?Marca $marca): static
    {
        $this->marca = $marca;

        return $this;
    }
}
