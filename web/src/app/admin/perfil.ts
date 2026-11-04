import { Component, effect, inject, signal } from '@angular/core';
import {
  applyWhen,
  form,
  FormField,
  FormRoot,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';

import { ApiError } from '../core/api-error';
import { Auth } from '../core/auth';
import { Avisos } from '../core/avisos';
import { Sesion } from '../core/sesion';
import { ErrorCampo } from '../shared/error-campo';
import { Icono } from '../shared/icono';
import { mensajeError } from './errores';

interface ModeloPerfil {
  nombre: string;
  apellidos: string;
  telefono: string;
  password: string;
  repetir: string;
}

/**
 * Mi perfil (admin y técnicos): ver y editar los datos propios con PUT /me (Roles y permisos: 👤).
 * El email, el puesto y el departamento los cambia un administrador desde Trabajadores.
 */
@Component({
  selector: 'ja-perfil',
  imports: [FormField, FormRoot, ErrorCampo, Icono],
  styles: `
    .ja-panel {
      max-width: 640px;
      padding: var(--ja-espacio-6);
    }
    .fijo {
      display: grid;
      gap: var(--ja-espacio-1);
      padding: var(--ja-espacio-4);
      border-radius: var(--ja-radio-m);
      background: var(--ja-superficie-2);
    }
    .fijo dt {
      font: var(--ja-tipo-etiqueta-s);
      color: var(--ja-texto-3);
    }
    .fijo dd {
      font: var(--ja-tipo-subtitulo);
      margin-bottom: var(--ja-espacio-2);
    }
    .guardar {
      justify-self: end;
    }
  `,
  template: `
    <header class="ja-admin-cabecera">
      <div>
        <h1>Mi perfil</h1>
        <p>Tus datos de contacto y tu contraseña.</p>
      </div>
    </header>

    <form class="ja-panel ja-form" [formRoot]="formulario">
      @if (error()) {
        <p class="ja-aviso-linea" role="alert"><ja-icono nombre="error" />{{ error() }}</p>
      }
      <dl class="fijo">
        <dt>Email</dt>
        <dd>{{ sesion.usuario()?.email }}</dd>
        <dt>Puesto</dt>
        <dd>
          {{
            sesion.esAdmin()
              ? 'Administración'
              : 'Técnico de ' + (sesion.usuario()?.departamento?.nombre ?? '')
          }}
        </dd>
      </dl>
      <div class="ja-form-fila">
        <div class="ja-campo">
          <label for="pf-nombre">Nombre</label>
          <input id="pf-nombre" [formField]="formulario.nombre" />
          <ja-error-campo [campo]="formulario.nombre" />
        </div>
        <div class="ja-campo">
          <label for="pf-apellidos">Apellidos</label>
          <input id="pf-apellidos" [formField]="formulario.apellidos" />
          <ja-error-campo [campo]="formulario.apellidos" />
        </div>
      </div>
      <div class="ja-campo">
        <label for="pf-telefono">Teléfono</label>
        <input id="pf-telefono" type="tel" [formField]="formulario.telefono" />
      </div>
      <p class="ja-form-seccion">Cambiar la contraseña</p>
      <div class="ja-form-fila">
        <div class="ja-campo">
          <label for="pf-password">Nueva contraseña</label>
          <input
            id="pf-password"
            type="password"
            autocomplete="new-password"
            [formField]="formulario.password"
          />
          <ja-error-campo [campo]="formulario.password" />
        </div>
        <div class="ja-campo">
          <label for="pf-repetir">Repítela</label>
          <input
            id="pf-repetir"
            type="password"
            autocomplete="new-password"
            [formField]="formulario.repetir"
          />
          <ja-error-campo [campo]="formulario.repetir" />
        </div>
      </div>
      <span class="ja-ayuda">Déjalas vacías para no cambiar la contraseña.</span>
      <button type="submit" class="ja-boton guardar" [disabled]="formulario().submitting()">
        <ja-icono nombre="check" />Guardar cambios
      </button>
    </form>
  `,
})
export class Perfil {
  private readonly auth = inject(Auth);
  private readonly avisos = inject(Avisos);
  protected readonly sesion = inject(Sesion);
  protected readonly error = signal('');

  private readonly modelo = signal<ModeloPerfil>({
    nombre: '',
    apellidos: '',
    telefono: '',
    password: '',
    repetir: '',
  });

  protected readonly formulario = form(
    this.modelo,
    (c) => {
      required(c.nombre, { message: 'Escribe tu nombre.' });
      required(c.apellidos, { message: 'Escribe tus apellidos.' });
      applyWhen(
        c,
        ({ valueOf }) => valueOf(c.password) !== '',
        (p) =>
          minLength(p.password, 8, {
            message: 'La contraseña tiene que tener al menos 8 caracteres.',
          }),
      );
      // Validación entre dos campos: las dos contraseñas tienen que coincidir
      validate(c.repetir, ({ value, valueOf }) =>
        value() !== valueOf(c.password)
          ? { kind: 'distinta', message: 'Las dos contraseñas no coinciden.' }
          : null,
      );
    },
    {
      submission: {
        action: async (f) => {
          this.error.set('');
          const m = f().value();
          try {
            await this.auth.actualizarPerfil({
              nombre: m.nombre.trim(),
              apellidos: m.apellidos.trim(),
              telefono: m.telefono.trim(),
              ...(m.password ? { password: m.password } : {}),
            });
            this.modelo.update((v) => ({ ...v, password: '', repetir: '' }));
            this.formulario().reset();
            this.avisos.exito('Perfil guardado.');
            return undefined;
          } catch (e) {
            this.error.set(mensajeError(e));
            return { kind: 'servidor', message: ApiError.de(e).mensaje };
          }
        },
      },
    },
  );

  constructor() {
    effect(() => {
      const u = this.sesion.usuario();
      if (u) {
        this.modelo.update((m) => ({
          ...m,
          nombre: u.nombre,
          apellidos: u.apellidos,
          telefono: u.telefono ?? '',
        }));
      }
    });
  }
}
