<?php

namespace App\Entity;

use App\Enum\EstadoPedido;
use App\Repository\AlquilerRepository;
use App\Util\Dinero;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Videojuego alquilado en un pedido (N:M pedido–videojuego, ADR-034). Siempre 1 copia.
 * Empieza el día del pedido y termina en `fecha_fin`. `fecha_devolucion` nula = no devuelto.
 * La FK a videojuego (no a producto) garantiza que solo se alquilan videojuegos.
 */
#[ORM\Entity(repositoryClass: AlquilerRepository::class)]
#[ORM\Table(name: 'alquiler')]
#[ORM\UniqueConstraint(name: 'uq_alquiler_pedido_videojuego', columns: ['pedido_id', 'videojuego_id'])]
#[ORM\Index(name: 'idx_alquiler_videojuego_devolucion', columns: ['videojuego_id', 'fecha_devolucion'])]
class Alquiler
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'alquileres')]
    #[ORM\JoinColumn(name: 'pedido_id', nullable: false, onDelete: 'CASCADE')]
    private Pedido $pedido;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'videojuego_id', nullable: false)]
    private Videojuego $videojuego;

    /** Precio por día en el momento del alquiler (histórico). */
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private string $precioDia;

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    private \DateTimeImmutable $fechaFin;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $fechaDevolucion = null;

    public function __construct(Pedido $pedido, Videojuego $videojuego, string $precioDia, \DateTimeImmutable $fechaFin)
    {
        $this->pedido = $pedido;
        $this->videojuego = $videojuego;
        $this->precioDia = $precioDia;
        $this->fechaFin = $fechaFin;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPedido(): Pedido
    {
        return $this->pedido;
    }

    public function getVideojuego(): Videojuego
    {
        return $this->videojuego;
    }

    public function getPrecioDia(): string
    {
        return $this->precioDia;
    }

    public function getFechaInicio(): \DateTimeImmutable
    {
        return $this->pedido->getFecha()->setTime(0, 0);
    }

    public function getFechaFin(): \DateTimeImmutable
    {
        return $this->fechaFin;
    }

    public function getFechaDevolucion(): ?\DateTimeImmutable
    {
        return $this->fechaDevolucion;
    }

    public function setFechaDevolucion(?\DateTimeImmutable $fechaDevolucion): static
    {
        $this->fechaDevolucion = $fechaDevolucion;

        return $this;
    }

    /** Días pagados: de la fecha del pedido a fecha_fin (mínimo 1). */
    public function getDias(): int
    {
        return max(1, (int) $this->getFechaInicio()->diff($this->fechaFin)->days);
    }

    public function getSubtotal(): string
    {
        return Dinero::deCentimos(Dinero::aCentimos($this->precioDia) * $this->getDias());
    }

    /**
     * Estado calculado (no se guarda): cancelado (su pedido se canceló), devuelto,
     * retrasado (hoy > fecha_fin sin devolver) o activo.
     */
    public function getEstado(\DateTimeImmutable $hoy): string
    {
        if ($this->pedido->getEstado() === EstadoPedido::Cancelado) {
            return 'cancelado';
        }
        if ($this->fechaDevolucion !== null) {
            return 'devuelto';
        }

        return $hoy->setTime(0, 0) > $this->fechaFin ? 'retrasado' : 'activo';
    }
}
