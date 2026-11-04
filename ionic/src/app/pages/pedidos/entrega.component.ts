import type { OnInit} from '@angular/core';
import { Component, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonInput, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import { DireccionService } from '../../core/direccion.service';
import type { Entrega, Pedido, Tienda } from '../../core/modelos';
import { TiendaService } from '../../core/tienda.service';
import { UbicacionService } from '../../core/ubicacion.service';
import { Icono } from '../../shared/icono.component';
import type { MarcaMapa } from '../../shared/mapa.component';
import { Mapa } from '../../shared/mapa.component';

/**
 * Caja «Entrega» (ADR-038), en dos modos:
 * - elegir (PT-12): recoger en la tienda → su mapa; a domicilio → el mapa empieza en la ubicación actual del cliente,
 *   y la dirección que escribe se marca en él (ADR-040). Tocar el mapa ajusta el punto.
 * - ver (PT-14): cómo se entrega y el mapa de la tienda o de la casa.
 */
@Component({
  selector: 'ja-entrega',
  imports: [FormsModule, IonButton, IonInput, IonSegment, IonSegmentButton, IonLabel, Icono, Mapa],
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
            <ion-input class="ja-campo" fill="solid" labelPlacement="floating" label="Dirección de entrega" helperText="Calle, número, piso, código postal y ciudad" enterkeyhint="search" [(ngModel)]="direccion" (keyup.enter)="buscar()">
              <ion-button slot="end" fill="clear" color="secondary" aria-label="Buscar la dirección en el mapa" (click)="buscar()"><ja-icono nombre="search" /></ion-button>
            </ion-input>
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
  private readonly direcciones = inject(DireccionService);
  private readonly mapa = viewChild(Mapa);

  /** Si llega un pedido, modo ver. */
  readonly pedido = input<Pedido | null>(null);

  readonly tienda = signal<Tienda | null>(null);
  private readonly modoDomicilio = signal(false);
  private readonly casa = signal<{ latitud: number; longitud: number } | null>(null);
  private readonly faltaPunto = signal(false);
  /** El cliente ha elegido el punto a mano: lo que diga la búsqueda al confirmar ya no lo mueve. */
  private readonly tocado = signal(false);
  /** Última dirección marcada con la búsqueda: si cambia, hay que volver a buscarla. */
  private readonly buscada = signal('');
  private readonly etiquetaCasa = signal('');
  private readonly avisoBusqueda = signal('');
  private buscando = false;
  private falta = 'Completa los datos de la entrega';
  direccion = '';
  readonly errorDireccion = signal('');

  readonly domicilio = computed(() => this.pedido()?.entrega === 'domicilio' || (!this.pedido() && this.modoDomicilio()));

  readonly marcas = computed<MarcaMapa[]>(() => {
    const p = this.pedido();
    if (p?.entrega === 'domicilio' && p.latitudEntrega != null && p.longitudEntrega != null) {
      return [{ latitud: p.latitudEntrega, longitud: p.longitudEntrega, tipo: 'casa', titulo: 'Entrega aquí', etiqueta: p.direccionEntrega ?? undefined }];
    }
    const casa = this.casa();
    if (this.domicilio() && casa) {
      return [{ ...casa, tipo: 'casa', titulo: 'Entrega aquí', etiqueta: this.etiquetaCasa() || undefined }];
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
    if (this.avisoBusqueda()) {
      return this.avisoBusqueda();
    }
    const casa = this.casa();
    if (this.faltaPunto() || !casa) {
      return 'Toca el mapa para marcar dónde lo entregamos';
    }
    return `Toca el mapa para mover el punto · ${casa.latitud.toFixed(5)}, ${casa.longitud.toFixed(5)}`;
  });

  constructor() {
    // La ubicación actual puede llegar después de elegir «A domicilio»: si no hay nada marcado, el punto pasa a ser esa
    effect(() => {
      const gps = this.ubicacion.punto();
      if (gps && this.modoDomicilio() && !untracked(this.tocado) && !untracked(this.buscada)) {
        this.ponerCasa(gps);
      }
    });
  }

  ngOnInit(): void {
    this.tiendaServicio.tienda().subscribe({ next: (t) => this.tienda.set(t), error: () => undefined });
  }

  cambiarModo(modo: string): void {
    this.modoDomicilio.set(modo === 'domicilio');
    if (modo === 'domicilio' && !this.casa()) {
      // Primer punto: la ubicación del móvil; si no hay, la tienda (el cliente lo moverá)
      const punto = this.ubicacion.punto() ?? this.tienda();
      if (punto) {
        this.ponerCasa(punto);
      }
    } else {
      const punto = modo === 'domicilio' ? this.casa() : this.tienda();
      if (punto) {
        this.mapa()?.centrarEn(punto);
      }
    }
    if (modo === 'domicilio') {
      void this.ubicacion.actualizar();
    }
  }

  private ponerCasa(punto: { latitud: number; longitud: number }): void {
    this.casa.set({ latitud: punto.latitud, longitud: punto.longitud });
    this.mapa()?.centrarEn(punto);
  }

  /** Marca en el mapa la dirección escrita. Si no se encuentra, el marcador se queda donde estaba. */
  buscar(): void {
    const texto = this.direccion.trim();
    if (texto.length < 5) {
      this.errorDireccion.set('Escribe la dirección completa (calle, número, código postal y ciudad)');
      return;
    }
    if (this.buscando) {
      return;
    }
    this.buscando = true;
    this.errorDireccion.set('');
    this.avisoBusqueda.set('Buscando la dirección…');
    this.direcciones.buscar(texto).subscribe({
      next: (d) => {
        this.buscando = false;
        this.buscada.set(texto);
        this.tocado.set(false);
        this.etiquetaCasa.set(texto);
        this.ponerCasa(d);
        this.faltaPunto.set(false);
        this.avisoBusqueda.set(`Marcado en: ${d.direccion} · toca el mapa si no es el punto exacto`);
      },
      error: (e: ApiError) => {
        this.buscando = false;
        this.avisoBusqueda.set(e.mensaje);
      },
    });
  }

  tocar(punto: { latitud: number; longitud: number }): void {
    // El marcador de la tienda es un punto fijo: tocar solo mueve el de la casa
    if (this.domicilio() && !this.pedido()) {
      this.casa.set(punto);
      this.tocado.set(true);
      this.etiquetaCasa.set(this.direccion.trim());
      this.avisoBusqueda.set('');
      this.faltaPunto.set(false);
    }
  }

  /** Lo que se envía a la API, o null si falta algo (y se marca el error en pantalla). */
  datos(): Entrega | null {
    if (!this.domicilio()) {
      return { entrega: 'tienda' };
    }
    this.falta = 'Completa los datos de la entrega';
    const direccion = this.direccion.trim();
    this.errorDireccion.set(direccion.length < 5 ? 'Escribe la dirección completa (calle, número, código postal y ciudad)' : '');
    if (this.errorDireccion()) {
      return null;
    }
    // Sin esto, el pedido saldría con el punto del GPS aunque la dirección escrita sea otra
    if (!this.tocado() && direccion !== this.buscada()) {
      this.falta = 'Comprueba el punto en el mapa y vuelve a confirmar';
      this.buscar();
      return null;
    }
    const casa = this.casa();
    this.faltaPunto.set(!casa);
    if (!casa) {
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

  /** Qué decirle al cliente cuando datos() devuelve null. */
  mensajeFalta(): string {
    return this.falta;
  }

  aDomicilio(): boolean {
    return this.domicilio();
  }
}
