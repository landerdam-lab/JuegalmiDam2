import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Catalogo } from '../core/catalogo';
import {
  diasHasta,
  ESTADOS_PEDIDO,
  fechaHora,
  plural,
  precio,
  referenciaPedido,
  referenciaReparacion,
  TIPOS,
} from '../core/formato';
import { Pedidos } from '../core/pedidos';
import { Reparaciones } from '../core/reparaciones';
import { Sesion } from '../core/sesion';
import { EstadoVista } from '../shared/estado-vista';
import { Icono } from '../shared/icono';
import { Imagen } from '../shared/imagen';
import { Pastilla } from '../shared/pastilla';

/** Stock con el que un producto se considera «bajo» (DESIGN.md §3: ≤ 2 uds. → aviso). */
const STOCK_BAJO = 2;

/**
 * PW-10 Resumen del admin (RF-16): lo que necesita atención hoy. Cada contador sale del «total»
 * de un listado paginado de la API (se pide con limit=1 cuando solo hace falta el número).
 * Las peticiones se lanzan todas a la vez.
 */
@Component({
  selector: 'ja-resumen',
  imports: [RouterLink, EstadoVista, Icono, Imagen, Pastilla],
  styleUrl: './resumen.scss',
  templateUrl: './resumen.html',
})
export class Resumen {
  private readonly pedidos = inject(Pedidos);
  private readonly reparaciones = inject(Reparaciones);
  private readonly catalogo = inject(Catalogo);
  protected readonly sesion = inject(Sesion);

  protected readonly precio = precio;
  protected readonly fechaHora = fechaHora;
  protected readonly refPedido = referenciaPedido;
  protected readonly refReparacion = referenciaReparacion;
  protected readonly diasHasta = diasHasta;
  protected readonly plural = plural;
  protected readonly estadosPedido = ESTADOS_PEDIDO;
  protected readonly tipos = TIPOS;

  protected readonly pendientes = resource({
    loader: () => this.pedidos.listar({ estado: 'pendiente', limit: 5 }),
  });
  protected readonly preparados = resource({
    loader: () => this.pedidos.listar({ estado: 'preparado', limit: 1 }),
  });
  protected readonly retrasados = resource({
    loader: () => this.pedidos.alquileres({ estado: 'retrasado', limit: 5 }),
  });
  protected readonly activos = resource({
    loader: () => this.pedidos.alquileres({ estado: 'activo', limit: 1 }),
  });

  /** Abiertas = recibidas + en reparación + listas para recoger (las tres a la vez). */
  protected readonly abiertas = resource({
    loader: async () => {
      const [recibidas, enReparacion, listas] = await Promise.all([
        this.reparaciones.listar({ estado: 'recibida', limit: 5 }),
        this.reparaciones.listar({ estado: 'en_reparacion', limit: 1 }),
        this.reparaciones.listar({ estado: 'lista', limit: 1 }),
      ]);
      return {
        recibidas,
        total: recibidas.total + enReparacion.total + listas.total,
        listas: listas.total,
      };
    },
  });

  /** Productos activos con stock bajo (el catálogo de la demo cabe en una página de 100). */
  protected readonly stockBajo = resource({
    loader: async () => {
      const pagina = await this.catalogo.listarTodos({ limit: 100 });
      return pagina.items
        .filter((p) => (p.stock ?? 0) <= STOCK_BAJO)
        .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
    },
  });

  protected readonly saludo = computed(() => {
    const hora = new Date().getHours();
    const nombre = this.sesion.usuario()?.nombre ?? '';
    return `${hora < 14 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches'}, ${nombre}`;
  });

  protected recargar(): void {
    for (const r of [
      this.pendientes,
      this.preparados,
      this.retrasados,
      this.activos,
      this.abiertas,
      this.stockBajo,
    ]) {
      r.reload();
    }
  }
}
