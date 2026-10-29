<?php

namespace App\Entity;

use App\Util\Dinero;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Producto comprado en un pedido (N:M pedido–producto, ADR-034).
 * `precio_unitario` es el precio de ese día (histórico): lo pone la API, nunca la app.
 */
#[ORM\Entity]
#[ORM\Table(name: 'compra')]
#[ORM\UniqueConstraint(name: 'uq_compra_pedido_producto', columns: ['pedido_id', 'producto_id'])]
#[ORM\Index(name: 'idx_compra_producto', columns: ['producto_id'])]
class Compra
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'compras')]
    #[ORM\JoinColumn(name: 'pedido_id', nullable: false, onDelete: 'CASCADE')]
    private Pedido $pedido;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'producto_id', nullable: false)]
    private Producto $producto;

    #[ORM\Column]
    private int $cantidad;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private string $precioUnitario;

    public function __construct(Pedido $pedido, Producto $producto, int $cantidad, string $precioUnitario)
    {
        $this->pedido = $pedido;
        $this->producto = $producto;
        $this->cantidad = $cantidad;
        $this->precioUnitario = $precioUnitario;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPedido(): Pedido
    {
        return $this->pedido;
    }

    public function getProducto(): Producto
    {
        return $this->producto;
    }

    public function getCantidad(): int
    {
        return $this->cantidad;
    }

    public function getPrecioUnitario(): string
    {
        return $this->precioUnitario;
    }

    public function getSubtotal(): string
    {
        return Dinero::deCentimos(Dinero::aCentimos($this->precioUnitario) * $this->cantidad);
    }
}
