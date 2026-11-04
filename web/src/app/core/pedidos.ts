import { Service, inject } from '@angular/core';

import { Api } from './api';
import type { Alquiler, EstadoAlquiler, EstadoPedido, Pagina, Pedido } from './modelos';

/**
 * Pedidos y alquileres del backoffice (PW-15). El admin ve todos; los crea el cliente desde las apps.
 * Las reglas (qué estado sigue a cuál, devolver el stock al cancelar) las aplica la API.
 */
@Service()
export class Pedidos {
  private readonly api = inject(Api);

  listar(
    filtros: { estado?: EstadoPedido | ''; page?: number; limit?: number } = {},
  ): Promise<Pagina<Pedido>> {
    return this.api.get<Pagina<Pedido>>('pedidos', filtros);
  }

  ver(id: number): Promise<Pedido> {
    return this.api.get<Pedido>(`pedidos/${id}`);
  }

  /** pendiente → preparado → entregado, o pendiente → cancelado (ADR-015). */
  cambiarEstado(id: number, estado: EstadoPedido): Promise<Pedido> {
    return this.api.put<Pedido>(`pedidos/${id}`, { estado });
  }

  /** Borra también sus compras y alquileres (CASCADE en la BBDD). */
  borrar(id: number): Promise<unknown> {
    return this.api.delete(`pedidos/${id}`);
  }

  alquileres(
    filtros: { estado?: EstadoAlquiler | ''; page?: number; limit?: number } = {},
  ): Promise<Pagina<Alquiler>> {
    return this.api.get<Pagina<Alquiler>>('alquileres', filtros);
  }

  /** Sin fecha, la API registra la devolución con la fecha de hoy. */
  registrarDevolucion(id: number): Promise<Alquiler> {
    return this.api.put<Alquiler>(`alquileres/${id}`, {});
  }

  /** fechaDevolucion = null deshace una devolución registrada por error. */
  deshacerDevolucion(id: number): Promise<Alquiler> {
    return this.api.put<Alquiler>(`alquileres/${id}`, { fechaDevolucion: null });
  }
}
