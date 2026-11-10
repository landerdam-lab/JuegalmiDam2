import type { OnInit } from '@angular/core';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonCard, IonChip, IonContent, IonFab, IonRefresher, IonRefresherContent } from '@ionic/angular';

import { AgitarService } from '../../core/agitar.service';
import type { ApiError } from '../../core/api-error';
import { AvisosService } from '../../core/avisos.service';
import { fecha, fechaHora, precio, referenciaReparacion } from '../../core/formato';
import type { EstadoReparacion, Reparacion } from '../../core/modelos';
import { ReparacionesService } from '../../core/reparaciones.service';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Icono } from '../../shared/icono.component';
import { Imagen } from '../../shared/imagen.component';
import { Pastilla } from '../../shared/pastilla.component';
import { Vida } from '../../shared/vida.component';

const PASOS: Record<EstadoReparacion, number> = { recibida: 1, en_reparacion: 2, lista: 3, entregada: 4, cancelada: 0 };
const ACTIVAS: EstadoReparacion[] = ['recibida', 'en_reparacion', 'lista'];

/** PT-18 Mis reparaciones. El cliente puede cancelar mientras esté recibida o en reparación. */
@Component({
  imports: [
    RouterLink,
    IonContent,
    IonCard,
    IonChip,
    IonButton,
    IonFab,
    IonRefresher,
    IonRefresherContent,
    Barra,
    Estado,
    Icono,
    Imagen,
    Pastilla,
    Vida,
  ],
  styles: `
    .interior {
      padding: var(--ja-espacio-4);
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-2);
    }
    .lista {
      padding: 0 var(--ja-espacio-4) var(--ja-espacio-16);
    }
    .contador {
      padding: 0 0 var(--ja-espacio-3);
    }
    ion-card ion-button {
      margin: 0;
      align-self: flex-end;
    }
    .departamento {
      padding: calc(var(--ja-espacio-1) / 2) var(--ja-espacio-2);
      border-radius: var(--ja-radio-completo);
      background: var(--ja-marca-suave);
      color: var(--ja-marca);
    }
    /* La foto que hizo el cliente con la cámara, del tamaño de las miniaturas de los pedidos */
    .averia {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-3);
    }
    .averia ja-imagen {
      flex: none;
      width: calc(var(--ja-espacio-12) + var(--ja-espacio-2));
      border-radius: var(--ja-radio-s);
    }
    .averia .ja-cuerpo {
      flex: 1;
    }
    .pasos {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--ja-espacio-1);
      text-align: center;
    }
    .presupuesto {
      padding: var(--ja-espacio-2) var(--ja-espacio-3);
      border: var(--ja-borde-fino) solid var(--ja-borde-campo);
      border-radius: var(--ja-radio-completo);
      background: var(--ja-superficie-2);
    }
    .nueva {
      --border-radius: var(--ja-radio-l);
      margin: 0;
    }
  `,
  template: `
    <ja-barra titulo="Mis reparaciones" />
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content /></ion-refresher>
      <div class="ja-chips">
        @for (f of filtros; track f.valor) {
          <ion-chip [class.activo]="filtro() === f.valor" (click)="filtro.set(f.valor)">{{ f.texto }}</ion-chip>
        }
      </div>
      <div class="lista">
        @if (cargando() && !reparaciones().length) {
          <ja-estado tipo="cargando" />
        } @else if (error()) {
          <ja-estado
            tipo="error"
            titulo="No hemos podido cargar tus reparaciones"
            [texto]="error()"
            (reintentar)="cargar()"
          />
        } @else if (!visibles().length) {
          <ja-estado
            tipo="vacio"
            icono="build"
            titulo="No tienes reparaciones"
            texto="¿Pantalla rota o mando con drift? Pide una reparación con el botón amarillo."
          />
        } @else {
          <div class="contador ja-contador">
            {{ visibles().length }} {{ visibles().length === 1 ? 'reparación' : 'reparaciones' }}
          </div>
          <div class="ja-lista">
            @for (r of visibles(); track r.id) {
              <ion-card class="ja-tarjeta">
                <div class="interior">
                  <div class="ja-entre">
                    <span class="ja-etiqueta-s departamento">{{ r.departamento?.nombre }}</span>
                    <ja-pastilla [estado]="'reparacion-' + r.estado" />
                  </div>
                  <div class="ja-entre">
                    <span class="ja-titulo">{{ r.dispositivo }}</span>
                    <span class="ja-codigo ja-marca-t">{{ ref(r.id) }}</span>
                  </div>
                  <div class="averia">
                    @if (r.foto) {
                      <ja-imagen [src]="r.foto" [alt]="'Foto de ' + r.dispositivo" />
                    }
                    <div class="ja-cuerpo ja-t2">{{ r.problema }}</div>
                  </div>
                  <div class="ja-codigo ja-t2">
                    Entrada: {{ diaHora(r.fechaEntrada) }}
                    @if (r.fechaSalida) {
                      · Salida: {{ dia(r.fechaSalida) }}
                    }
                  </div>
                  <ja-vida [llenos]="pasos[r.estado]" [total]="4" />
                  <div class="pasos ja-etiqueta-s ja-t2">
                    <span>Recibida</span><span>En reparación</span><span>Lista</span><span>Entregada</span>
                  </div>
                  <div class="ja-entre presupuesto">
                    <span class="ja-etiqueta-s ja-t2">Presupuesto</span>
                    <span class="ja-precio-s">{{ r.presupuesto !== null ? formato(r.presupuesto) : 'Pendiente' }}</span>
                  </div>
                  @if (r.estado === 'recibida' || r.estado === 'en_reparacion') {
                    <ion-button fill="clear" color="danger" (click)="cancelar(r)">Cancelar solicitud</ion-button>
                  }
                </div>
              </ion-card>
            }
          </div>
        }
      </div>
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-button class="nueva" color="primary" routerLink="/reparaciones/nueva"
          ><ja-icono slot="start" nombre="build" />Nueva reparación</ion-button
        >
      </ion-fab>
    </ion-content>
  `,
})
export class ReparacionesPage implements OnInit {
  private readonly servicio = inject(ReparacionesService);
  private readonly avisos = inject(AvisosService);
  private readonly agitar = inject(AgitarService);
  private readonly destruir = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly filtros = [
    { texto: 'Todas', valor: 'todas' },
    { texto: 'Activas', valor: 'activas' },
    { texto: 'Finalizadas', valor: 'finalizadas' },
  ];
  readonly pasos = PASOS;
  readonly formato = precio;
  readonly ref = referenciaReparacion;
  readonly dia = fecha;
  readonly diaHora = fechaHora;

