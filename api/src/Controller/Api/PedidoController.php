<?php

namespace App\Controller\Api;

use App\Entity\Alquiler;
use App\Entity\Cliente;
use App\Entity\Pedido;
use App\Enum\EstadoPedido;
use App\Http\ApiException;
use App\Http\Paginacion;
use App\Http\Ubicacion;
use App\Repository\AlquilerRepository;
use App\Repository\PedidoRepository;
use App\Service\PedidoService;
use App\Service\Presentador;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Pedidos (compras y alquileres) y /api/alquileres.
 * Cliente: solo los suyos. Admin: todos. El técnico no ve pedidos (403).
 */
#[Route('/api')]
final class PedidoController extends ApiController
{
    public function __construct(
        private readonly PedidoRepository $pedidos,
        private readonly AlquilerRepository $alquileres,
        private readonly PedidoService $servicio,
        private readonly Presentador $presentador,
        private readonly EntityManagerInterface $em,
    ) {
    }

    /** Paginado, del más reciente al más antiguo. ?estado=pendiente|preparado|entregado|cancelado */
    #[Route('/pedidos', methods: ['GET'])]
    public function listar(Request $request): JsonResponse
    {
        $cliente = $this->esAdmin() ? null : $this->cliente();
        $qb = $this->pedidos->consultaListado($cliente, $this->enumQuery($request, 'estado', EstadoPedido::class));

        return $this->respuesta(Paginacion::paginar($qb, $request, fn (Pedido $p) => $this->presentador->pedido($p)));
    }

    #[Route('/pedidos/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function ver(int $id): JsonResponse
    {
        return $this->respuesta($this->presentador->pedido($this->pedidoVisible($id)));
    }

    /**
     * Solo clientes, y con ubicación (P-28).
     * {"metodoPago": "tarjeta", "lineas": [{"productoId": 30, "tipo": "compra", "cantidad": 1}, {"productoId": 12, "tipo": "alquiler", "dias": 7}]}
     */
    #[Route('/pedidos', methods: ['POST'])]
    public function crear(Request $request): JsonResponse
    {
        $cliente = $this->cliente();
        Ubicacion::exigir($request);
        $pedido = $this->servicio->crear($cliente, $this->datos($request));

        return $this->respuesta($this->presentador->pedido($pedido), Response::HTTP_CREATED);
    }

    /** {"estado": "..."}: el admin avanza el estado; el cliente solo cancela el suyo si está pendiente. */
    #[Route('/pedidos/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function cambiarEstado(Request $request, int $id): JsonResponse
    {
        $pedido = $this->pedidoVisible($id);
        $this->servicio->cambiarEstado($pedido, $this->datos($request), $this->usuario());

        return $this->respuesta($this->presentador->pedido($pedido));
    }

    /** Borra el pedido con sus compras y alquileres (ON DELETE CASCADE). No devuelve stock: para eso, cancelar. */
    #[Route('/pedidos/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function borrar(int $id): Response
    {
        $this->em->remove($this->existe($this->em->find(Pedido::class, $id), 'Ese pedido no existe.'));
        $this->em->flush();

        return $this->sinContenido();
    }

    // Alquileres --------------------------------------------------------------------

    /** ?estado=activo|retrasado|devuelto|cancelado (el estado se calcula). Paginado. */
    #[Route('/alquileres', methods: ['GET'])]
    public function listarAlquileres(Request $request): JsonResponse
    {
        $cliente = $this->esAdmin() ? null : $this->cliente();
        $estado = $request->query->get('estado');
        if ($estado !== null && $estado !== '' && !in_array($estado, ['activo', 'retrasado', 'devuelto', 'cancelado'], true)) {
            throw ApiException::validacion(['estado' => 'Valor no válido. Valores posibles: activo, retrasado, devuelto, cancelado.']);
        }
        $qb = $this->alquileres->consultaListado($cliente, $estado ?: null, new \DateTimeImmutable());

        return $this->respuesta(Paginacion::paginar($qb, $request, fn (Alquiler $a) => $this->presentador->alquiler($a)));
    }

    #[Route('/alquileres/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function verAlquiler(int $id): JsonResponse
    {
        return $this->respuesta($this->presentador->alquiler($this->alquilerVisible($id)));
    }

    /** Solo admin (P-16): {"fechaDevolucion": "AAAA-MM-DD"} registra la devolución (sin fecha = hoy; null = deshacer). */
    #[Route('/alquileres/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function registrarDevolucion(Request $request, int $id): JsonResponse
    {
        $alquiler = $this->alquilerVisible($id);
        $this->servicio->registrarDevolucion($alquiler, $this->datos($request));

        return $this->respuesta($this->presentador->alquiler($alquiler));
    }

    // ---------------------------------------------------------------------------------

    /** El admin ve cualquiera; el cliente solo los suyos (si no, 403). */
    private function pedidoVisible(int $id): Pedido
    {
        $pedido = $this->existe($this->em->find(Pedido::class, $id), 'Ese pedido no existe.');
        $this->comprobarDueno($pedido->getCliente());

        return $pedido;
    }

    private function alquilerVisible(int $id): Alquiler
    {
        $alquiler = $this->existe($this->em->find(Alquiler::class, $id), 'Ese alquiler no existe.');
        $this->comprobarDueno($alquiler->getPedido()->getCliente());

        return $alquiler;
    }

    private function comprobarDueno(Cliente $dueno): void
    {
        if (!$this->esAdmin() && $this->usuario()->getId() !== $dueno->getId()) {
            throw ApiException::prohibido('Este pedido no es tuyo.');
        }
    }
}
