<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/** Departamento de soporte técnico: Telefonía o Consolas. Solo lectura desde la API. */
#[ORM\Entity]
#[ORM\Table(name: 'departamento')]
#[ORM\UniqueConstraint(name: 'uq_departamento_nombre', columns: ['nombre'])]
class Departamento
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    private string $nombre;

    public function __construct(string $nombre)
    {
        $this->nombre = $nombre;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNombre(): string
    {
        return $this->nombre;
    }
}
