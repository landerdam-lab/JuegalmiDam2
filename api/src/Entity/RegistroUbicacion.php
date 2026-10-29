<?php

namespace App\Entity;

use App\Repository\RegistroUbicacionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Dónde estaba el usuario en cada petición (ADR-014, RF-11).
 * La crea App\EventListener\RegistroUbicacionListener con las cabeceras X-Latitud / X-Longitud.
 */
#[ORM\Entity(repositoryClass: RegistroUbicacionRepository::class)]
#[ORM\Table(name: 'registro_ubicacion')]
#[ORM\Index(name: 'idx_registro_ubicacion_usuario_fecha', columns: ['usuario_id', 'fecha'])]
class RegistroUbicacion
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $fecha;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 7)]
    private string $latitud;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 7)]
    private string $longitud;

    /** GET, POST, PUT, PATCH o DELETE */
    #[ORM\Column(length: 7)]
    private string $metodo;

    /** Ruta con la query, p. ej. /api/videojuegos?plataforma=2 */
    #[ORM\Column(length: 255)]
    private string $ruta;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'usuario_id', nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    public function __construct(Usuario $usuario, string $latitud, string $longitud, string $metodo, string $ruta, \DateTimeImmutable $fecha)
    {
        $this->usuario = $usuario;
        $this->latitud = $latitud;
        $this->longitud = $longitud;
        $this->metodo = $metodo;
        $this->ruta = mb_substr($ruta, 0, 255);
        $this->fecha = $fecha;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFecha(): \DateTimeImmutable
    {
        return $this->fecha;
    }

    public function getLatitud(): string
    {
        return $this->latitud;
    }

    public function getLongitud(): string
    {
        return $this->longitud;
    }

    public function getMetodo(): string
    {
        return $this->metodo;
    }

    public function getRuta(): string
    {
        return $this->ruta;
    }

    public function getUsuario(): Usuario
    {
        return $this->usuario;
    }
}
