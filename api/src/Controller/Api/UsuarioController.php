<?php

namespace App\Controller\Api;

use App\Entity\Cliente;
use App\Entity\Trabajador;
use App\Entity\Usuario;
use App\Enum\Puesto;
use App\Http\ApiException;
use App\Http\Paginacion;
use App\Repository\TrabajadorRepository;
use App\Repository\UsuarioRepository;
use App\Service\Presentador;
use App\Service\UsuarioService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Backoffice de la web (solo admin):
 * - /api/usuarios: clientes (el listado admite ?tipo=cliente|trabajador para ver a todos).
 * - /api/trabajadores: técnicos y admins.
 * Un usuario con historial no se borra: se desactiva con {"activo": false} (ADR-025).
 */
#[Route('/api')]
#[IsGranted('ROLE_ADMIN')]
final class UsuarioController extends ApiController
{
    public function __construct(
        private readonly UsuarioRepository $usuarios,
        private readonly TrabajadorRepository $trabajadores,
        private readonly UsuarioService $servicio,
        private readonly Presentador $presentador,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /** ?tipo=cliente|trabajador &activo=0|1 (por defecto 1) &q=texto &page &limit */
    #[Route('/usuarios', methods: ['GET'])]
    public function listar(Request $request): JsonResponse
    {
        $tipo = $request->query->get('tipo');
        if ($tipo !== null && $tipo !== '' && !in_array($tipo, ['cliente', 'trabajador'], true)) {
            throw ApiException::validacion(['tipo' => 'Valor no válido. Valores posibles: cliente, trabajador.']);
        }
        $qb = $this->usuarios->consultaListado($tipo ?: null, $request->query->getBoolean('activo', true), $request->query->get('q'));

        return $this->respuesta(Paginacion::paginar($qb, $request, fn (Usuario $u) => $this->presentador->usuario($u)));
    }

    #[Route('/usuarios/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function ver(int $id): JsonResponse
    {
        return $this->respuesta($this->presentador->usuario($this->buscar(Usuario::class, $id)));
    }

    /** Crea un cliente: {nombre, apellidos, email, password, telefono, dni} → 201 */
    #[Route('/usuarios', methods: ['POST'])]
    public function crear(Request $request): JsonResponse
    {
        return $this->respuesta($this->presentador->usuario($this->servicio->crearCliente($this->datos($request))), Response::HTTP_CREATED);
    }

    /** Cualquier campo del cliente, más email, dni, password y activo. */
    #[Route('/usuarios/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function editar(Request $request, int $id): JsonResponse
    {
        $cliente = $this->buscar(Cliente::class, $id, 'Ese cliente no existe (los trabajadores van en /api/trabajadores).');
        $this->servicio->actualizar($cliente, $this->datos($request), true);

        return $this->respuesta($this->presentador->usuario($cliente));
    }

    /** 409 EN_USO si tiene pedidos o reparaciones: mejor desactivarlo. */
    #[Route('/usuarios/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function borrar(int $id): Response
    {
        $cliente = $this->buscar(Cliente::class, $id, 'Ese cliente no existe (los trabajadores van en /api/trabajadores).');
        if ($this->usuarios->clienteTieneHistorial($cliente)) {
            throw ApiException::conflicto('EN_USO', 'Este cliente tiene pedidos o reparaciones: desactívalo ({"activo": false}) en vez de borrarlo.');
        }
        $this->em->remove($cliente);
        $this->em->flush();

        return $this->sinContenido();
    }

    // Trabajadores ---------------------------------------------------------------------

    /** ?puesto=tecnico|admin &departamento={id} &activo=0|1. Los técnicos incluyen sus reparaciones abiertas. */
    #[Route('/trabajadores', methods: ['GET'])]
    public function listarTrabajadores(Request $request): JsonResponse
    {
        $qb = $this->trabajadores->consultaListado(
            $this->enumQuery($request, 'puesto', Puesto::class),
            $this->enteroQuery($request, 'departamento'),
            $request->query->getBoolean('activo', true),
        );
        $abiertas = [];

        return $this->respuesta(Paginacion::paginar(
            $qb,
            $request,
            function (Trabajador $t) use (&$abiertas): array {
                return $this->presentador->trabajador($t, $abiertas[$t->getId()] ?? 0);
            },
            function (array $trabajadores) use (&$abiertas): void {
                $abiertas = $this->trabajadores->reparacionesAbiertas(array_map(fn (Trabajador $t) => $t->getId(), $trabajadores));
            },
        ));
    }

    #[Route('/trabajadores/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function verTrabajador(int $id): JsonResponse
    {
        return $this->respuesta($this->jsonTrabajador($this->buscar(Trabajador::class, $id, 'Ese trabajador no existe.')));
    }

    /** {nombre, apellidos, email, password, telefono, puesto, departamentoId?} (departamentoId solo y siempre en técnicos) → 201 */
    #[Route('/trabajadores', methods: ['POST'])]
    public function crearTrabajador(Request $request): JsonResponse
    {
        return $this->respuesta($this->jsonTrabajador($this->servicio->crearTrabajador($this->datos($request))), Response::HTTP_CREATED);
    }

    #[Route('/trabajadores/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function editarTrabajador(Request $request, int $id): JsonResponse
    {
        $trabajador = $this->buscar(Trabajador::class, $id, 'Ese trabajador no existe.');
        $datos = $this->datos($request);
        if ($trabajador->getId() === $this->usuario()->getId() && ($datos->tiene('activo') || $datos->tiene('puesto'))) {
            throw ApiException::validacion(['activo' => 'No puedes desactivarte ni cambiarte el puesto a ti mismo.']);
        }
        $this->servicio->actualizar($trabajador, $datos, true);

        return $this->respuesta($this->jsonTrabajador($trabajador));
    }

    /** 409 EN_USO si tiene reparaciones (mejor desactivarlo). */
    #[Route('/trabajadores/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function borrarTrabajador(int $id): Response
    {
        $trabajador = $this->buscar(Trabajador::class, $id, 'Ese trabajador no existe.');
        if ($trabajador->getId() === $this->usuario()->getId()) {
            throw ApiException::conflicto('EN_USO', 'No puedes borrar tu propia cuenta.');
        }
        if ($this->trabajadores->tieneReparaciones($trabajador)) {
            throw ApiException::conflicto('EN_USO', 'Este técnico tiene reparaciones: desactívalo ({"activo": false}) en vez de borrarlo.');
        }
        $this->em->remove($trabajador);
        $this->em->flush();

        return $this->sinContenido();
    }

    // ---------------------------------------------------------------------------------

    private function jsonTrabajador(Trabajador $t): array
    {
        return $this->presentador->trabajador($t, $this->trabajadores->reparacionesAbiertas([$t->getId()])[$t->getId()]);
    }

    /**
     * @template T of Usuario
     *
     * @param class-string<T> $clase
     *
     * @return T
     */
    private function buscar(string $clase, int $id, string $mensaje = 'Ese usuario no existe.'): Usuario
    {
        return $this->existe($this->em->find($clase, $id), $mensaje);
    }
}
