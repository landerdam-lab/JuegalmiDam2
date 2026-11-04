import type { AfterViewInit, ElementRef, OnDestroy} from '@angular/core';
import { Component, effect, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';

export interface MarcaMapa {
  latitud: number;
  longitud: number;
  tipo: 'tienda' | 'casa' | 'cliente';
  titulo?: string;
  /** Texto fijo encima del marcador: la dirección que escribió el cliente. */
  etiqueta?: string;
}

/**
 * Mapa interactivo con Leaflet y OpenStreetMap, sin clave (ADR-037). Se puede mover y hacer zoom.
 * Tocarlo solo emite «toque» si la página lo escucha (elegir el punto de entrega, ADR-038).
 */
@Component({
  selector: 'ja-mapa',
  styles: `
    :host { display: block; height: var(--alto, 220px); border-radius: var(--ja-radio-m); overflow: hidden; }
    .lienzo { width: 100%; height: 100%; }
  `,
  template: `<div #lienzo class="lienzo"></div>`,
})
export class Mapa implements AfterViewInit, OnDestroy {
  readonly marcas = input<MarcaMapa[]>([]);
  readonly toque = output<{ latitud: number; longitud: number }>();

  private readonly lienzo = viewChild.required<ElementRef<HTMLElement>>('lienzo');
  private mapa?: L.Map;
  private capa = L.layerGroup();
  private tamano?: ResizeObserver;
  private centrado = false;

  constructor() {
    effect(() => this.pintar(this.marcas()));
  }

  ngAfterViewInit(): void {
    this.mapa = L.map(this.lienzo().nativeElement, { attributionControl: true }).setView([43.2627, -2.9349], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.mapa);
    this.capa.addTo(this.mapa);
    this.mapa.on('click', (e: L.LeafletMouseEvent) => this.toque.emit({ latitud: e.latlng.lat, longitud: e.latlng.lng }));
    // Ionic anima la entrada de la página: al cambiar de tamaño, Leaflet tiene que volver a medir
    this.tamano = new ResizeObserver(() => this.mapa?.invalidateSize());
    this.tamano.observe(this.lienzo().nativeElement);
    setTimeout(() => this.mapa?.invalidateSize(), 400);
    this.pintar(this.marcas());
  }

  /** Centra el mapa en la primera marca (botón «centrar»). */
  centrar(): void {
    const m = this.marcas()[0];
    if (m) {
      this.mapa?.setView([m.latitud, m.longitud], 16);
    }
  }

  /** Centra el mapa en un punto, por ejemplo la dirección que se acaba de encontrar. */
  centrarEn(punto: { latitud: number; longitud: number }): void {
    this.mapa?.setView([punto.latitud, punto.longitud], 16);
  }

  private pintar(marcas: MarcaMapa[]): void {
    if (!this.mapa) {
      return;
    }
    this.capa.clearLayers();
    for (const m of marcas) {
      const marcador = L.marker([m.latitud, m.longitud], {
        title: m.titulo,
        icon: L.divIcon({
          className: `ja-marcador ja-marcador--${m.tipo}`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(this.capa);
      if (m.etiqueta) {
        // Con textContent: la dirección la escribe el cliente y Leaflet trataría una cadena como HTML
        const texto = document.createElement('span');
        texto.textContent = m.etiqueta;
        marcador.bindTooltip(texto, { permanent: true, direction: 'top', offset: [0, -28], className: 'ja-marcador-texto' });
      }
    }
    if (marcas.length && !this.centrado) {
      this.centrado = true;
      this.mapa.setView([marcas[0].latitud, marcas[0].longitud], 16);
    }
  }

  ngOnDestroy(): void {
    this.tamano?.disconnect();
    this.mapa?.remove();
  }
}
