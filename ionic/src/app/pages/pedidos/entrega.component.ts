import type { OnInit} from '@angular/core';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonInput, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import type { Entrega, Pedido, Tienda } from '../../core/modelos';
import { TiendaService } from '../../core/tienda.service';
import { UbicacionService } from '../../core/ubicacion.service';
import type { MarcaMapa } from '../../shared/mapa.component';
import { Mapa } from '../../shared/mapa.component';

/**
 * Caja «Entrega» (ADR-038), en dos modos:
 * - elegir (PT-12): recoger en la tienda → su mapa; a domicilio → dirección + tocar el mapa para marcar la casa.
 * - ver (PT-14): cómo se entrega y el mapa de la tienda o de la casa.
 */
@Component({
  selector: 'ja-entrega',
  imports: [FormsModule, IonInput, IonSegment, IonSegmentButton, IonLabel, Mapa],
  template: `
    <div class="ja-caja ja-muesca">
      <div class="ja-titulo">{{ pedido() ? 'Entrega' : '¿Cómo lo quieres?' }}</div>
      @if (!pedido()) {
        <ion-segment [value]="domicilio() ? 'domicilio' : 'tienda'" (ionChange)="cambiarModo($any($event).detail.value)">
          <ion-segment-button value="tienda"><ion-label>En tienda</ion-label></ion-segment-button>
          <ion-segment-button value="domicilio"><ion-label>A domicilio</ion-label></ion-segment-button>
        </ion-segment>
      }
      @if (domicilio()) {
        @if (pedido(); as p) {
          <div class="ja-cuerpo">Envío a domicilio: {{ p.direccionEntrega }}</div>
        } @else {
          <div>
            <ion-input class="ja-campo" fill="solid" labelPlacement="floating" label="Dirección de entrega" helperText="Calle, número, piso, código postal y ciudad" [(ngModel)]="direccion" />
            @if (errorDireccion()) { <div class="ja-error-t">{{ errorDireccion() }}</div> }
          </div>
        }
      } @else if (tienda(); as t) {
        <div class="ja-cuerpo">Recógelo en {{ t.nombre }}: {{ t.direccion }}</div>
      }
      <ja-mapa [marcas]="marcas()" (toque)="tocar($event)" />
      <div class="ja-etiqueta-s ja-t2">{{ textoPunto() }}</div>
    </div>
  `,
})
export class EntregaCaja implements OnInit {
  private readonly tiendaServicio = inject(TiendaService);
  private readonly ubicacion = inject(UbicacionService);

  /** Si llega un pedido, modo ver. */
  readonly pedido = input<Pedido | null>(null);

  readonly tienda = signal<Tienda | null>(null);
  private readonly modoDomicilio = signal(false);
  private readonly casa = signal<{ latitud: number; longitud: number } | null>(null);
  private readonly faltaPunto = signal(false);
  direccion = '';
  readonly errorDireccion = signal('');

  readonly domicilio = computed(() => this.pedido()?.entrega === 'domicilio' || (!this.pedido() && this.modoDomicilio()));

  readonly marcas = computed<MarcaMapa[]>(() => {
    const p = this.pedido();
    if (p?.entrega === 'domicilio' && p.latitudEntrega != null && p.longitudEntrega != null) {
      return [{ latitud: p.latitudEntrega, longitud: p.longitudEntrega, tipo: 'casa', titulo: 'Entrega aquí' }];
    }
    const casa = this.casa();
    if (this.domicilio() && casa) {
      return [{ ...casa, tipo: 'casa', titulo: 'Entrega aquí' }];
    }
    const t = this.tienda();
    return t ? [{ latitud: t.latitud, longitud: t.longitud, tipo: 'tienda', titulo: t.nombre }] : [];
  });

  readonly textoPunto = computed(() => {
    if (this.pedido()) {
      return this.domicilio() ? 'Envío gratis a esta dirección' : 'Recogida gratis en la tienda';
    }
    if (!this.domicilio()) {
      return 'Recogida gratis en la tienda · mueve el mapa o haz zoom para ver cómo llegar';
    }
    const casa = this.casa();
    if (this.faltaPunto() || !casa) {
      return 'Toca el mapa para marcar dónde lo entregamos';
    }
    return `Toca el mapa para mover el punto · ${casa.latitud.toFixed(5)}, ${casa.longitud.toFixed(5)}`;
  });

  ngOnInit(): void {
    this.tiendaServicio.tienda().subscribe({ next: (t) => this.tienda.set(t), error: () => undefined });
  }

  cambiarModo(modo: string): void {
    this.modoDomicilio.set(modo === 'domicilio');
    if (modo === 'domicilio' && !this.casa()) {
      // Primer punto: la ubicación del móvil; si no hay, la tienda (el cliente lo moverá)
      const punto = this.ubicacion.punto() ?? this.tienda();
      if (punto) {
        this.casa.set({ latitud: punto.latitud, longitud: punto.longitud });
      }
    }
  }

  tocar(punto: { latitud: number; longitud: number }): void {
    // El marcador de la tienda es un punto fijo: tocar solo mueve el de la casa
    if (this.domicilio() && !this.pedido()) {
      this.casa.set(punto);
      this.faltaPunto.set(false);
    }
  }

  /** Lo que se envía a la API, o null si falta algo (y se marca el error en pantalla). */
  datos(): Entrega | null {
    if (!this.domicilio()) {
      return { entrega: 'tienda' };
    }
    const direccion = this.direccion.trim();
    this.errorDireccion.set(direccion.length < 5 ? 'Escribe la dirección completa (calle, número, código postal y ciudad)' : '');
    const casa = this.casa();
    this.faltaPunto.set(!casa);
    if (this.errorDireccion() || !casa) {
      return null;
    }
    return { entrega: 'domicilio', direccionEntrega: direccion, latitudEntrega: casa.latitud, longitudEntrega: casa.longitud };
  }

  /** Errores 422 de la API sobre la entrega, en su sitio. */
  errores(e: ApiError): void {
    if (e.campos['direccionEntrega']) {
      this.errorDireccion.set(e.campos['direccionEntrega']);
    }
  }

  aDomicilio(): boolean {
    return this.domicilio();
  }
}
