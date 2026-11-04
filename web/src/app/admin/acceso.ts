import { Component, inject, input, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import { ApiError } from '../core/api-error';
import { Auth } from '../core/auth';
import { Icono } from '../shared/icono';
import { Logo } from '../shared/logo';

/**
 * PW-05 Acceso al backoffice (admin y técnicos, ADR-032). Formulario con Signal Forms:
 * el modelo es un signal, las reglas (required, email) se declaran en un esquema
 * y los errores se muestran debajo de cada campo cuando se ha tocado (rúbrica Interfaces).
 */
@Component({
  selector: 'ja-acceso',
  imports: [FormField, FormRoot, RouterLink, Icono, Logo],
  styleUrl: './acceso.scss',
  templateUrl: './acceso.html',
})
export class Acceso {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  /** ?caducada=1 cuando el interceptor recibe un 401; ?volver=/admin/… para volver donde estaba. */
  readonly caducada = input(false, { transform: (v: unknown) => v === '1' || v === 1 });
  readonly volver = input('');

  protected readonly verPassword = signal(false);
  protected readonly error = signal('');

  private readonly modelo = signal({ email: '', password: '' });

  protected readonly formulario = form(
    this.modelo,
    (campo) => {
      required(campo.email, { message: 'Escribe tu email de trabajo.' });
      email(campo.email, { message: 'Ese email no es válido: revisa que tenga @ y dominio.' });
      required(campo.password, { message: 'Escribe tu contraseña.' });
    },
    {
      submission: {
        action: async (f) => {
          this.error.set('');
          try {
            const usuario = await this.auth.login(f().value().email.trim(), f().value().password);
            const destino =
              usuario.puesto === 'admin' ? this.volver() || '/admin' : '/admin/reparaciones';
            await this.router.navigateByUrl(destino, { replaceUrl: true });
            return undefined;
          } catch (e) {
            const err = ApiError.de(e);
            this.error.set(err.mensaje);
            return { kind: 'servidor', message: err.mensaje };
          }
        },
      },
    },
  );
}
