<?php

namespace App\Service;

use App\Entity\Cliente;
use App\Entity\Departamento;
use App\Entity\Reparacion;
use App\Entity\Trabajador;
use App\Entity\Usuario;
use App\Enum\EstadoReparacion;
use App\Http\ApiException;
use App\Http\Datos;
use App\Repository\TrabajadorRepository;
use Doctrine\ORM\EntityManagerInterface;

/** Lógica del soporte técnico (Reglas de negocio → Reparaciones). */
final class ReparacionService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly TrabajadorRepository $trabajadores,
        private readonly Imagenes $imagenes,
    ) {
    }

    /**
     * POST /api/reparaciones {"departamentoId": 1, "dispositivo": "iPhone 13", "problema": "…", "foto": "…"}
     * El cliente elige el departamento y la API asigna el técnico con menos reparaciones abiertas.
     */
    public function crear(Cliente $cliente, Datos $datos): Reparacion
    {
        $departamentoId = $datos->entero('departamentoId', true);
        $departamento = $this->em->find(Departamento::class, $departamentoId);
        if ($departamento === null) {
            throw ApiException::validacion(['departamentoId' => 'Ese departamento no existe.']);
        }
        $dispositivo = $datos->texto('dispositivo', true);
        if (mb_strlen($dispositivo) > 100) {
            throw ApiException::validacion(['dispositivo' => 'Como máximo 100 caracteres.']);
        }
        $problema = $datos->texto('problema', true);
        $foto = $this->imagenes->aRuta($datos->texto('foto'), 'foto');

        $tecnico = $this->trabajadores->tecnicoConMenosCarga($departamento);
        if ($tecnico === null) {
            throw ApiException::conflicto('SIN_TECNICOS', 'Ahora mismo no hay técnicos en ese departamento. Inténtalo más tarde.');
        }

        $reparacion = new Reparacion($cliente, $tecnico, $dispositivo, $problema, new \DateTimeImmutable());
        $reparacion->setFoto($foto);
        $this->em->persist($reparacion);
        $this->em->flush();

        return $reparacion;
    }

    /**
     * PUT /api/reparaciones/{id} {"estado"?, "presupuesto"?, "tecnicoId"?}
     * - Cliente: solo {"estado": "cancelada"} de la suya, si está recibida o en_reparacion.
     * - Técnico: estado y presupuesto de las de su departamento.
     * - Admin: además puede reasignar el técnico (del mismo departamento).
     * (Que el usuario pueda VER la reparación ya lo ha comprobado el controlador.)
     */
    public function actualizar(Reparacion $reparacion, Datos $datos, Usuario $actor): void
    {
        $esAdmin = $actor instanceof Trabajador && $actor->esAdmin();

        if ($actor instanceof Cliente) {
            if ($datos->tiene('presupuesto') || $datos->tiene('tecnicoId')
                || $datos->enum('estado', EstadoReparacion::class, true) !== EstadoReparacion::Cancelada) {
                throw ApiException::prohibido('Solo puedes cancelar tu reparación.');
            }
        }
        if ($datos->tiene('tecnicoId') && !$esAdmin) {
            throw ApiException::prohibido('Solo el admin puede cambiar el técnico.');
        }

        if ($datos->tiene('estado')) {
            $nuevo = $datos->enum('estado', EstadoReparacion::class, true);
            if ($nuevo !== $reparacion->getEstado()) {
                if (!$reparacion->getEstado()->puedePasarA($nuevo)) {
                    throw ApiException::validacion(['estado' => sprintf(
                        'Una reparación %s no puede pasar a %s.', $reparacion->getEstado()->value, $nuevo->value
                    )]);
                }
                $reparacion->setEstado($nuevo);
                if ($nuevo === EstadoReparacion::Entregada) {
                    $reparacion->setFechaSalida(new \DateTimeImmutable());
                }
            }
        }

        if ($datos->tiene('presupuesto')) {
            $presupuesto = $datos->decimal('presupuesto');
            if ($presupuesto !== null && (float) $presupuesto < 0) {
                throw ApiException::validacion(['presupuesto' => 'El presupuesto no puede ser negativo.']);
            }
            $reparacion->setPresupuesto($presupuesto);
        }

        if ($datos->tiene('tecnicoId')) {
            $tecnico = $this->em->find(Trabajador::class, $datos->entero('tecnicoId', true));
            if ($tecnico === null || !$tecnico->esTecnico() || !$tecnico->isActivo()) {
                throw ApiException::validacion(['tecnicoId' => 'Tiene que ser un técnico activo.']);
            }
            // El departamento de la reparación es el de su técnico: reasignar a otro departamento la cambiaría de sitio.
            if ($tecnico->getDepartamento()?->getId() !== $reparacion->getDepartamento()?->getId()) {
                throw ApiException::validacion(['tecnicoId' => 'El técnico tiene que ser del mismo departamento que la reparación.']);
            }
            $reparacion->setTecnico($tecnico);
        }

        $this->em->flush();
    }
}
