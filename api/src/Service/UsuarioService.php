<?php

namespace App\Service;

use App\Entity\Cliente;
use App\Entity\Departamento;
use App\Entity\Trabajador;
use App\Entity\Usuario;
use App\Enum\Puesto;
use App\Http\ApiException;
use App\Http\Datos;
use App\Repository\TrabajadorRepository;
use App\Repository\UsuarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Alta y modificación de usuarios: registro público (clientes), perfil propio (/me)
 * y gestión del admin (/usuarios para clientes, /trabajadores para técnicos y admins).
 */
final class UsuarioService
{
    public const PASSWORD_MINIMO = 8;

    public function __construct(
        private readonly UsuarioRepository $usuarios,
        private readonly TrabajadorRepository $trabajadores,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly Imagenes $imagenes,
        private readonly Validacion $validacion,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /** POST /api/registro y POST /api/usuarios: siempre crea un CLIENTE. */
    public function crearCliente(Datos $datos): Cliente
    {
        $cliente = new Cliente();
        $this->rellenarComunes($cliente, $datos, true);
        $this->rellenarCliente($cliente, $datos, true);
        $this->guardar($cliente);

        return $cliente;
    }

    /** POST /api/trabajadores (admin) */
    public function crearTrabajador(Datos $datos): Trabajador
    {
        $trabajador = new Trabajador();
        $this->rellenarComunes($trabajador, $datos, true);
        $this->rellenarTrabajador($trabajador, $datos, true);
        $this->guardar($trabajador);

        return $trabajador;
    }

    /**
     * PUT /api/me, /api/usuarios/{id} y /api/trabajadores/{id}. Solo cambia los campos que vienen.
     *
     * @param bool $comoAdmin el admin puede cambiar además email, activo, dni y puesto/departamento
     */
    public function actualizar(Usuario $usuario, Datos $datos, bool $comoAdmin): void
    {
        $this->rellenarComunes($usuario, $datos, false, $comoAdmin);
        if ($usuario instanceof Cliente) {
            $this->rellenarCliente($usuario, $datos, false, $comoAdmin);
        }
        if ($usuario instanceof Trabajador && $comoAdmin) {
            $this->rellenarTrabajador($usuario, $datos, false);
        }
        $this->guardar($usuario);
    }

    private function rellenarComunes(Usuario $u, Datos $datos, bool $crear, bool $comoAdmin = true): void
    {
        if ($crear || $datos->tiene('nombre')) {
            $u->setNombre($datos->texto('nombre', true));
        }
        if ($crear || $datos->tiene('apellidos')) {
            $u->setApellidos($datos->texto('apellidos', true));
        }
        if ($crear || $datos->tiene('telefono')) {
            $u->setTelefono($datos->texto('telefono', true));
        }
        if ($crear || ($comoAdmin && $datos->tiene('email'))) {
            $email = $datos->texto('email', true);
            if ($this->usuarios->emailEnUso($email, $u->getId())) {
                throw ApiException::conflicto('EMAIL_REPETIDO', 'Ya existe una cuenta con ese email.', ['email' => 'Ya existe una cuenta con ese email.']);
            }
            $u->setEmail($email);
        }
        if ($crear || $datos->tiene('password')) {
            $password = $datos->texto('password', true);
            if (mb_strlen($password) < self::PASSWORD_MINIMO) {
                throw ApiException::validacion(['password' => sprintf('La contraseña tiene que tener al menos %d caracteres.', self::PASSWORD_MINIMO)]);
            }
            $u->setPassword($this->hasher->hashPassword($u, $password));
        }
        if (!$crear && $comoAdmin && $datos->tiene('activo')) {
            $u->setActivo($datos->booleano('activo', true));
        }
    }

    private function rellenarCliente(Cliente $c, Datos $datos, bool $crear, bool $comoAdmin = true): void
    {
        if ($crear || ($comoAdmin && $datos->tiene('dni'))) {
            $dni = strtoupper($datos->texto('dni', true));
            if ($this->usuarios->dniEnUso($dni, $c->getId())) {
                throw ApiException::conflicto('DNI_REPETIDO', 'Ya existe una cuenta con ese DNI o NIE.', ['dni' => 'Ya existe una cuenta con ese DNI o NIE.']);
            }
            $c->setDni($dni);
        }
        if ($datos->tiene('foto')) {
            $c->setFoto($this->imagenes->aRuta($datos->texto('foto'), 'foto'));
        }
    }

    private function rellenarTrabajador(Trabajador $t, Datos $datos, bool $crear): void
    {
        $puestoAntes = $t->getPuesto();
        $departamentoAntes = $t->getDepartamento();

        if ($crear || $datos->tiene('puesto')) {
            $t->setPuesto($datos->enum('puesto', Puesto::class, true));
        }
        if ($crear || $datos->tiene('departamentoId')) {
            $departamentoId = $datos->entero('departamentoId');
            $departamento = $departamentoId === null ? null : $this->em->find(Departamento::class, $departamentoId);
            if ($departamentoId !== null && $departamento === null) {
                throw ApiException::validacion(['departamentoId' => 'Ese departamento no existe.']);
            }
            $t->setDepartamento($departamento);
        } elseif ($t->getPuesto() === Puesto::Admin) {
            $t->setDepartamento(null); // al pasar a admin pierde el departamento
        }

        // Un técnico con reparaciones abiertas no puede cambiar de puesto ni de departamento:
        // sus reparaciones quedarían en otro departamento o asignadas a un admin.
        $cambia = $puestoAntes !== $t->getPuesto() || $departamentoAntes?->getId() !== $t->getDepartamento()?->getId();
        if (!$crear && $cambia && $puestoAntes === Puesto::Tecnico && $this->trabajadores->tieneReparaciones($t, true)) {
            throw ApiException::conflicto('EN_USO', 'Este técnico tiene reparaciones abiertas: reasígnalas antes de cambiarle el puesto o el departamento.');
        }
        if (!$crear && $puestoAntes === Puesto::Tecnico && $t->getPuesto() === Puesto::Admin && $this->trabajadores->tieneReparaciones($t)) {
            throw ApiException::conflicto('EN_USO', 'Un técnico con reparaciones no puede pasar a admin.');
        }
    }

    private function guardar(Usuario $u): void
    {
        $this->validacion->validar($u);
        $this->em->persist($u);
        $this->em->flush();
    }
}
