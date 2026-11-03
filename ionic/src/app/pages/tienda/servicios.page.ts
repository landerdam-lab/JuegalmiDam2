import type { OnInit} from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonCard, IonContent, IonFooter, IonLabel, IonSegment, IonSegmentButton } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import { precio } from '../../core/formato';
import type { Servicio } from '../../core/modelos';
import { TiendaService } from '../../core/tienda.service';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';

/** PT-25 Servicios: tres pestañas según servicio.linea (ADR-030). */
@Component({
  imports: [RouterLink, IonContent, IonFooter, IonCard, IonButton, IonSegment, IonSegmentButton, IonLabel, Barra, Estado],
  styles: `
    .interior { padding: var(--ja-espacio-4); display: flex; flex-direction: column; gap: var(--ja-espacio-1); }
    .ja-precio-s { flex: none; white-space: nowrap; }
  `,
  template: `
    <ja-barra titulo="Servicios" atras="/tienda" />
    <ion-content>
      <ion-segment [value]="linea()" (ionChange)="cambiar($any($event).detail.value)">
        <ion-segment-button value="videojuegos"><ion-label>Videojuegos</ion-label></ion-segment-button>
        <ion-segment-button value="consolas"><ion-label>Consolas</ion-label></ion-segment-button>
        <ion-segment-button value="telefonia"><ion-label>Telefonía</ion-label></ion-segment-button>
      </ion-segment>
      <div class="ja-pagina">
        @if (cargando()) {
          <ja-estado tipo="cargando" />
        } @else if (error()) {
          <ja-estado tipo="error" titulo="No hemos podido cargar la tienda" [texto]="error()" (reintentar)="cargar()" />
        } @else if (!servicios().length) {
          <ja-estado tipo="vacio" icono="build" titulo="Sin servicios en esta línea" texto="Pregunta en la tienda: te ayudamos igualmente." />
        } @else {
          <div class="ja-lista">
            @for (s of servicios(); track s.id) {
              <ion-card class="ja-tarjeta">
                <div class="interior">
                  <div class="ja-entre">
                    <span class="ja-subtitulo">{{ s.nombre }}</span>
                    <span class="ja-precio-s">{{ s.precioOrientativo != null ? 'desde ' + formato(s.precioOrientativo) : 'Consultar' }}</span>
                  </div>
                  <div class="ja-etiqueta-s ja-t2">{{ s.descripcion }}</div>
                </div>
              </ion-card>
            }
          </div>
        }
      </div>
    </ion-content>
    <ion-footer class="ion-no-border">
      <div class="ja-pie">
        <div class="ja-columna">
          <ion-button class="ja-boton-ancho" color="primary" routerLink="/reparaciones/nueva">Solicitar reparación</ion-button>
        </div>
      </div>
    </ion-footer>
  `,
})
export class ServiciosPage implements OnInit {
  private readonly servicio = inject(TiendaService);
  readonly linea = signal('videojuegos');
  readonly servicios = signal<Servicio[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly formato = precio;

  ngOnInit(): void {
    this.cargar();
  }

  cambiar(linea: string): void {
    this.linea.set(linea);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.servicios(this.linea()).subscribe({
      next: (l) => {
        this.servicios.set(l);
        this.cargando.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.mensaje);
        this.cargando.set(false);
      },
    });
  }
}