  readonly filtro = signal('todas');
  readonly reparaciones = signal<Reparacion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly visibles = computed(() => {
    const f = this.filtro();
    return this.reparaciones().filter((r) => f === 'todas' || (f === 'activas') === ACTIVAS.includes(r.estado));
  });

  ngOnInit(): void {
    this.agitar.agitado$.pipe(takeUntilDestroyed(this.destruir)).subscribe(() => {
      if (this.router.url.startsWith('/reparaciones')) {
        this.agitar.avisar();
        this.cargar();
      }
    });
  }

  ionViewWillEnter(): void {
    this.cargar();
  }

  cargar(fin?: () => void): void {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar(1).subscribe({
      next: (r) => {
        this.reparaciones.set(r.items);
        this.cargando.set(false);
        fin?.();
      },
      error: (e: ApiError) => {
        this.cargando.set(false);
        this.error.set(e.mensaje);
        fin?.();
      },
    });
  }

  refrescar(e: Event): void {
    this.cargar(() => void (e.target as HTMLIonRefresherElement).complete());
  }

  async cancelar(r: Reparacion): Promise<void> {
    const si = await this.avisos.confirmarDestructivo(
      `¿Cancelar la reparación ${referenciaReparacion(r.id)}?`,
      'El técnico dejará de trabajar en ella. No se puede deshacer.',
      'Cancelar solicitud',
    );
    if (si) {
      this.servicio.cancelar(r.id).subscribe({
        next: () => this.cargar(),
        error: (e: ApiError) => void this.avisos.mensaje(e.mensaje),
      });
    }
  }
}
