<?php

namespace App\Entity;

use App\Repository\ProductoProveedorRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * N:M entre producto y proveedor con un atributo: el precio de coste (ADR-042).
 * Mismo patrón que compra y alquiler (ADR-013, ADR-034): id propio + UNIQUE de la pareja,
 * así un proveedor no aparece dos veces para el mismo producto.
 *
 * Borrado: si se borra el producto, se borran sus filas aquí (CASCADE); un proveedor que
 * sirve productos no se puede borrar (RESTRICT → 409 EN_USO en la API).
 */
#[ORM\Entity(repositoryClass: ProductoProveedorRepository::class)]
#[ORM\Table(name: 'producto_proveedor')]
#[ORM\UniqueConstraint(name: 'uq_producto_proveedor', columns: ['producto_id', 'proveedor_id'])]
#[ORM\Index(name: 'idx_producto_proveedor_proveedor', columns: ['proveedor_id'])]
class ProductoProveedor
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'producto_id', nullable: false, onDelete: 'CASCADE')]
    private Producto $producto;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'proveedor_id', nullable: false)]
    private Proveedor $proveedor;

    /** Lo que le cuesta a la tienda una unidad comprada a este proveedor. */
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Assert\NotNull]
    #[Assert\PositiveOrZero]
    private ?string $precioCoste = null;

    public function __construct(Producto $producto, Proveedor $proveedor)
    {
        $this->producto = $producto;
        $this->proveedor = $proveedor;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getProducto(): Producto
    {
        return $this->producto;
    }

    public function getProveedor(): Proveedor
    {
        return $this->proveedor;
    }

    public function getPrecioCoste(): ?string
    {
        return $this->precioCoste;
    }

    public function setPrecioCoste(?string $precioCoste): static
    {
        $this->precioCoste = $precioCoste;

        return $this;
    }
}
