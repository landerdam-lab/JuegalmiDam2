<?php

namespace App\Service;

use App\Entity\Alquiler;
use App\Entity\Cliente;
use App\Entity\Compra;
use App\Entity\Consola;
use App\Entity\Departamento;
use App\Entity\FotoTienda;
use App\Entity\Marca;
use App\Entity\Movil;
use App\Entity\Pedido;
use App\Entity\Plataforma;
use App\Entity\Producto;
use App\Entity\ProductoProveedor;
use App\Entity\Proveedor;
use App\Entity\RegistroUbicacion;
use App\Entity\Reparacion;
use App\Entity\Servicio;
use App\Entity\Tienda;
use App\Entity\Trabajador;
use App\Entity\Usuario;
use App\Entity\Videojuego;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Convierte las entidades en el JSON que recibe la app (claves en camelCase, ADR-027).
 *
 * Por qué a mano y no con el Serializer: así se ve campo a campo qué sale de la API.
 * Nunca se envía la contraseña ni el token, las relaciones no hacen bucles infinitos
 * y el dinero y las coordenadas salen como números (en PHP llegan como texto).
 */
final class Presentador
{
    public function __construct(
        private readonly Imagenes $imagenes,
        private readonly Security $security,
    ) {
    }

    // Usuarios ------------------------------------------------------------------

    /** @return array<string, mixed> */
    public function usuario(Usuario $u): array
    {
        $departamento = $u instanceof Trabajador ? $u->getDepartamento() : null;

        return [
            'id' => $u->getId(),
            'tipo' => $u->getTipo(),
            'nombre' => $u->getNombre(),
            'apellidos' => $u->getApellidos(),
            'email' => $u->getEmail(),
            'telefono' => $u->getTelefono(),
            'activo' => $u->isActivo(),
            // Solo clientes
            'dni' => $u instanceof Cliente ? $u->getDni() : null,
            'foto' => $u instanceof Cliente ? $this->imagenes->url($u->getFoto()) : null,
            // Solo trabajadores
            'puesto' => $u instanceof Trabajador ? $u->getPuesto()?->value : null,
            'departamentoId' => $departamento?->getId(),
            'departamento' => $departamento ? $this->departamento($departamento) : null,
        ];
    }

    /** @return array<string, mixed> */
    public function trabajador(Trabajador $t, int $reparacionesAbiertas): array
    {
        return $this->usuario($t) + ['reparacionesAbiertas' => $t->esTecnico() ? $reparacionesAbiertas : null];
    }

    // Catálogo -------------------------------------------------------------------

    /**
     * @param int|null $copiasOcupadas solo videojuegos: alquileres activos ahora mismo
     *
     * @return array<string, mixed>
     */
    public function producto(Producto $p, ?int $copiasOcupadas = null): array
    {
        // ADR-028: sin token (web pública) no se envía el stock exacto, solo si está disponible.
        $conSesion = $this->security->getUser() !== null;

        $json = [
            'id' => $p->getId(),
            'tipo' => $p->getTipo(),
            'nombre' => $p->getNombre(),
            'descripcion' => $p->getDescripcion(),
            'precio' => (float) $p->getPrecio(),
            'disponible' => $p->getStock() > 0,
            'imagen' => $this->imagenes->url($p->getImagen()),
            'activo' => $p->isActivo(),
            'marca' => $this->marca($p->getMarca()),
        ];
        if ($conSesion) {
            $json['stock'] = $p->getStock();
        }

        if ($p instanceof Videojuego) {
            $disponibles = max(0, $p->getCopiasAlquiler() - ($copiasOcupadas ?? 0));
            $json += [
                'plataforma' => $this->plataforma($p->getPlataforma()),
                'genero' => $p->getGenero(),
                'pegi' => $p->getPegi(),
                'precioAlquiler' => (float) $p->getPrecioAlquiler(),
                'alquilable' => $disponibles > 0,
            ];
            if ($conSesion) {
                $json['copiasAlquiler'] = $p->getCopiasAlquiler();
                $json['copiasDisponibles'] = $disponibles;
            }
        } elseif ($p instanceof Movil) {
            $json += [
                'formato' => $p->getFormato()?->value,
                'pantallaPulgadas' => (float) $p->getPantallaPulgadas(),
                'ramGb' => $p->getRamGb(),
                'almacenamientoGb' => $p->getAlmacenamientoGb(),
            ];
        } elseif ($p instanceof Consola) {
            $json += [
                'modelo' => $p->getModelo(),
                'almacenamientoGb' => $p->getAlmacenamientoGb(),
            ];
        }

        return $json;
    }

