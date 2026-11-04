import { Component, inject, input, numberAttribute, resource, signal } from '@angular/core';
import {
  applyWhen,
  email,
  form,
  FormField,
  FormRoot,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { Router } from '@angular/router';

import { ApiError } from '../core/api-error';
import { Avisos } from '../core/avisos';
import type { Usuario } from '../core/modelos';
import { type DatosCliente, Personas } from '../core/personas';
import { Dialogos } from '../shared/dialogos';
import { ErrorCampo } from '../shared/error-campo';
import { EstadoVista } from '../shared/estado-vista';
import { Hoja } from '../shared/hoja';
import { Icono } from '../shared/icono';
import { Imagen } from '../shared/imagen';
import { Paginador } from '../shared/paginador';
import { Pastilla } from '../shared/pastilla';
import { estaEnUso, mensajeError } from './errores';

const POR_PAGINA = 20;

interface ModeloCliente {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni: string;
  password: string;
  activo: boolean;
}

const VACIO: ModeloCliente = {
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  dni: '',
  password: '',
  activo: true,
};

/**
 * PW-13 Clientes (RF-16): buscar, dar de alta, editar y desactivar (baja lógica, ADR-025).
 * Un cliente con pedidos o reparaciones no se puede borrar (409): se desactiva y ya no puede entrar en las apps.
 */
@Component({
  selector: 'ja-clientes',
  imports: [FormField, FormRoot, ErrorCampo, EstadoVista, Hoja, Icono, Imagen, Paginador, Pastilla],
  templateUrl: './clientes.html',
  styles: `
    .persona {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-3);
      min-width: 220px;
    }
    .avatar {
      width: var(--ja-tamano-avatar);
      height: var(--ja-tamano-avatar);
      border-radius: var(--ja-radio-completo);
      overflow: hidden;
      --proporcion: 1;
      --tam-placeholder: var(--ja-tamano-icono-s);
    }
  `,
})
export class Clientes {
  private readonly personas = inject(Personas);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);
  private readonly dialogos = inject(Dialogos);

  readonly q = input('', { transform: (v: unknown) => (typeof v === 'string' ? v : '') });
  readonly desactivados = input(false, { transform: (v: unknown) => v === '1' });
  readonly page = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });

  protected readonly clientes = resource({
    params: () => ({
      q: this.q(),
      activo: (this.desactivados() ? 0 : 1) as 0 | 1,
      page: this.page(),
    }),
    loader: ({ params }) => this.personas.clientes({ ...params, limit: POR_PAGINA }),
  });

  protected readonly hojaAbierta = signal(false);
  protected readonly editando = signal<Usuario | null>(null);
  protected readonly error = signal('');
  private readonly modelo = signal<ModeloCliente>({ ...VACIO });

  protected readonly formulario = form(
    this.modelo,
    (c) => {
      required(c.nombre, { message: 'Escribe el nombre.' });
      required(c.apellidos, { message: 'Escribe los apellidos.' });
      required(c.email, { message: 'Escribe el email.' });
      email(c.email, { message: 'Ese email no es válido: revisa que tenga @ y dominio.' });
      required(c.telefono, { message: 'Escribe un teléfono de contacto.' });
      required(c.dni, { message: 'Escribe el DNI o NIE.' });
      pattern(c.dni, /^[0-9XYZxyz][0-9]{7}[A-Za-z]$/, {
        message: 'El DNI son 8 números y una letra (12345678Z).',
      });
      // La contraseña es obligatoria al dar de alta; al editar, solo si se quiere cambiar
      applyWhen(
        c,
        () => !this.editando(),
        (n) => required(n.password, { message: 'Pon una contraseña inicial.' }),
      );
      applyWhen(
        c,
        ({ valueOf }) => valueOf(c.password) !== '',
        (n) =>
          minLength(n.password, 8, {
            message: 'La contraseña tiene que tener al menos 8 caracteres.',
          }),
      );
    },
    {
      submission: {
        action: async (f) => {
          this.error.set('');
          const m = f().value();
          const datos: DatosCliente = {
            nombre: m.nombre.trim(),
            apellidos: m.apellidos.trim(),
            email: m.email.trim(),
            telefono: m.telefono.trim(),
            dni: m.dni.trim().toUpperCase(),
          };
          if (m.password) {
            datos.password = m.password;
          }
          if (this.editando()) {
            datos.activo = m.activo;
          }
          try {
            await this.personas.guardarCliente(datos, this.editando()?.id);
            this.avisos.exito(`${datos.nombre} ${datos.apellidos} guardado.`);
            this.hojaAbierta.set(false);
            this.clientes.reload();
            return undefined;
          } catch (e) {
            const err = ApiError.de(e);
            this.error.set(mensajeError(e));
            // 409 EMAIL o DNI repetido, o 422 de un campo: el error va debajo de ese campo
            const errores = Object.entries(err.campos)
              .filter(([campo]) => campo in VACIO)
              .map(([campo, message]) => ({
                kind: 'servidor',
                message,
                fieldTree: f[campo as keyof ModeloCliente],
              }));
            if (err.codigo === 'DNI_REPETIDO') {
              errores.push({ kind: 'servidor', message: err.mensaje, fieldTree: f.dni });
            }
            return errores;
          }
        },
      },
    },
  );

  private temporizador?: ReturnType<typeof setTimeout>;

  protected navegar(cambios: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      queryParams: cambios,
      queryParamsHandling: 'merge',
      replaceUrl: 'q' in cambios,
    });
  }

  protected buscar(e: Event): void {
    const texto = (e.target as HTMLInputElement).value.trim();
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.navegar({ q: texto || null, page: null }), 300);
  }

  protected nuevo(): void {
    this.editando.set(null);
    this.modelo.set({ ...VACIO });
    this.formulario().reset();
    this.error.set('');
    this.hojaAbierta.set(true);
  }

  protected editar(u: Usuario): void {
    this.editando.set(u);
    this.modelo.set({
      nombre: u.nombre,
      apellidos: u.apellidos,
      email: u.email,
      telefono: u.telefono ?? '',
      dni: u.dni ?? '',
      password: '',
      activo: u.activo,
    });
    this.formulario().reset();
    this.error.set('');
    this.hojaAbierta.set(true);
  }

  protected async cambiarActivo(u: Usuario): Promise<void> {
    if (u.activo) {
      const si = await this.dialogos.confirmar({
        titulo: `¿Desactivar a ${u.nombre} ${u.apellidos}?`,
        texto:
          'No podrá entrar en las apps. Sus pedidos y reparaciones se conservan, y puedes volver a activarlo cuando quieras.',
        aceptar: 'Desactivar',
        peligro: true,
      });
      if (!si) {
        return;
      }
    }
    try {
      await this.personas.guardarCliente({ ...this.datosDe(u), activo: !u.activo }, u.id);
      this.avisos.exito(
        u.activo ? `${u.nombre} desactivado.` : `${u.nombre} vuelve a estar activo.`,
      );
      this.clientes.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }

  protected async borrar(u: Usuario): Promise<void> {
    const si = await this.dialogos.confirmar({
      titulo: `¿Borrar a ${u.nombre} ${u.apellidos}?`,
      texto:
        'Se borra la cuenta para siempre. Si tiene pedidos o reparaciones no se podrá: entonces desactívala.',
      aceptar: 'Borrar',
      peligro: true,
    });
    if (!si) {
      return;
    }
    try {
      await this.personas.borrarCliente(u.id);
      this.avisos.exito('Cliente borrado.');
      this.clientes.reload();
    } catch (e) {
      this.avisos.error(
        estaEnUso(e)
          ? `${u.nombre} tiene pedidos o reparaciones: desactívalo en lugar de borrarlo.`
          : mensajeError(e),
      );
    }
  }

  private datosDe(u: Usuario): DatosCliente {
    return {
      nombre: u.nombre,
      apellidos: u.apellidos,
      email: u.email,
      telefono: u.telefono ?? '',
      dni: u.dni ?? '',
    };
  }
}
