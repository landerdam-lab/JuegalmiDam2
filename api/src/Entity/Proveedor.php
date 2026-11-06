<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Empresa a la que la tienda compra la mercancía (ADR-042). No es la marca: la marca FABRICA el
 * producto (Sony, Samsung…) y el proveedor se lo VENDE a la tienda (un distribuidor).
 * Qué productos sirve cada proveedor y a qué precio: ProductoProveedor (N:M con atributo).
 * Solo lo ve el admin en la web: las apps son para clientes (ADR-024).
 */
#[ORM\Entity]
#[ORM\Table(name: 'proveedor')]
#[ORM\UniqueConstraint(name: 'uq_proveedor_cif', columns: ['cif'])]
#[UniqueEntity(fields: ['cif'], message: 'Ya existe un proveedor con ese CIF.')]
class Proveedor
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private ?string $nombre = null;

    /** CIF de empresa: letra, 7 cifras y un control (cifra o letra). También lo comprueba un CHECK. */
    #[ORM\Column(length: 9, options: ['fixed' => true])]
    #[Assert\NotBlank]
    #[Assert\Regex(pattern: '/^[A-Z][0-9]{7}[0-9A-J]$/', message: 'El CIF tiene que ser una letra, 7 cifras y una cifra o letra de control (p. ej. B12345678).')]
    private ?string $cif = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 20)]
    private ?string $telefono = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(max: 180)]
    private ?string $email = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Length(max: 255)]
    private ?string $direccion = null;

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

    public function getCif(): ?string
    {
        return $this->cif;
    }

    /** Se guarda en mayúsculas y sin espacios: "b 1234567 8" → "B12345678". */
    public function setCif(?string $cif): static
    {
        $this->cif = $cif === null ? null : strtoupper(str_replace([' ', '-'], '', $cif));

        return $this;
    }

    public function getTelefono(): ?string
    {
        return $this->telefono;
    }

    public function setTelefono(?string $telefono): static
    {
        $this->telefono = $telefono === null ? null : trim($telefono);

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = $email === null ? null : mb_strtolower(trim($email));

        return $this;
    }

    public function getDireccion(): ?string
    {
        return $this->direccion;
    }

    public function setDireccion(?string $direccion): static
    {
        $direccion = $direccion === null ? null : trim($direccion);
        $this->direccion = $direccion === '' ? null : $direccion;

        return $this;
    }
}