    /** Versión corta de un producto, para las líneas de pedidos y alquileres. */
    private function productoCorto(Producto $p): array
    {
        return [
            'id' => $p->getId(),
            'tipo' => $p->getTipo(),
            'nombre' => $p->getNombre(),
            'imagen' => $this->imagenes->url($p->getImagen()),
        ];
    }

    /** @return array{id: int|null, nombre: string|null} */
    public function marca(?Marca $m): ?array
    {
        return $m ? ['id' => $m->getId(), 'nombre' => $m->getNombre()] : null;
    }

    // Proveedores (solo admin, ADR-042) -------------------------------------------

    /** @return array<string, mixed> */
    public function proveedor(Proveedor $p, ?int $numProductos = null): array
    {
        $json = [
            'id' => $p->getId(),
            'nombre' => $p->getNombre(),
            'cif' => $p->getCif(),
            'telefono' => $p->getTelefono(),
            'email' => $p->getEmail(),
            'direccion' => $p->getDireccion(),
        ];
        if ($numProductos !== null) {
            $json['numProductos'] = $numProductos;
        }

        return $json;
    }

    /**
     * Una fila de producto_proveedor. Desde el producto interesa el proveedor, y al revés.
     *
     * @return array<string, mixed>
     */
    public function productoProveedor(ProductoProveedor $pp, bool $conProducto): array
    {
        $proveedor = $pp->getProveedor();

        return [
            'id' => $pp->getId(),
            $conProducto ? 'producto' : 'proveedor' => $conProducto
                ? $this->productoCorto($pp->getProducto()) + ['precio' => (float) $pp->getProducto()->getPrecio()]
                : ['id' => $proveedor->getId(), 'nombre' => $proveedor->getNombre()],
            'precioCoste' => (float) $pp->getPrecioCoste(),
        ];
    }

    /** @return array{id: int|null, nombre: string|null} */
    public function plataforma(?Plataforma $p): ?array
    {
        return $p ? ['id' => $p->getId(), 'nombre' => $p->getNombre()] : null;
    }

    /** @return array{id: int|null, nombre: string} */
    public function departamento(Departamento $d): array
    {
        return ['id' => $d->getId(), 'nombre' => $d->getNombre()];
    }

    /** @return array<string, mixed> */
    public function servicio(Servicio $s): array
    {
        return [
            'id' => $s->getId(),
            'linea' => $s->getLinea()?->value,
            'nombre' => $s->getNombre(),
            'descripcion' => $s->getDescripcion(),
            'precioOrientativo' => $s->getPrecioOrientativo() !== null ? (float) $s->getPrecioOrientativo() : null,
        ];
    }

    // Pedidos y alquileres ----------------------------------------------------------

    /** @return array<string, mixed> */
    public function pedido(Pedido $p): array
    {
        $cliente = $p->getCliente();

        return [
            'id' => $p->getId(),
            'fecha' => $p->getFecha()->format(DATE_ATOM),
            'estado' => $p->getEstado()->value,
            'metodoPago' => $p->getMetodoPago()->value,
            // ADR-038: tienda | domicilio. Los datos de envío son null si se recoge en la tienda
            'entrega' => $p->getEntrega()->value,
            'direccionEntrega' => $p->getDireccionEntrega(),
            'latitudEntrega' => $p->getLatitudEntrega() !== null ? (float) $p->getLatitudEntrega() : null,
            'longitudEntrega' => $p->getLongitudEntrega() !== null ? (float) $p->getLongitudEntrega() : null,
            'cliente' => [
                'id' => $cliente->getId(),
                'nombre' => $cliente->getNombre(),
                'apellidos' => $cliente->getApellidos(),
                'email' => $cliente->getEmail(),
            ],
            'compras' => array_map(fn (Compra $c) => [
                'id' => $c->getId(),
                'producto' => $this->productoCorto($c->getProducto()),
                'cantidad' => $c->getCantidad(),
                'precioUnitario' => (float) $c->getPrecioUnitario(),
                'subtotal' => (float) $c->getSubtotal(),
            ], $p->getCompras()->toArray()),
            'alquileres' => array_map(fn (Alquiler $a) => $this->alquiler($a, false), $p->getAlquileres()->toArray()),
            'total' => (float) $p->getTotal(),
        ];
    }

