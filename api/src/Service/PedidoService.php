<?php

namespace App\Service;

use App\Entity\Alquiler;
use App\Entity\Cliente;
use App\Entity\Compra;
use App\Entity\Pedido;
use App\Entity\Producto;
use App\Entity\Trabajador;
use App\Entity\Usuario;
use App\Entity\Videojuego;
use App\Enum\EstadoPedido;
use App\Enum\MetodoPago;
use App\Enum\TipoEntrega;
use App\Http\ApiException;
use App\Http\Datos;
use App\Repository\AlquilerRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Lógica de los pedidos (Reglas de negocio → Pedidos y Alquileres). La API decide; las apps solo avisan antes.
 */
final class PedidoService
{
    public const DIAS_MINIMO = 1;
    public const DIAS_MAXIMO = 14;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly AlquilerRepository $alquileres,
    ) {
    }

    /**
     * POST /api/pedidos
     * {"metodoPago": "tarjeta", "lineas": [{"productoId": 30, "tipo": "compra", "cantidad": 1},
     *                                      {"productoId": 12, "tipo": "alquiler", "dias": 7}],
     *  "entrega": "domicilio", "direccionEntrega": "Calle…", "latitudEntrega": 43.26, "longitudEntrega": -2.93}
     * entrega es opcional («tienda» por defecto); a domicilio, dirección y punto del mapa obligatorios (ADR-038).
     *
     * Todo en UNA transacción: si una línea falla (sin stock, sin copias…) no se guarda nada.
     * Se bloquea la fila de cada producto (SELECT … FOR UPDATE) para que dos pedidos a la vez
     * no vendan la misma última unidad.
     */
    public function crear(Cliente $cliente, Datos $datos): Pedido
    {
        $metodoPago = $datos->enum('metodoPago', MetodoPago::class, true);
        $lineas = $datos->listaDeObjetos('lineas');
        if ($lineas === []) {
            throw ApiException::validacion(['lineas' => 'El pedido tiene que tener al menos un producto.']);
        }
        $domicilio = $this->datosDomicilio($datos);

        return $this->em->wrapInTransaction(function () use ($cliente, $metodoPago, $lineas, $domicilio): Pedido {
            $ahora = new \DateTimeImmutable();
            $pedido = new Pedido($cliente, $metodoPago, $ahora);
            if ($domicilio !== null) {
                $pedido->enviarA(...$domicilio);
            }
            $comprados = [];
            $alquilados = [];
            $bloqueados = []; // productos ya bloqueados en este pedido (ver bloquear())

            foreach ($lineas as $i => $valores) {
                $linea = new Datos($valores);
                $campo = fn (string $c) => "lineas[$i].$c";
                $productoId = $this->entero($linea, 'productoId', $campo('productoId'));
                $tipo = $linea->tiene('tipo') ? $linea->texto('tipo') : null;

                if ($tipo === 'compra') {
                    $cantidad = $this->entero($linea, 'cantidad', $campo('cantidad'));
                    if ($cantidad < 1) {
                        throw ApiException::validacion([$campo('cantidad') => 'La cantidad mínima es 1.']);
                    }
                    if (isset($comprados[$productoId])) {
                        throw ApiException::validacion([$campo('productoId') => 'Este producto ya está en el pedido.']);
                    }
                    $producto = $this->bloquear($productoId, $bloqueados);
                    if ($producto === null || !$producto->isActivo()) {
                        throw ApiException::validacion([$campo('productoId') => 'El producto no existe o ya no está a la venta.']);
                    }
                    if ($producto->getStock() < $cantidad) {
                        throw ApiException::conflicto('STOCK_INSUFICIENTE', sprintf(
                            'No hay stock suficiente de «%s» (quedan %d).', $producto->getNombre(), $producto->getStock()
                        ), [$campo('cantidad') => sprintf('Quedan %d unidades.', $producto->getStock())]);
                    }
                    $producto->setStock($producto->getStock() - $cantidad);
                    // El precio lo pone la API (el del día), nunca la app.
                    $pedido->addCompra(new Compra($pedido, $producto, $cantidad, (string) $producto->getPrecio()));
                    $comprados[$productoId] = true;
                } elseif ($tipo === 'alquiler') {
                    $dias = $this->entero($linea, 'dias', $campo('dias'));
                    if ($dias < self::DIAS_MINIMO || $dias > self::DIAS_MAXIMO) {
                        throw ApiException::validacion([$campo('dias') => sprintf('Un alquiler dura entre %d y %d días.', self::DIAS_MINIMO, self::DIAS_MAXIMO)]);
                    }
                    if (isset($alquilados[$productoId])) {
                        throw ApiException::validacion([$campo('productoId') => 'Este videojuego ya está alquilado en el pedido.']);
                    }
                    $videojuego = $this->bloquear($productoId, $bloqueados);
                    if (!$videojuego instanceof Videojuego || !$videojuego->isActivo()) {
                        throw ApiException::validacion([$campo('productoId') => 'Solo se pueden alquilar videojuegos del catálogo.']);
                    }
                    $ocupadas = $this->alquileres->copiasOcupadas([$productoId])[$productoId];
                    if ($videojuego->getCopiasAlquiler() - $ocupadas < 1) {
                        throw ApiException::conflicto('SIN_COPIAS', sprintf('No quedan copias de «%s» para alquilar.', $videojuego->getNombre()));
                    }
                    $fechaFin = $ahora->setTime(0, 0)->modify(sprintf('+%d days', $dias));
                    $pedido->addAlquiler(new Alquiler($pedido, $videojuego, (string) $videojuego->getPrecioAlquiler(), $fechaFin));
                    $alquilados[$productoId] = true;
                } else {
                    throw ApiException::validacion([$campo('tipo') => 'Tiene que ser "compra" o "alquiler".']);
                }
            }

            $this->em->persist($pedido);
            $this->em->flush();

            return $pedido;
        });
    }

    /**
     * Envío a domicilio (ADR-038): devuelve [dirección, latitud, longitud] o null si se recoge en la tienda.
     * Se valida antes de la transacción: si faltan datos no se toca el stock.
     *
     * @return array{0: string, 1: string, 2: string}|null
     */
    private function datosDomicilio(Datos $datos): ?array
    {
        $entrega = $datos->enum('entrega', TipoEntrega::class) ?? TipoEntrega::Tienda;
        if ($entrega === TipoEntrega::Tienda) {
            return null;
        }
        $direccion = trim((string) $datos->texto('direccionEntrega'));
        $latitud = $datos->decimal('latitudEntrega', false, 7);
        $longitud = $datos->decimal('longitudEntrega', false, 7);

        $errores = [];
        if (mb_strlen($direccion) < 5 || mb_strlen($direccion) > 255) {
            $errores['direccionEntrega'] = 'Escribe la dirección de entrega (calle, número, código postal y ciudad).';
        }
        if ($latitud === null || $longitud === null || abs((float) $latitud) > 90 || abs((float) $longitud) > 180) {
            $errores['ubicacionEntrega'] = 'Marca en el mapa dónde quieres recibir el pedido.';
        }
        if ($errores !== []) {
            throw ApiException::validacion($errores);
        }

        return [$direccion, $latitud, $longitud];
    }

    /**
     * PUT /api/pedidos/{id} {"estado": "..."}
     * Admin: pendiente → preparado → entregado, o cancelado. Cliente: solo cancelar el suyo si está pendiente.
     * Al cancelar se devuelve el stock de las compras; las copias alquiladas se liberan solas
     * (los alquileres de pedidos cancelados no cuentan, ADR-034).
     */
    public function cambiarEstado(Pedido $pedido, Datos $datos, Usuario $actor): void
    {
        $nuevo = $datos->enum('estado', EstadoPedido::class, true);
        $esAdmin = $actor instanceof Trabajador && $actor->esAdmin();
        if (!$esAdmin && $nuevo !== EstadoPedido::Cancelado) {
            throw ApiException::prohibido('Solo puedes cancelar tu pedido.');
        }
        if (!$pedido->getEstado()->puedePasarA($nuevo)) {
            throw ApiException::validacion(['estado' => sprintf(
                'Un pedido %s no puede pasar a %s.', $pedido->getEstado()->value, $nuevo->value
            )]);
        }

        $this->em->wrapInTransaction(function () use ($pedido, $nuevo): void {
            if ($nuevo === EstadoPedido::Cancelado) {
                foreach ($pedido->getCompras() as $compra) {
                    $producto = $compra->getProducto();
                    $this->em->lock($producto, LockMode::PESSIMISTIC_WRITE);
                    $this->em->refresh($producto);
                    $producto->setStock($producto->getStock() + $compra->getCantidad());
                }
            }
            $pedido->setEstado($nuevo);
            $this->em->flush();
        });
    }

    /** PUT /api/alquileres/{id} {"fechaDevolucion": "AAAA-MM-DD"} (solo admin, P-16). */
    public function registrarDevolucion(Alquiler $alquiler, Datos $datos): void
    {
        if ($alquiler->getPedido()->getEstado() === EstadoPedido::Cancelado) {
            throw ApiException::validacion(['fechaDevolucion' => 'El pedido de este alquiler está cancelado.']);
        }
        $fecha = $datos->tiene('fechaDevolucion') ? $datos->fecha('fechaDevolucion') : new \DateTimeImmutable('today');
        if ($fecha !== null) {
            if ($fecha < $alquiler->getFechaInicio()) {
                throw ApiException::validacion(['fechaDevolucion' => 'La devolución no puede ser anterior al alquiler.']);
            }
            if ($fecha > new \DateTimeImmutable('today')) {
                throw ApiException::validacion(['fechaDevolucion' => 'La devolución no puede ser una fecha futura.']);
            }
        }
        // null = deshacer una devolución marcada por error
        $alquiler->setFechaDevolucion($fecha);
        $this->em->flush();
    }

    /**
     * Carga el producto con SELECT … FOR UPDATE, UNA sola vez por pedido.
     * Ojo: si se vuelve a pedir a Doctrine con bloqueo un producto que ya está cargado, lo RECARGA
     * desde la BBDD y se pierde la resta de stock hecha en memoria (pasaba al comprar y alquilar el
     * mismo juego en el mismo pedido). Por eso se guarda en $bloqueados y se reutiliza.
     *
     * @param array<int, Producto|null> $bloqueados
     */
    private function bloquear(int $id, array &$bloqueados): ?Producto
    {
        if (!array_key_exists($id, $bloqueados)) {
            $bloqueados[$id] = $this->em->find(Producto::class, $id, LockMode::PESSIMISTIC_WRITE);
        }

        return $bloqueados[$id];
    }

    private function entero(Datos $linea, string $clave, string $campo): int
    {
        try {
            return $linea->entero($clave, true);
        } catch (ApiException) {
            throw ApiException::validacion([$campo => 'Tiene que ser un número entero.']);
        }
    }
}
