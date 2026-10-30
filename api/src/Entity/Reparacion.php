<?php

namespace App\Entity;

use App\Enum\EstadoReparacion;
use App\Repository\ReparacionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Reparación de un dispositivo (soporte técnico). El cliente elige el departamento y la API
 * asigna un técnico de ese departamento. El departamento NO se guarda: es el de su técnico.
 */
#[ORM\Entity(repositoryClass: ReparacionRepository::class)]
#[ORM\Table(name: 'reparacion')]
#[ORM\Index(name: 'idx_reparacion_tecnico_estado', columns: ['tecnico_id', 'estado'])]
class Reparacion
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** Texto libre: "iPhone 13", "PS4 Pro"… */
    #[ORM\Column(length: 100)]
    private string $dispositivo;

    #[ORM\Column(type: Types::TEXT, length: 65535)] // TEXT (sin length, Doctrine crearía LONGTEXT)
    private string $problema;

    #[ORM\Column(length: 20, enumType: EstadoReparacion::class, options: ['default' => 'recibida'])]
    private EstadoReparacion $estado = EstadoReparacion::Recibida;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $fechaEntrada;

    /** Se rellena al pasar a "entregada" (CHECK: fecha_salida ⇔ entregada). */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $fechaSalida = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    private ?string $presupuesto = null;

    /** Foto del dispositivo hecha con la cámara (RF-14), como ruta (ADR-019). */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $foto = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'cliente_id', nullable: false)]
    private Cliente $cliente;

    /** Siempre un trabajador con puesto = tecnico (lo garantiza un trigger). */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'tecnico_id', nullable: false)]
    private Trabajador $tecnico;

    public function __construct(Cliente $cliente, Trabajador $tecnico, string $dispositivo, string $problema, \DateTimeImmutable $fechaEntrada)
    {
        $this->cliente = $cliente;
        $this->tecnico = $tecnico;
        $this->dispositivo = $dispositivo;
        $this->problema = $problema;
        $this->fechaEntrada = $fechaEntrada;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDispositivo(): string
    {
        return $this->dispositivo;
    }

    public function getProblema(): string
    {
        return $this->problema;
    }

    public function getEstado(): EstadoReparacion
    {
        return $this->estado;
    }

    public function setEstado(EstadoReparacion $estado): static
    {
        $this->estado = $estado;

        return $this;
    }

    public function getFechaEntrada(): \DateTimeImmutable
    {
        return $this->fechaEntrada;
    }

    public function getFechaSalida(): ?\DateTimeImmutable
    {
        return $this->fechaSalida;
    }

    public function setFechaSalida(?\DateTimeImmutable $fechaSalida): static
    {
        $this->fechaSalida = $fechaSalida;

        return $this;
    }

    public function getPresupuesto(): ?string
    {
        return $this->presupuesto;
    }

    public function setPresupuesto(?string $presupuesto): static
    {
        $this->presupuesto = $presupuesto;

        return $this;
    }

    public function getFoto(): ?string
    {
        return $this->foto;
    }

    public function setFoto(?string $foto): static
    {
        $this->foto = $foto;

        return $this;
    }

    public function getCliente(): Cliente
    {
        return $this->cliente;
    }

    public function getTecnico(): Trabajador
    {
        return $this->tecnico;
    }

    public function setTecnico(Trabajador $tecnico): static
    {
        $this->tecnico = $tecnico;

        return $this;
    }

    /** El departamento sale del técnico (no se guarda dos veces, ADR-023). */
    public function getDepartamento(): ?Departamento
    {
        return $this->tecnico->getDepartamento();
    }
}
