import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import type { Tienda } from '../../core/modelos';
import { TiendaService } from '../../core/tienda.service';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Icono } from '../../shared/icono.component';
import { Imagen } from '../../shared/imagen.component';

/** PT-28 Historia: foto de cabecera, tarjeta superpuesta con muesca y la cita con barra amarilla. */
@Component({
  imports: [RouterLink, IonContent, IonButton, Barra, Estado, Icono, Imagen],
  styles: `
    .botones {
      display: flex;
      gap: var(--ja-espacio-2);
    }
    .botones ion-button {
      flex: 1;
      margin: 0;
    }
    .portada {
      --proporcion: 16 / 9;
    }
    .tarjeta {
      max-width: 640px;
      margin: calc(-1 * var(--ja-espacio-8)) var(--ja-espacio-4) var(--ja-espacio-4);
      position: relative;
    }
    .cita {
      border-inline-start: var(--ja-espacio-1) solid var(--ja-primario);
      padding-inline-start: var(--ja-espacio-3);
    }
    p {
      white-space: pre-line;
      margin: 0;
    }
  `,
  template: `
    <ja-barra titulo="Historia" atras="/tienda" [sinAcciones]="true" />
    <ion-content>
      @if (tienda(); as t) {
        <ja-imagen class="portada" [src]="portada()" [alt]="t.nombre" />
        <div class="tarjeta ja-caja ja-muesca--destacada">
          <div class="ja-codigo ja-marca-t">NUESTRA HISTORIA</div>
          <h1 class="ja-titular-m ja-sin-margen">{{ t.nombre }}</h1>
          <div class="cita ja-cuerpo-l">«Aquí se juega, se alquila y se arregla.»</div>
          <p class="ja-cuerpo ja-sin-margen">{{ t.historia }}</p>
          <div class="ja-fila ja-etiqueta-s ja-t2"><ja-icono nombre="location_on" />{{ t.direccion }}</div>
          <div class="botones">
            <ion-button fill="outline" color="secondary" routerLink="/tienda/galeria">Ver galería</ion-button>
            <ion-button fill="outline" color="secondary" routerLink="/tienda/ubicacion">Cómo llegar</ion-button>
          </div>
        </div>
      } @else if (error()) {
        <ja-estado tipo="error" titulo="No hemos podido cargar la tienda" [texto]="error()" (reintentar)="cargar()" />
      } @else {
        <div class="ja-pagina"><ja-estado tipo="cargando" /></div>
      }
    </ion-content>
  `,
})
export class HistoriaPage implements OnInit {
  private readonly servicio = inject(TiendaService);
  readonly tienda = signal<Tienda | null>(null);
  readonly portada = signal<string | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.error.set('');
    this.servicio
      .tienda()
      .subscribe({ next: (t) => this.tienda.set(t), error: (e: ApiError) => this.error.set(e.mensaje) });
    this.servicio.fotos().subscribe({ next: (f) => this.portada.set(f[0]?.imagen ?? null), error: () => undefined });
  }
}
