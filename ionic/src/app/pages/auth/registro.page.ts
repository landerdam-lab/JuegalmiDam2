import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonFooter, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import type { DatosRegistro } from '../../core/auth.service';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { dniValido, emailValido, PASSWORD_MINIMA, telefonoValido } from '../../core/validacion';
import { Barra } from '../../shared/barra.component';
import { Icono } from '../../shared/icono.component';
import { Vida } from '../../shared/vida.component';

/** PT-03 Registro: siempre crea un cliente. Valida antes de enviar y muestra en su campo los errores 422 de la API. */
@Component({
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonFooter,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonSpinner,
    Barra,
    Icono,
    Vida,
  ],
  template: `
    <ja-barra titulo="Crea tu cuenta" atras="/login" [sinAcciones]="true" />
    <ion-content>
      <div class="ja-pagina ja-columna">
        <p class="ja-cuerpo ja-t2 ja-sin-margen">Solo te lo pedimos una vez</p>
        @for (c of campos; track c.clave) {
          <div>
            @if (c.clave === 'password') {
              <ion-input
                class="ja-campo"
                fill="solid"
                labelPlacement="floating"
                [label]="c.etiqueta"
                type="password"
                autocomplete="new-password"
                [name]="c.clave"
                [(ngModel)]="datos.password"
                (ionInput)="longitud.set(datos.password.length)"
              >
                <ja-icono slot="start" nombre="lock" />
                <ion-input-password-toggle slot="end" color="medium" />
              </ion-input>
              <ja-vida [llenos]="fuerza()" [total]="4" [color]="colorFuerza()" />
            } @else {
              <ion-input
                class="ja-campo"
                fill="solid"
                labelPlacement="floating"
                [label]="c.etiqueta"
                [type]="c.tipo"
                [name]="c.clave"
                [(ngModel)]="datos[c.clave]"
              >
                <ja-icono slot="start" [nombre]="iconos[c.clave]" />
              </ion-input>
            }
            @if (errores()[c.clave]) {
              <div class="ja-error-t">{{ errores()[c.clave] }}</div>
            }
          </div>
        }
        <div class="ja-fila" style="justify-content:center">
          <span class="ja-cuerpo ja-t2">¿Ya tienes cuenta?</span>
          <ion-button fill="clear" color="secondary" routerLink="/login">Inicia sesión</ion-button>
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
            (click)="crear()"
          >
            @if (enviando()) {
              <ion-spinner />
            } @else {
              Crear cuenta
            }
          </ion-button>
        </div>
      </div>
    </ion-footer>
  `,
})
export class RegistroPage {
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);

  readonly iconos: Record<keyof DatosRegistro, string> = {
    nombre: 'person',
    apellidos: 'person',
    email: 'mail',
    password: 'lock',
    telefono: 'call',
    dni: 'badge',
  };
  readonly campos: { clave: keyof DatosRegistro; etiqueta: string; tipo: 'text' | 'email' | 'tel' | 'password' }[] = [
    { clave: 'nombre', etiqueta: 'Nombre', tipo: 'text' },
    { clave: 'apellidos', etiqueta: 'Apellidos', tipo: 'text' },
    { clave: 'email', etiqueta: 'Correo electrónico', tipo: 'email' },
    { clave: 'password', etiqueta: 'Contraseña', tipo: 'password' },
    { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'tel' },
    { clave: 'dni', etiqueta: 'DNI o NIE', tipo: 'text' },
  ];
  datos: DatosRegistro = { nombre: '', apellidos: '', email: '', password: '', telefono: '', dni: '' };
  readonly errores = signal<Record<string, string>>({});
  readonly enviando = signal(false);

  // Barra de vida de la contraseña: 4 segmentos a partir de la longitud mínima
  readonly longitud = signal(0);
  readonly fuerza = computed(() => Math.min(4, Math.floor(this.longitud() / (PASSWORD_MINIMA / 2))));
  readonly colorFuerza = computed(() =>
    this.fuerza() < 2 ? 'var(--ja-error)' : this.fuerza() < 4 ? 'var(--ja-aviso)' : 'var(--ja-exito)',
  );

  crear(): void {
    const d = this.datos;
    const e: Record<string, string> = {};
    const obligatorio = 'Este campo es obligatorio';
    if (!d.nombre.trim()) e['nombre'] = obligatorio;
    if (!d.apellidos.trim()) e['apellidos'] = obligatorio;
    if (!emailValido(d.email.trim())) e['email'] = 'Escribe un correo válido, por ejemplo laura@correo.es';
    if (d.password.length < PASSWORD_MINIMA) e['password'] = 'La contraseña debe tener al menos 8 caracteres';
    if (!telefonoValido(d.telefono.trim())) e['telefono'] = 'Escribe 9 cifras, por ejemplo 612345678';
    if (!dniValido(d.dni.trim())) e['dni'] = 'Escribe tu DNI (12345678Z) o NIE (X1234567L)';
    this.errores.set(e);
    if (Object.keys(e).length) {
      return;
    }
    this.enviando.set(true);
    const email = d.email.trim();
    this.auth
      .registro({
        ...d,
        nombre: d.nombre.trim(),
        apellidos: d.apellidos.trim(),
        email,
        telefono: d.telefono.trim(),
        dni: d.dni.trim(),
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          void this.router.navigate(['/login'], { queryParams: { creada: email }, replaceUrl: true });
        },
        error: (err: ApiError) => {
          this.enviando.set(false);
          if (Object.keys(err.campos).length) {
            this.errores.set(err.campos);
          } else if (err.codigo === 'DNI_REPETIDO') {
            this.errores.set({ dni: err.mensaje });
          } else if (err.status === 409) {
            this.errores.set({ email: err.mensaje });
          } else {
            void this.avisos.mensaje(err.mensaje);
          }
        },
      });
  }
}
