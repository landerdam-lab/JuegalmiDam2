<?php

namespace App\Entity;

use App\Repository\UsuarioRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Supertipo de todas las personas que inician sesión (ADR-032).
 * Herencia JOINED: los datos comunes van en `usuario` y los propios en `cliente` o `trabajador`.
 * La columna `tipo` (discriminador) la rellena Doctrine según la clase: no hay propiedad para ella.
 */
#[ORM\Entity(repositoryClass: UsuarioRepository::class)]
#[ORM\Table(name: 'usuario')]
#[ORM\UniqueConstraint(name: 'uq_usuario_email', columns: ['email'])]
#[ORM\InheritanceType('JOINED')]
#[ORM\DiscriminatorColumn(name: 'tipo', type: 'string', length: 10)]
#[ORM\DiscriminatorMap(['cliente' => Cliente::class, 'trabajador' => Trabajador::class])]
abstract class Usuario implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private ?string $nombre = null;

    #[ORM\Column(length: 150)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 150)]
    private ?string $apellidos = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(max: 180)]
    private ?string $email = null;

    /** Hash de la contraseña (nunca en claro). Lo calcula UserPasswordHasher. */
    #[ORM\Column(length: 255)]
    private ?string $password = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    #[Assert\Regex(pattern: '/^\+?[0-9 ]{9,20}$/', message: 'El teléfono no es válido.')]
    private ?string $telefono = null;

    /** Baja lógica (ADR-025): un usuario desactivado no puede iniciar sesión. */
    #[ORM\Column(options: ['default' => true])]
    private bool $activo = true;

    /** "cliente" o "trabajador" (el mismo valor que la columna discriminadora). */
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

    public function getApellidos(): ?string
    {
        return $this->apellidos;
    }

    public function setApellidos(?string $apellidos): static
    {
        $this->apellidos = $apellidos === null ? null : trim($apellidos);

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

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $hash): static
    {
        $this->password = $hash;

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

    public function isActivo(): bool
    {
        return $this->activo;
    }

    public function setActivo(bool $activo): static
    {
        $this->activo = $activo;

        return $this;
    }

    /** Identificador para Symfony Security: el email. */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function eraseCredentials(): void
    {
    }
}
