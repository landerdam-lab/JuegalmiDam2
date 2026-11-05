import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonCard, IonContent, IonInput, IonInputPasswordToggle, IonSpinner } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { AvisosService } from '../../core/avisos.service';
import { emailValido } from '../../core/validacion';
import { Icono } from '../../shared/icono.component';
import { Logo } from '../../shared/logo.component';

/** PT-02 Login: email + contraseña → POST /login → Inicio. */
@Component({
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonCard,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonSpinner,
    Icono,
    Logo,
  ],
  styles: `
    .caja {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-8);
      padding: var(--ja-espacio-12) var(--ja-espacio-4) var(--ja-espacio-6);
      max-width: 480px;
      margin-inline: auto;
    }
    .arriba {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ja-espacio-2);
      text-align: center;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-3);
      padding: var(--ja-espacio-6);
    }
    ion-card {
      margin: 0;
    }
    .ir {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--ja-espacio-1);
      border-top: var(--ja-borde-fino) solid var(--ja-borde);
      padding-top: var(--ja-espacio-2);
    }
    .aviso {
      margin-top: auto;
      display: flex;
      gap: var(--ja-espacio-2);
      justify-content: center;
      align-items: center;
      --tam: var(--ja-tamano-icono-s);
    }
  `,
  template: `
    <ion-content>
      <div class="caja">
        <div class="arriba">
          <ja-logo class="grande" />
          <div class="ja-cuerpo ja-t2">Juega, alquila y repara en tu tienda de barrio</div>
        </div>
        <ion-card class="ja-tarjeta">
          <form (ngSubmit)="entrar()">
            <h1 class="ja-titular-m ja-sin-margen">Inicia sesión</h1>
            <div>
              <ion-input
                class="ja-campo"
                fill="solid"
                labelPlacement="floating"
                label="Correo electrónico"
                type="email"
                autocomplete="email"
                name="email"
                [(ngModel)]="email"
              >
                <ja-icono slot="start" nombre="mail" />
              </ion-input>
              @if (errorEmail()) {
                <div class="ja-error-t">{{ errorEmail() }}</div>
              }
            </div>
            <div>
              <ion-input
                class="ja-campo"
                fill="solid"
                labelPlacement="floating"
                label="Contraseña"
                type="password"
                autocomplete="current-password"
                name="password"
                [(ngModel)]="password"
              >
                <ja-icono slot="start" nombre="lock" />
                <ion-input-password-toggle slot="end" color="medium" />
              </ion-input>
              @if (errorPassword()) {
                <div class="ja-error-t">{{ errorPassword() }}</div>
              }
            </div>
            <ion-button class="ja-boton-ancho ja-boton-cargando" type="submit" color="primary" [disabled]="enviando()">
              @if (enviando()) {
                <ion-spinner />
              } @else {
                Entrar <ja-icono slot="end" nombre="arrow_forward" />
              }
            </ion-button>
            <div class="ir">
              <span class="ja-cuerpo ja-t2">¿No tienes cuenta?</span>
              <ion-button fill="clear" color="secondary" routerLink="/registro">Regístrate</ion-button>
            </div>
          </form>
        </ion-card>
        <div class="aviso ja-etiqueta-s ja-t2">
          <ja-icono nombre="location_on" />
          <span>Usamos tu ubicación al hacer pedidos, alquileres y reparaciones</span>
        </div>
      </div>
    </ion-content>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);

  /** ?caducada=1 lo pone el interceptor ante un 401; ?email= lo pone el registro. */
  readonly caducada = input<string>();
  readonly creada = input<string>();

  readonly email = signal('');
  password = '';
  readonly errorEmail = signal('');
  readonly errorPassword = signal('');
  readonly enviando = signal(false);

  ionViewWillEnter(): void {
    if (this.caducada()) {
      void this.avisos.mensaje('Tu sesión ha caducado. Vuelve a iniciar sesión.');
    }
    if (this.creada()) {
      this.email.set(this.creada()!);
      void this.avisos.mensaje('Cuenta creada. Ya puedes iniciar sesión.');
    }
  }

  entrar(): void {
    const email = this.email().trim();
    // Validación local: error debajo del campo y cómo corregirlo (rúbrica Interfaces)
    this.errorEmail.set(emailValido(email) ? '' : 'Escribe un correo válido, por ejemplo laura@correo.es');
    this.errorPassword.set(this.password ? '' : 'Escribe tu contraseña');
    if (this.errorEmail() || this.errorPassword()) {
      return;
    }
    this.enviando.set(true);
    this.auth.login(email, this.password).subscribe({
      next: () => {
        this.enviando.set(false);
        this.password = '';
        void this.router.navigateByUrl('/inicio', { replaceUrl: true });
      },
      error: (e: ApiError) => {
        this.enviando.set(false);
        if (e.status === 401) {
          // CREDENCIALES_INCORRECTAS o CUENTA_DESACTIVADA: el mensaje de la API ya lo explica
          this.errorPassword.set(e.mensaje);
        } else {
          void this.avisos.mensaje(e.mensaje);
        }
      },
    });
  }
}
