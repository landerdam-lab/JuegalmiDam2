import { Component, computed, input } from '@angular/core';

/** Pastilla de estado: color + texto, nunca solo color (.ja-estado--* en cartucho.scss). */
const TEXTOS: Record<string, string> = {
  'pedido-pendiente': 'Pendiente',
  'pedido-preparado': 'Preparado',
  'pedido-entregado': 'Entregado',
  'pedido-cancelado': 'Cancelado',
  'reparacion-recibida': 'Recibida',
  'reparacion-en_reparacion': 'En reparación',
  'reparacion-lista': 'Lista',
  'reparacion-entregada': 'Entregada',
  'reparacion-cancelada': 'Cancelada',
  'alquiler-activo': 'Activo',
  'alquiler-retrasado': 'Retrasado',
  'alquiler-devuelto': 'Devuelto',
  'alquiler-cancelado': 'Anulado',
};

@Component({
  selector: 'ja-pastilla',
  template: `<span class="ja-estado" [class]="clase()">{{ texto() || textoFijo() }}</span>`,
})
export class Pastilla {
  /** Por ejemplo «pedido-pendiente». */
  readonly estado = input.required<string>();
  readonly texto = input('');
  readonly clase = computed(
    () => `ja-estado--${this.estado() === 'alquiler-cancelado' ? 'pedido-cancelado' : this.estado()}`,
  );
  readonly textoFijo = computed(() => TEXTOS[this.estado()] ?? '');
}

export function estadoStock(stock: number): { estado: string; texto: string } {
  if (stock <= 0) {
    return { estado: 'stock-agotado', texto: 'Agotado' };
  }
  return stock <= 2
    ? { estado: 'stock-pocas-unidades', texto: `Últimas ${stock} uds.` }
    : { estado: 'stock-disponible', texto: 'En stock' };
}
