import type { ElementRef } from '@angular/core';
import { Component, computed, inject, resource, signal, viewChild } from '@angular/core';

import { Catalogo } from '../core/catalogo';
import { coordenada, LINEAS, precio } from '../core/formato';
import type { FotoTienda, LineaServicio } from '../core/modelos';
import { Tiendas } from '../core/tiendas';
import { EstadoVista } from '../shared/estado-vista';
import { Icono } from '../shared/icono';
import { Imagen } from '../shared/imagen';
import { Mapa } from '../shared/mapa';

/**
 * PW-04 La tienda (pública, RF-08): la sección «La tienda» de las apps en una sola página.
 * Servicios en pestañas por línea de negocio (ADR-030), ubicación con OpenStreetMap (ADR-037),
 * galería con visor y la historia. Todo viene de /tiendas, /tiendas/{id}/fotos y /servicios.
 */
@Component({
  selector: 'ja-tienda-publica',
  imports: [EstadoVista, Icono, Imagen, Mapa],
  styleUrl: './tienda.scss',
  templateUrl: './tienda.html',
})
export class TiendaPublica {
  private readonly tiendas = inject(Tiendas);
  private readonly catalogo = inject(Catalogo);

  protected readonly lineas = LINEAS;
  protected readonly listaLineas: LineaServicio[] = ['videojuegos', 'consolas', 'telefonia'];
  protected readonly precio = precio;
  protected readonly coordenada = coordenada;

  protected readonly tienda = resource({ loader: () => this.tiendas.principal() });
  protected readonly servicios = resource({ loader: () => this.catalogo.servicios() });

  protected readonly linea = signal<LineaServicio>('videojuegos');
  protected readonly serviciosLinea = computed(() =>
    this.servicios.hasValue() ? this.servicios.value().filter((s) => s.linea === this.linea()) : [],
  );

  protected readonly fotos = computed(() =>
    this.tienda.hasValue() ? (this.tienda.value().fotos ?? []) : [],
  );

  /** Párrafos de la historia (en la BBDD van separados por una línea en blanco). */
  protected readonly historia = computed(() =>
    this.tienda.hasValue()
      ? (this.tienda.value().historia ?? '').split(/\n\s*\n/).filter(Boolean)
      : [],
  );

  protected readonly marcas = computed(() =>
    this.tienda.hasValue()
      ? [
          {
            latitud: this.tienda.value().latitud,
            longitud: this.tienda.value().longitud,
            tipo: 'tienda' as const,
            titulo: this.tienda.value().nombre,
          },
        ]
      : [],
  );

  /** «Cómo llegar» abre la ruta en OpenStreetMap (la misma fuente de mapas que las apps). */
  protected readonly comoLlegar = computed(() =>
    this.tienda.hasValue()
      ? `https://www.openstreetmap.org/directions?to=${this.tienda.value().latitud},${this.tienda.value().longitud}#map=17/${this.tienda.value().latitud}/${this.tienda.value().longitud}`
      : '#',
  );

  // ── Visor de la galería (<dialog> nativo: Escape lo cierra y el foco queda dentro) ──
  private readonly visor = viewChild.required<ElementRef<HTMLDialogElement>>('visor');
  protected readonly actual = signal(0);
  protected readonly fotoActual = computed<FotoTienda | undefined>(
    () => this.fotos()[this.actual()],
  );

  protected abrir(i: number): void {
    this.actual.set(i);
    this.visor().nativeElement.showModal();
  }

  protected mover(paso: number): void {
    const n = this.fotos().length;
    this.actual.update((i) => (i + paso + n) % n);
  }

  protected cerrar(): void {
    this.visor().nativeElement.close();
  }

  protected tecla(e: KeyboardEvent): void {
    if (e.key === 'ArrowRight') {
      this.mover(1);
    } else if (e.key === 'ArrowLeft') {
      this.mover(-1);
    }
  }
}
