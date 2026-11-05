import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { IonButton, IonContent, IonModal } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import type { FotoTienda } from '../../core/modelos';
import { TiendaService } from '../../core/tienda.service';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Icono } from '../../shared/icono.component';
import { Imagen } from '../../shared/imagen.component';

/** PT-27 Galería: rejilla de 3 columnas y visor a pantalla completa. */
@Component({
  imports: [IonContent, IonModal, IonButton, Barra, Estado, Icono, Imagen],
  styles: `
    .conteo {
      padding: 0 var(--ja-espacio-4) var(--ja-espacio-3);
    }
    .rejilla {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--ja-espacio-2);
      padding: var(--ja-espacio-4);
    }
    @media (min-width: 840px) {
      .rejilla {
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }
    }
    .baldosa {
      cursor: pointer;
      clip-path: polygon(0 0, calc(100% - var(--ja-espacio-2)) 0, 100% var(--ja-espacio-2), 100% 100%, 0 100%);
    }
    .visor {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--ja-velo);
    }
    .visor ja-imagen {
      flex: 1;
      --ajuste: contain;
      --proporcion: auto;
      background: transparent;
    }
    .visor p {
      padding: var(--ja-espacio-4);
      margin: 0;
      color: var(--ja-sobre-marca);
      text-align: center;
    }
    .visor ion-button {
      position: absolute;
      top: var(--ja-espacio-2);
      right: var(--ja-espacio-2);
      z-index: 1;
      --color: var(--ja-sobre-marca);
    }
  `,
  template: `
    <ja-barra titulo="Galería" atras="/tienda" [sinAcciones]="true" />
    <ion-content>
      @if (cargando()) {
        <div class="ja-pagina"><ja-estado tipo="cargando" /></div>
      } @else if (error()) {
        <ja-estado tipo="error" titulo="No hemos podido cargar la tienda" [texto]="error()" (reintentar)="cargar()" />
      } @else {
        <div class="ja-contador conteo">{{ fotos().length }} {{ fotos().length === 1 ? 'foto' : 'fotos' }}</div>
        <div class="rejilla">
          @for (f of fotos(); track f.id) {
            <ja-imagen class="baldosa" [src]="f.imagen" [alt]="f.descripcion ?? ''" (click)="abierta.set(f)" />
          }
        </div>
      }
      <ion-modal [isOpen]="!!abierta()" (didDismiss)="abierta.set(null)">
        <ng-template>
          @if (abierta(); as f) {
            <div class="visor">
              <ion-button fill="clear" aria-label="Cerrar" (click)="abierta.set(null)"
                ><ja-icono nombre="close"
              /></ion-button>
              <ja-imagen [src]="f.imagen" [alt]="f.descripcion ?? ''" />
              @if (f.descripcion) {
                <p class="ja-cuerpo">{{ f.descripcion }}</p>
              }
            </div>
          }
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
})
export class GaleriaPage implements OnInit {
  private readonly servicio = inject(TiendaService);
  readonly fotos = signal<FotoTienda[]>([]);
  readonly abierta = signal<FotoTienda | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.fotos().subscribe({
      next: (f) => {
        this.fotos.set(f);
        this.cargando.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.mensaje);
        this.cargando.set(false);
      },
    });
  }
}
