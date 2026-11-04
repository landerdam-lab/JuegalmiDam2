import {
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  resource,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';

import { Avisos } from '../core/avisos';
import {
  diasHasta,
  ESTADOS_ALQUILER,
  ESTADOS_PEDIDO,
  fecha,
  fechaHora,
  metodoPago,
  precio,
  referenciaPedido,
  SIGUIENTE_PEDIDO,
} from '../core/formato';
import type { Alquiler, EstadoAlquiler, EstadoPedido, Pedido } from '../core/modelos';
import { Pedidos } from '../core/pedidos';
import { Dialogos } from '../shared/dialogos';
import { EstadoVista } from '../shared/estado-vista';
import { Hoja } from '../shared/hoja';
import { Icono } from '../shared/icono';
import { Imagen } from '../shared/imagen';
import { Mapa } from '../shared/mapa';
import { Paginador } from '../shared/paginador';
import { Pastilla } from '../shared/pastilla';
import { Vida } from '../shared/vida';
import { mensajeError } from './errores';

const ESTADOS_P: EstadoPedido[] = ['pendiente', 'preparado', 'entregado', 'cancelado'];
const ESTADOS_A: EstadoAlquiler[] = ['activo', 'retrasado', 'devuelto', 'cancelado'];

/** Texto del botón que lleva a cada estado. */
const ACCION: Record<EstadoPedido, string> = {
  pendiente: '',
  preparado: 'Marcar como preparado',
  entregado: 'Marcar como entregado',
  cancelado: 'Cancelar pedido',
};

/**
 * PW-15 Pedidos y alquileres (RF-02, RF-04, RF-16). Dos vistas en pestañas:
 * - Pedidos: filtro por estado, ficha con sus líneas y la entrega (ADR-038) y botones con los
 *   estados siguientes permitidos (pendiente → preparado → entregado, o cancelado).
 * - Alquileres: filtro por estado y «Registrar devolución» (solo el admin, P-16).
 */
@Component({
  selector: 'ja-pedidos-admin',
  imports: [EstadoVista, Hoja, Icono, Imagen, Mapa, Paginador, Pastilla, Vida],
  styleUrl: './pedidos.scss',
  templateUrl: './pedidos.html',
})
export class PedidosAdmin {
  private readonly pedidos = inject(Pedidos);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);
  private readonly dialogos = inject(Dialogos);

  readonly vista = input<'pedidos' | 'alquileres', unknown>('pedidos', {
    transform: (v) => (v === 'alquileres' ? 'alquileres' : 'pedidos'),
  });
  readonly estado = input('', { transform: (v: unknown) => (typeof v === 'string' ? v : '') });
  readonly page = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });
  /** ?pedido=ID abre la ficha de ese pedido. */
  readonly pedido = input(null, { transform: (v: unknown) => (v ? numberAttribute(v) : null) });

  protected readonly estadosPedido = ESTADOS_PEDIDO;
  protected readonly estadosAlquiler = ESTADOS_ALQUILER;
  protected readonly listaEstadosP = ESTADOS_P;
  protected readonly listaEstadosA = ESTADOS_A;
  protected readonly siguientes = SIGUIENTE_PEDIDO;
  protected readonly accion = ACCION;
  protected readonly precio = precio;
  protected readonly fecha = fecha;
  protected readonly fechaHora = fechaHora;
  protected readonly metodoPago = metodoPago;
  protected readonly ref = referenciaPedido;
  protected readonly diasHasta = diasHasta;

  protected readonly listaPedidos = resource({
    params: () =>
      this.vista() === 'pedidos'
        ? {
            estado: (ESTADOS_P.includes(this.estado() as EstadoPedido) ? this.estado() : '') as
              EstadoPedido | '',
            page: this.page(),
          }
        : undefined,
    loader: ({ params }) => this.pedidos.listar({ ...params, limit: 20 }),
  });

  protected readonly listaAlquileres = resource({
    params: () =>
      this.vista() === 'alquileres'
        ? {
            estado: (ESTADOS_A.includes(this.estado() as EstadoAlquiler) ? this.estado() : '') as
              EstadoAlquiler | '',
            page: this.page(),
          }
        : undefined,
    loader: ({ params }) => this.pedidos.alquileres({ ...params, limit: 20 }),
  });

  // ── Ficha del pedido ──
  protected readonly seleccionado = signal<Pedido | null>(null);
  protected readonly cambiando = signal(false);

  protected readonly marcaEntrega = computed(() => {
    const p = this.seleccionado();
    return p?.latitudEntrega != null && p.longitudEntrega != null
      ? [
          {
            latitud: p.latitudEntrega,
            longitud: p.longitudEntrega,
            tipo: 'casa' as const,
            titulo: p.direccionEntrega ?? 'Entrega',
          },
        ]
      : [];
  });

  constructor() {
    effect(() => {
      const id = this.pedido();
      untracked(() => (id ? void this.abrir(id) : this.seleccionado.set(null)));
    });
  }

  protected navegar(cambios: Record<string, string | number | null>): void {
    void this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }

  protected cambiarVista(vista: 'pedidos' | 'alquileres'): void {
    void this.router.navigate([], { queryParams: { vista: vista === 'pedidos' ? null : vista } });
  }

  protected verPedido(id: number): void {
    this.navegar({ pedido: id });
  }

  protected cerrarFicha(): void {
    this.navegar({ pedido: null });
  }

  private async abrir(id: number): Promise<void> {
    try {
      this.seleccionado.set(await this.pedidos.ver(id));
    } catch (e) {
      this.avisos.error(mensajeError(e));
      this.cerrarFicha();
    }
  }

  protected lineas(p: Pedido): number {
    return p.compras.reduce((n, c) => n + c.cantidad, 0) + p.alquileres.length;
  }

  protected async cambiarEstado(p: Pedido, estado: EstadoPedido): Promise<void> {
    if (estado === 'cancelado') {
      const si = await this.dialogos.confirmar({
        titulo: `¿Cancelar el pedido ${this.ref(p.id)}?`,
        texto:
          'Se devuelve el stock de lo comprado y se liberan las copias alquiladas. No se puede deshacer.',
        aceptar: 'Cancelar pedido',
        peligro: true,
      });
      if (!si) {
        return;
      }
    }
    this.cambiando.set(true);
    try {
      const actualizado = await this.pedidos.cambiarEstado(p.id, estado);
      this.seleccionado.set(actualizado);
      this.avisos.exito(
        `Pedido ${this.ref(p.id)}: ${this.estadosPedido[estado].texto.toLowerCase()}.`,
      );
      this.listaPedidos.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    } finally {
      this.cambiando.set(false);
    }
  }

  protected async borrar(p: Pedido): Promise<void> {
    const si = await this.dialogos.confirmar({
      titulo: `¿Borrar el pedido ${this.ref(p.id)}?`,
      texto:
        'Se borran también sus compras y alquileres. Para anular un pedido normal, mejor cancélalo.',
      aceptar: 'Borrar pedido',
      peligro: true,
    });
    if (!si) {
      return;
    }
    try {
      await this.pedidos.borrar(p.id);
      this.avisos.exito(`Pedido ${this.ref(p.id)} borrado.`);
      this.cerrarFicha();
      this.listaPedidos.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }

  // ── Alquileres ──

  protected async devolver(a: Alquiler): Promise<void> {
    try {
      await this.pedidos.registrarDevolucion(a.id);
      this.avisos.exito(`Devolución de «${a.videojuego.nombre}» registrada con fecha de hoy.`);
      this.listaAlquileres.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }

  protected async deshacer(a: Alquiler): Promise<void> {
    try {
      await this.pedidos.deshacerDevolucion(a.id);
      this.avisos.info(`Devolución de «${a.videojuego.nombre}» anulada.`);
      this.listaAlquileres.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }

  /** «Faltan 3 días», «Vence hoy» o «4 días tarde». */
  protected plazo(a: Alquiler): string {
    const d = diasHasta(a.fechaFin);
    return d > 1
      ? `Faltan ${d} días`
      : d === 1
        ? 'Vence mañana'
        : d === 0
          ? 'Vence hoy'
          : `${-d} ${d === -1 ? 'día' : 'días'} tarde`;
  }
}