    /** @return array<string, mixed> */
    public function alquiler(Alquiler $a, bool $conPedido = true): array
    {
        $json = [
            'id' => $a->getId(),
            'videojuego' => $this->productoCorto($a->getVideojuego()) + [
                'plataforma' => $this->plataforma($a->getVideojuego()->getPlataforma()),
            ],
            'precioDia' => (float) $a->getPrecioDia(),
            'dias' => $a->getDias(),
            'subtotal' => (float) $a->getSubtotal(),
            'fechaInicio' => $a->getFechaInicio()->format('Y-m-d'),
            'fechaFin' => $a->getFechaFin()->format('Y-m-d'),
            'fechaDevolucion' => $a->getFechaDevolucion()?->format('Y-m-d'),
            'estado' => $a->getEstado(new \DateTimeImmutable()),
        ];
        if ($conPedido) {
            $json['pedidoId'] = $a->getPedido()->getId();
            $json['clienteId'] = $a->getPedido()->getCliente()->getId();
        }

        return $json;
    }

    // Reparaciones ---------------------------------------------------------------

    /** @return array<string, mixed> */
    public function reparacion(Reparacion $r): array
    {
        $tecnico = $r->getTecnico();
        $cliente = $r->getCliente();
        $departamento = $r->getDepartamento();

        return [
            'id' => $r->getId(),
            'dispositivo' => $r->getDispositivo(),
            'problema' => $r->getProblema(),
            'estado' => $r->getEstado()->value,
            'fechaEntrada' => $r->getFechaEntrada()->format(DATE_ATOM),
            'fechaSalida' => $r->getFechaSalida()?->format(DATE_ATOM),
            'presupuesto' => $r->getPresupuesto() !== null ? (float) $r->getPresupuesto() : null,
            'foto' => $this->imagenes->url($r->getFoto()),
            'departamento' => $departamento ? $this->departamento($departamento) : null,
            'tecnico' => ['id' => $tecnico->getId(), 'nombre' => $tecnico->getNombre(), 'apellidos' => $tecnico->getApellidos()],
            'cliente' => [
                'id' => $cliente->getId(),
                'nombre' => $cliente->getNombre(),
                'apellidos' => $cliente->getApellidos(),
                'email' => $cliente->getEmail(),
                'telefono' => $cliente->getTelefono(),
            ],
        ];
    }

    // Tienda -------------------------------------------------------------------------

    /** @return array<string, mixed> */
    public function tienda(Tienda $t, bool $conFotos = true): array
    {
        $json = [
            'id' => $t->getId(),
            'nombre' => $t->getNombre(),
            'direccion' => $t->getDireccion(),
            'latitud' => (float) $t->getLatitud(),
            'longitud' => (float) $t->getLongitud(),
            'historia' => $t->getHistoria(),
        ];
        if ($conFotos) {
            $json['fotos'] = array_map(fn (FotoTienda $f) => $this->fotoTienda($f), $t->getFotos()->toArray());
        }

        return $json;
    }

    /** @return array<string, mixed> */
    public function fotoTienda(FotoTienda $f): array
    {
        return [
            'id' => $f->getId(),
            'tiendaId' => $f->getTienda()?->getId(),
            'imagen' => $this->imagenes->url($f->getImagen()),
            'descripcion' => $f->getDescripcion(),
        ];
    }

    // Registro de ubicaciones ----------------------------------------------------------

    /** @return array<string, mixed> */
    public function registroUbicacion(RegistroUbicacion $r): array
    {
        $u = $r->getUsuario();

        return [
            'id' => $r->getId(),
            'fecha' => $r->getFecha()->format(DATE_ATOM),
            'latitud' => (float) $r->getLatitud(),
            'longitud' => (float) $r->getLongitud(),
            'metodo' => $r->getMetodo(),
            'ruta' => $r->getRuta(),
            'usuario' => ['id' => $u->getId(), 'email' => $u->getEmail(), 'nombre' => $u->getNombre(), 'tipo' => $u->getTipo()],
        ];
    }
}
