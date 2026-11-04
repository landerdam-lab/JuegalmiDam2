import type { AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { Component, effect, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';

export interface MarcaMapa {
  latitud: number;
  longitud: number;
  tipo: 'tienda' | 'casa' | 'cliente';
  titulo?: string;
}

/**
 * Mapa interactivo con Leaflet y OpenStreetMap, sin clave de API: la misma opción que Android
 * (OSMDroid) e Ionic (Leaflet), ADR-037. Es el componente de Ionic adaptado a la web:
 * - Con varias marcas encuadra todas (registro de ubicaciones); con una, centra en ella.
 * - Al pulsar emite «toque» con las coordenadas (elegir la posición de la tienda en PW-17).
 */
@Component({
  selector: 'ja-mapa',
  styles: `
    :host {
      display: block;
      height: var(--alto, 280px);
      border-radius: var(--ja-radio-l);
      overflow: hidden;
      border: var(--ja-borde-fino) solid var(--ja-borde);
      isolation: isolate; /* los controles de Leaflet no tapan las hojas ni los menús */
    }
    .lienzo {
      width: 100%;
      height: 100%;
    }
  `,
  template: `<div #lienzo class="lienzo" role="region" [attr.aria-label]="etiqueta()"></div>`,
})
export class Mapa implements AfterViewInit, OnDestroy {
  readonly marcas = input<MarcaMapa[]>([]);
  readonly etiqueta = input('Mapa');
  /** Zoom inicial con una sola marca. */
  readonly zoom = input(16);
  /** Si se puede mover con la rueda del ratón (en la portada no, para no atrapar el scroll). */
  readonly rueda = input(true);
  readonly toque = output<{ latitud: number; longitud: number }>();

  private readonly lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private mapa?: L.Map;
  private readonly capa = L.layerGroup();
  private tamano?: ResizeObserver;

  constructor() {
    effect(() => this.pintar(this.marcas()));
  }

  ngAfterViewInit(): void {
    this.mapa = L.map(this.lienzo().nativeElement, {
      attributionControl: true,
      scrollWheelZoom: this.rueda(),
    }).setView([43.2627, -2.9349], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.mapa);
    this.capa.addTo(this.mapa);
    this.mapa.on('click', (e: L.LeafletMouseEvent) =>
      this.toque.emit({ latitud: e.latlng.lat, longitud: e.latlng.lng }),
    );
    // Si el contenedor cambia de tamaño (hoja que se abre, ventana), Leaflet tiene que volver a medir
    this.tamano = new ResizeObserver(() => this.mapa?.invalidateSize());
    this.tamano.observe(this.lienzo().nativeElement);
    this.pintar(this.marcas());
  }

  private pintar(marcas: MarcaMapa[]): void {
    if (!this.mapa) {
      return;
    }
    this.capa.clearLayers();
    for (const m of marcas) {
      const marcador = L.marker([m.latitud, m.longitud], {
        title: m.titulo,
        alt: m.titulo,
        keyboard: true,
        icon: L.divIcon({
          className: `ja-marcador ja-marcador--${m.tipo}`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      });
      if (m.titulo) {
        marcador.bindTooltip(m.titulo, { direction: 'top', offset: [0, -28] });
      }
      marcador.addTo(this.capa);
    }
    if (marcas.length === 1) {
      this.mapa.setView([marcas[0].latitud, marcas[0].longitud], this.zoom());
    } else if (marcas.length > 1) {
      this.mapa.fitBounds(L.latLngBounds(marcas.map((m) => [m.latitud, m.longitud])), {
        padding: [32, 32],
        maxZoom: 16,
      });
    }
  }

  ngOnDestroy(): void {
    this.tamano?.disconnect();
    this.mapa?.remove();
  }
}
