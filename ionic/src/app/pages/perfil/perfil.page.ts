import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonFooter, IonInput, IonLabel, IonSegment, IonSegmentButton, IonSpinner, IonToggle } from '@ionic/angular';
import { switchMap } from 'rxjs';

import type { ApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { CamaraService } from '../../core/camara.service';
import { ImagenesService } from '../../core/imagenes.service';
import type { Tema } from '../../core/preferencias.service';
import { PreferenciasService } from '../../core/preferencias.service';
import { SesionService } from '../../core/sesion.service';
import { telefonoValido } from '../../core/validacion';
import { Barra } from '../../shared/barra.component';
import { Icono } from '../../shared/icono.component';

/** PT-21 Perfil: foto con la cámara, datos personales, tema, agitar y cerrar sesión. */
@Component({
  imports: [FormsModule, IonContent, IonFooter, IonInput, IonSegment, IonSegmentButton, IonLabel, IonToggle, IonButton, IonSpinner, Barra, Icono],
  styles: `
    .cabecera { display: flex; flex-direction: column; align-items: center; gap: var(--ja-espacio-2); }
    .avatar { position: relative; width: 96px; height: 96px; }
    .avatar img, .avatar .inicial { width: 96px; height: 96px; border-radius: var(--ja-radio-completo); object-fit: cover; background: var(--ja-marca-suave); color: var(--ja-marca); display: flex; align-items: center; justify-content: center; font: var(--ja-tipo-titular-l); }
    .avatar ion-button { position: absolute; right: calc(-1 * var(--ja-espacio-1)); bottom: calc(-1 * var(--ja-espacio-1)); margin: 0; --padding-start: var(--ja-espacio-2); --padding-end: var(--ja-espacio-2); --border-radius: var(--ja-radio-completo); }
    .salir { --color: var(--ja-error); }
  `,
  template: `
    <ja-barra titulo="Perfil" />
    <ion-content>
      <div class="ja-pagina ja-columna">
        @if (sesion.usuario(); as u) {
          <div class="cabecera">
            <div class="avatar">
              @if (u.foto) { <img [src]="u.foto" alt="Tu foto" /> } @else { <span class="inicial">{{ u.nombre.charAt(0).toUpperCase() }}</span> }
              <ion-button fill="solid" color="secondary" aria-label="Cambiar la foto con la cámara" (click)="cambiarFoto()"><ja-icono nombre="photo_camera" /></ion-button>
            </div>
            <div class="ja-titulo">{{ u.nombre }} {{ u.apellidos }}</div>
          </div>
          <div class="ja-caja ja-muesca">
            <div class="ja-titulo">Datos personales</div>
            <ion-input class="ja-campo" fill="solid" labelPlacement="floating" label="Nombre" [(ngModel)]="nombre" />
            @if (errores()['nombre']) { <div class="ja-error-t">{{ errores()['nombre'] }}</div> }
            <ion-input class="ja-campo" fill="solid" labelPlacement="floating" label="Apellidos" [(ngModel)]="apellidos" />
            @if (errores()['apellidos']) { <div class="ja-error-t">{{ errores()['apellidos'] }}</div> }
            <ion-input class="ja-campo" fill="solid" labelPlacement="floating" label="Teléfono" type="tel" [(ngModel)]="telefono" />
            @if (errores()['telefono']) { <div class="ja-error-t">{{ errores()['telefono'] }}</div> }
            <ion-input class="ja-campo" fill="solid" labelPlacement="floating" label="Correo electrónico" [value]="u.email" [readonly]="true" helperText="No se puede cambiar desde la app" />
            <ion-input class="ja-campo" fill="solid" labelPlacement="floating" label="DNI o NIE" [value]="u.dni" [readonly]="true" helperText="No se puede cambiar desde la app" />
          </div>
        }
        <div class="ja-caja ja-muesca">
          <div class="ja-titulo">Preferencias de la aplicación</div>
          <div class="ja-etiqueta">Tema visual</div>
          <ion-segment [value]="preferencias.tema()" (ionChange)="cambiarTema($any($event).detail.value)">
            <ion-segment-button value="sistema"><ion-label>Sistema</ion-label></ion-segment-button>
            <ion-segment-button value="claro"><ion-label>Claro</ion-label></ion-segment-button>
            <ion-segment-button value="oscuro"><ion-label>Oscuro</ion-label></ion-segment-button>
          </ion-segment>
          <ion-toggle color="secondary" labelPlacement="start" justify="space-between" [checked]="preferencias.agitar()" (ionChange)="preferencias.cambiarAgitar($any($event).detail.checked)">Agitar el móvil para refrescar las listas</ion-toggle>
        </div>
      </div>
    </ion-content>
    <ion-footer class="ion-no-border">
      <div class="ja-pie">
        <div class="ja-columna">
          <ion-button class="ja-boton-ancho ja-boton-cargando" color="primary" [disabled]="guardando()" (click)="guardar()">
            @if (guardando()) { <ion-spinner /> } @else { Guardar cambios }
          </ion-button>
          <ion-button class="ja-boton-ancho salir" fill="clear" color="danger" (click)="cerrarSesion()"><ja-icono slot="start" nombre="logout" />Cerrar sesión</ion-button>
        </div>
      </div>
    </ion-footer>
  `,
})
export class PerfilPage {
  private readonly auth = inject(AuthService);
  private readonly imagenes = inject(ImagenesService);
  private readonly camara = inject(CamaraService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);
  readonly sesion = inject(SesionService);
  readonly preferencias = inject(PreferenciasService);

  readonly nombre = signal('');
  readonly apellidos = signal('');
  readonly telefono = signal('');
  readonly errores = signal<Record<string, string>>({});
  readonly guardando = signal(false);

  ionViewWillEnter(): void {
    const u = this.sesion.usuario();
    this.nombre.set(u?.nombre ?? '');
    this.apellidos.set(u?.apellidos ?? '');
    this.telefono.set(u?.telefono ?? '');
  }

  cambiarTema(tema: Tema): void {
    this.preferencias.cambiarTema(tema);
  }

  guardar(): void {
    const e: Record<string, string> = {};
    if (!this.nombre().trim()) e['nombre'] = 'Este campo es obligatorio';
    if (!this.apellidos().trim()) e['apellidos'] = 'Este campo es obligatorio';
    if (!telefonoValido(this.telefono().trim())) e['telefono'] = 'Escribe 9 cifras, por ejemplo 612345678';
    this.errores.set(e);
    if (Object.keys(e).length) {
      return;
    }
    this.guardando.set(true);
    this.auth.actualizarPerfil({ nombre: this.nombre().trim(), apellidos: this.apellidos().trim(), telefono: this.telefono().trim() }).subscribe({
      next: () => {
        this.guardando.set(false);
        void this.avisos.mensaje('Cambios guardados');
      },
      error: (err: ApiError) => {
        this.guardando.set(false);
        if (Object.keys(err.campos).length) {
          this.errores.set(err.campos);
        } else {
          void this.avisos.mensaje(err.mensaje);
        }
      },
    });
  }

  async cambiarFoto(): Promise<void> {
    const f = await this.camara.hacerFoto();
    if (!f) {
      return;
    }
    this.imagenes
      .subir(f.blob, 'usuarios')
      .pipe(switchMap((foto) => this.auth.actualizarPerfil({ foto })))
      .subscribe({
        next: () => void this.avisos.mensaje('Foto actualizada'),
        error: (e: ApiError) => void this.avisos.mensaje(e.mensaje),
      });
  }

  async cerrarSesion(): Promise<void> {
    const si = await this.avisos.confirmarDestructivo('Cerrar sesión', 'Tendrás que volver a entrar con tu correo y contraseña. El carrito se vaciará.', 'Cerrar sesión');
    if (si) {
      this.auth.logout();
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }
}
