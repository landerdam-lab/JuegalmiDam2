<?php

namespace App\Entity;

use App\Enum\EstadoPedido;
use App\Enum\MetodoPago;
use App\Repository\PedidoRepository;
use App\Util\Dinero;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Pedido de un cliente, con recogida en tienda (ADR-015).
 * Tiene compras (N:M con producto) y/o alquileres (N:M con videojuego) colgando de él (ADR-034).
 * El total NO se guarda: se calcula (getTotal).
 */
#[ORM\Entity(repositoryClass: PedidoRepository::class)]
#[ORM\Table(name: 'pedido')]
#[ORM\Index(name: 'idx_pedido_cliente_fecha', columns: ['cliente_id', 'fecha'])]
class Pedido
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $fecha;

    #[ORM\Column(length: 20, enumType: EstadoPedido::class, options: ['default' => 'pendiente'])]
    private EstadoPedido $estado = EstadoPedido::Pendiente;

    #[ORM\Column(length: 20, enumType: MetodoPago::class)]
    private MetodoPago $metodoPago;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'cliente_id', nullable: false)]
    private Cliente $cliente;

    /** @var Collection<int, Compra> */
    #[ORM\OneToMany(targetEntity: Compra::class, mappedBy: 'pedido', cascade: ['persist'], orphanRemoval: true)]
    #[ORM\OrderBy(['id' => 'ASC'])]
    private Collection $compras;

    /** @var Collection<int, Alquiler> */
    #[ORM\OneToMany(targetEntity: Alquiler::class, mappedBy: 'pedido', cascade: ['persist'], orphanRemoval: true)]
    #[ORM\OrderBy(['id' => 'ASC'])]
    private Collection $alquileres;

    public function __construct(Cliente $cliente, MetodoPago $metodoPago, \DateTimeImmutable $fecha)
    {
        $this->cliente = $cliente;
        $this->metodoPago = $metodoPago;
        $this->fecha = $fecha;
        $this->compras = new ArrayCollection();
        $this->alquileres = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFecha(): \DateTimeImmutable
    {
        return $this->fecha;
    }

    public function getEstado(): EstadoPedido
    {
        return $this->estado;
    }

    public function setEstado(EstadoPedido $estado): static
    {
        $this->estado = $estado;

        return $this;
    }

    public function getMetodoPago(): MetodoPago
    {
        return $this->metodoPago;
    }

    public function getCliente(): Cliente
    {
        return $this->cliente;
    }

    /** @return Collection<int, Compra> */
    public function getCompras(): Collection
    {
        return $this->compras;
    }

    public function addCompra(Compra $compra): static
    {
        $this->compras->add($compra);

        return $this;
    }

    /** @return Collection<int, Alquiler> */
    public function getAlquileres(): Collection
    {
        return $this->alquileres;
    }

    public function addAlquiler(Alquiler $alquiler): static
    {
        $this->alquileres->add($alquiler);

        return $this;
    }

    /** Total = Σ cantidad × precio_unitario + Σ precio_dia × días (atributo derivado, no se guarda). */
    public function getTotal(): string
    {
        $centimos = 0;
        foreach ($this->compras as $compra) {
            $centimos += Dinero::aCentimos($compra->getSubtotal());
        }
        foreach ($this->alquileres as $alquiler) {
            $centimos += Dinero::aCentimos($alquiler->getSubtotal());
        }

        return Dinero::deCentimos($centimos);
    }
}
