import type { OnInit } from '@angular/core';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonCard, IonContent, IonFooter, IonInput, IonSpinner, IonTextarea } from '@ionic/angular';
import type { Observable } from 'rxjs';
import { of, switchMap } from 'rxjs';

import type { ApiError } from '../../core/api-error';
import { AvisosService } from '../../core/avisos.service';
import { CamaraService } from '../../core/camara.service';
import { referenciaReparacion } from '../../core/formato';
import { ImagenesService } from '../../core/imagenes.service';
import type { Referencia } from '../../core/modelos';
import { ReparacionesService } from '../../core/reparaciones.service';
import { UbicacionService } from '../../core/ubicacion.service';
import { Barra } from '../../shared/barra.component';
import { Icono } from '../../shared/icono.component';
import { Vida } from '../../shared/vida.component';

/** PT-17 Solicitar reparación: departamento, dispositivo, avería, foto con la cámara y ubicación. */
@Component({
  imports: [
    FormsModule,
    IonContent,
    IonFooter,
    IonCard,
    IonInput,
    IonTextarea,
    IonButton,
    IonSpinner,
    Barra,
    Icono,
    Vida,
  ],
  styles: `
    .departamentos {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--ja-espacio-3);
    }
    .departamentos ion-card {
      cursor: pointer;
      padding: var(--ja-espacio-4);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ja-espacio-2);
      text-align: center;
    }
    ion-card.elegido {
      background: var(--ja-marca-suave);
      --background: var(--ja-marca-suave);
      color: var(--ja-marca);
      border-color: var(--ja-marca);
    }
    .foto {
      width: 100%;
      max-height: 240px;
      object-fit: cover;
      border-radius: var(--ja-radio-m);
    }
    .paso {
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-2);
    }
  `,
  template: `
    <ja-barra titulo="Nueva reparación" atras="/reparaciones" [sinAcciones]="true" />
    <ion-content>
      <div class="ja-pagina ja-columna">
        <div>
          <div class="ja-codigo ja-t2">PASO {{ paso() }} DE 5</div>
          <ja-vida [llenos]="paso()" [total]="5" />
        </div>
        <div class="paso">
          <div class="ja-titulo">1 · Departamento</div>
          <div class="departamentos">
            @for (d of departamentos(); track d.id) {
              <ion-card class="ja-tarjeta" [class.elegido]="departamento() === d.id" (click)="departamento.set(d.id)">
                <ja-icono class="ja-marca-t" [nombre]="d.nombre === 'Consolas' ? 'sports_esports' : 'phone_android'" />
                <span class="ja-titulo">{{ d.nombre }}</span>
                <span class="ja-etiqueta-s ja-t2">{{
                  d.nombre === 'Consolas' ? 'Consolas y mandos' : 'Móviles y tablets'
                }}</span>
              </ion-card>
            }
          </div>
          @if (errores()['departamentoId']) {
            <div class="ja-error-t">{{ errores()['departamentoId'] }}</div>
          }
        </div>
        <div class="paso">
          <div class="ja-titulo">2 · Dispositivo</div>
          <ion-input
            class="ja-campo"
            fill="solid"
            labelPlacement="floating"
            label="Dispositivo a reparar"
            [(ngModel)]="dispositivo"
            (ionInput)="tocado.set(tocado() + 1)"
          >
            <ja-icono slot="start" nombre="phone_android" />
          </ion-input>
          @if (errores()['dispositivo']) {
            <div class="ja-error-t">{{ errores()['dispositivo'] }}</div>
          }
        </div>
        <div class="paso">
          <div class="ja-titulo">3 · ¿Qué le pasa?</div>
          <ion-textarea
            class="ja-campo"
            fill="solid"
            labelPlacement="floating"
            label="Descripción de la avería"
            [autoGrow]="true"
            [rows]="3"
            [counter]="true"
            [maxlength]="500"
            [(ngModel)]="problema"
            (ionInput)="tocado.set(tocado() + 1)"
          />
          @if (errores()['problema']) {
            <div class="ja-error-t">{{ errores()['problema'] }}</div>
          }
        </div>
        <div class="paso">
          <div class="ja-titulo">4 · Foto del problema</div>
          @if (vistaFoto()) {
            <img class="foto" [src]="vistaFoto()" alt="Foto del problema" />
            <div class="ja-etiqueta-s ja-t2">Foto lista. Se enviará con la solicitud</div>
          } @else {
            <div class="ja-etiqueta-s ja-t2">Opcional, pero ayuda al técnico a darte un presupuesto</div>
          }
          <ion-button fill="outline" color="secondary" (click)="hacerFoto()"
            ><ja-icono slot="start" nombre="photo_camera" />Hacer foto</ion-button
          >
        </div>
        <div class="paso">
          <div class="ja-titulo">5 · Ubicación</div>
          <div class="ja-entre">
            <span class="ja-etiqueta-s ja-t2">Se guardará con la solicitud</span>
            @switch (ubicacion.estado()) {
              @case ('obtenida') {
                <span class="ja-etiqueta ja-marca-t">Obtenida</span>
              }
              @case ('buscando') {
                <span class="ja-etiqueta">Buscando…</span>
              }
              @default {
                <ion-button fill="clear" color="secondary" (click)="ubicacion.actualizar()"
                  >Activar ubicación</ion-button
                >
              }
            }
          </div>
        </div>
        <div class="ja-etiqueta-s ja-t2">
          Un técnico del departamento revisará tu solicitud y te dará un presupuesto sin compromiso.
        </div>
      </div>
    </ion-content>
    <ion-footer class="ion-no-border">
      <div class="ja-pie">
        <div class="ja-columna">
          <ion-button
            class="ja-boton-ancho ja-boton-cargando"
            color="primary"
            [disabled]="enviando()"
            (click)="enviar()"
          >
            @if (enviando()) {
              <ion-spinner />
            } @else {
              Enviar solicitud
            }
          </ion-button>
        </div>
      </div>
    </ion-footer>
  `,
})
export class NuevaReparacionPage implements OnInit {
  private readonly servicio = inject(ReparacionesService);
  private readonly imagenes = inject(ImagenesService);
  private readonly camara = inject(CamaraService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  readonly ubicacion = inject(UbicacionService);

  readonly departamentos = signal<Referencia[]>([]);
  readonly departamento = signal<number | null>(null);
  dispositivo = '';
  problema = '';
  readonly errores = signal<Record<string, string>>({});
  readonly vistaFoto = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly tocado = signal(0);
  private foto: Blob | null = null;

  readonly paso = computed(() => {
    this.tocado();
    if (!this.departamento()) return 1;
    if (!this.dispositivo.trim()) return 2;
    if (!this.problema.trim()) return 3;
    return this.vistaFoto() ? 5 : 4;
  });

  ngOnInit(): void {
    this.servicio.departamentos().subscribe({
      next: (l) => this.departamentos.set(l),
      error: (e: ApiError) => void this.avisos.mensaje(e.mensaje),
    });
    void this.ubicacion.actualizar();
  }

  async hacerFoto(): Promise<void> {
    const f = await this.camara.hacerFoto();
    if (f) {
      this.foto = f.blob;
      this.vistaFoto.set(f.vista);
    }
  }

  enviar(): void {
    const e: Record<string, string> = {};
    const departamentoId = this.departamento();
    if (!departamentoId) e['departamentoId'] = 'Elige el departamento: Telefonía o Consolas';
    if (!this.dispositivo.trim()) e['dispositivo'] = 'Escribe qué dispositivo es, por ejemplo «PlayStation 5»';
    if (!this.problema.trim()) e['problema'] = 'Cuéntanos qué le pasa';
    this.errores.set(e);
    if (!departamentoId || Object.keys(e).length) {
      return;
    }
    // La API la exige: se comprueba antes de subir la foto, para no dejarla huérfana en el servidor
    if (!this.ubicacion.punto()) {
      void this.avisos.mensaje('Activa la ubicación para continuar');
      void this.ubicacion.actualizar();
      return;
    }
    this.enviando.set(true);
    // Primero la foto y luego la solicitud con su URL (ADR-019)
    const subida: Observable<string | undefined> = this.foto
      ? this.imagenes.subir(this.foto, 'reparaciones')
      : of(undefined);
    subida
      .pipe(
        switchMap((url) =>
          this.servicio.crear({
            departamentoId,
            dispositivo: this.dispositivo.trim(),
            problema: this.problema.trim(),
            foto: url,
          }),
        ),
      )
      .subscribe({
        next: async (r) => {
          this.enviando.set(false);
          await this.avisos.informar(
            `Solicitud ${referenciaReparacion(r.id)} enviada`,
            'Tráenos el dispositivo a la tienda. Verás el estado y el presupuesto en «Mis reparaciones».',
          );
          void this.router.navigateByUrl('/reparaciones', { replaceUrl: true });
        },
        error: (err: ApiError) => {
          this.enviando.set(false);
          this.errores.set(err.campos);
          // También como aviso: algunos campos, como la ubicación, no tienen dónde mostrar su error
          void this.avisos.mensaje(Object.values(err.campos)[0] ?? err.mensaje);
        },
      });
  }
}
