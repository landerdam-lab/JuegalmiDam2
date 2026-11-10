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
import { Catalogo } from '../core/catalogo';
import type { Puesto, Trabajador } from '../core/modelos';
import { type DatosTrabajador, Personas } from '../core/personas';
import { Sesion } from '../core/sesion';
import { Dialogos } from '../shared/dialogos';
import { ErrorCampo } from '../shared/error-campo';
import { EstadoVista } from '../shared/estado-vista';
import { Hoja } from '../shared/hoja';
import { Icono } from '../shared/icono';
import { Paginador } from '../shared/paginador';
import { Pastilla } from '../shared/pastilla';
import { estaEnUso, mensajeError } from './errores';

interface ModeloTrabajador {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  puesto: Puesto;
  departamentoId: string;
  password: string;
  activo: boolean;
}

const VACIO: ModeloTrabajador = {
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  puesto: 'tecnico',
  departamentoId: '',
  password: '',
  activo: true,
};

/**
 * PW-14 Trabajadores (RF-16, RF-07): técnicos (cada uno de un departamento, con sus reparaciones
 * abiertas) y administradores (ADR-032). El departamento solo se guarda en los técnicos.
 */
@Component({
  selector: 'ja-trabajadores',
  imports: [FormField, FormRoot, ErrorCampo, EstadoVista, Hoja, Icono, Paginador, Pastilla],
  templateUrl: './trabajadores.html',
  styles: `
    .persona {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-3);
      min-width: 220px;
    }
    .iniciales {
      display: grid;
      place-items: center;
      width: var(--ja-tamano-avatar);
      height: var(--ja-tamano-avatar);
      border-radius: var(--ja-radio-completo);
      background: var(--ja-marca-suave);
      color: var(--ja-marca);
      font: var(--ja-tipo-etiqueta);
      flex: none;
    }
    .iniciales.admin {
      background: var(--ja-primario);
      color: var(--ja-sobre-primario);
    }
    .puestos {
      margin: 0;
      padding: 0;
      border: 0;
    }
  `,
})
export class Trabajadores {
  private readonly personas = inject(Personas);
  private readonly catalogo = inject(Catalogo);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);
  private readonly dialogos = inject(Dialogos);
  protected readonly sesion = inject(Sesion);

  readonly puesto = input<Puesto | '', unknown>('', {
    transform: (v) => (v === 'tecnico' || v === 'admin' ? v : ''),
  });
  readonly departamento = input(null, {
    transform: (v: unknown) => (v ? numberAttribute(v) : null),
  });
  readonly desactivados = input(false, { transform: (v: unknown) => v === '1' });
  readonly page = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });

  protected readonly departamentos = resource({ loader: () => this.catalogo.departamentos() });
  protected readonly trabajadores = resource({
    params: () => ({
      puesto: this.puesto(),
      departamento: this.departamento(),
      activo: (this.desactivados() ? 0 : 1) as 0 | 1,
      page: this.page(),
    }),
    loader: ({ params }) => this.personas.trabajadores({ ...params, limit: 20 }),
  });

  protected readonly hojaAbierta = signal(false);
  protected readonly editando = signal<Trabajador | null>(null);
  protected readonly error = signal('');
  private readonly modelo = signal<ModeloTrabajador>({ ...VACIO });

  protected readonly formulario = form(
    this.modelo,
    (c) => {
      required(c.nombre, { message: 'Escribe el nombre.' });
      required(c.apellidos, { message: 'Escribe los apellidos.' });
      required(c.email, { message: 'Escribe el email de trabajo.' });
      email(c.email, { message: 'Ese email no es válido: revisa que tenga @ y dominio.' });
      required(c.telefono, { message: 'Escribe un teléfono de contacto.' });
      // La misma regla que la API (Usuario.telefono): así el error sale antes de enviar
      pattern(c.telefono, /^\+?[0-9 ]{9,20}$/, {
        message: 'Escribe entre 9 y 20 cifras; puede empezar por + y llevar espacios.',
      });
      applyWhen(
        c,
        ({ valueOf }) => valueOf(c.puesto) === 'tecnico',
        (t) =>
          required(t.departamentoId, { message: 'Un técnico tiene que ser de un departamento.' }),
      );
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
          const datos: DatosTrabajador = {
            nombre: m.nombre.trim(),
            apellidos: m.apellidos.trim(),
            email: m.email.trim(),
            telefono: m.telefono.trim(),
            puesto: m.puesto,
            departamentoId: m.puesto === 'tecnico' ? Number(m.departamentoId) : null,
          };
          if (m.password) {
            datos.password = m.password;
          }
          if (this.editando()) {
            datos.activo = m.activo;
          }
          try {
            await this.personas.guardarTrabajador(datos, this.editando()?.id);
            this.avisos.exito(`${datos.nombre} ${datos.apellidos} guardado.`);
            this.hojaAbierta.set(false);
            this.trabajadores.reload();
            return undefined;
          } catch (e) {
            const err = ApiError.de(e);
            this.error.set(mensajeError(e));
            return Object.entries(err.campos)
              .filter(([campo]) => campo in VACIO)
              .map(([campo, message]) => ({
                kind: 'servidor',
                message,
                fieldTree: f[campo as keyof ModeloTrabajador],
              }));
          }
        },
      },
    },
  );

  protected navegar(cambios: Record<string, string | number | null>): void {
    void this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }

  protected valor(e: Event): string {
    return (e.target as HTMLSelectElement).value;
  }

  protected iniciales(t: Trabajador): string {
    return `${t.nombre[0] ?? ''}${t.apellidos[0] ?? ''}`.toUpperCase();
  }

  protected nuevo(): void {
    this.editando.set(null);
    this.modelo.set({ ...VACIO });
    this.formulario().reset();
    this.error.set('');
    this.hojaAbierta.set(true);
  }

  protected editar(t: Trabajador): void {
    this.editando.set(t);
    this.modelo.set({
      nombre: t.nombre,
      apellidos: t.apellidos,
      email: t.email,
      telefono: t.telefono ?? '',
      puesto: t.puesto ?? 'tecnico',
      departamentoId: t.departamentoId ? String(t.departamentoId) : '',
      password: '',
      activo: t.activo,
    });
    this.formulario().reset();
    this.error.set('');
    this.hojaAbierta.set(true);
  }

  protected async cambiarActivo(t: Trabajador): Promise<void> {
    if (t.id === this.sesion.usuario()?.id) {
      this.avisos.error('No puedes desactivar tu propia cuenta.');
      return;
    }
    try {
      await this.personas.guardarTrabajador(
        {
          nombre: t.nombre,
          apellidos: t.apellidos,
          email: t.email,
          telefono: t.telefono ?? '',
          puesto: t.puesto ?? 'tecnico',
          departamentoId: t.departamentoId,
          activo: !t.activo,
        },
        t.id,
      );
      this.avisos.exito(
        t.activo ? `${t.nombre} desactivado.` : `${t.nombre} vuelve a estar activo.`,
      );
      this.trabajadores.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }

  protected async borrar(t: Trabajador): Promise<void> {
    if (t.id === this.sesion.usuario()?.id) {
      this.avisos.error('No puedes borrar tu propia cuenta.');
      return;
    }
    const si = await this.dialogos.confirmar({
      titulo: `¿Borrar a ${t.nombre} ${t.apellidos}?`,
      texto: 'Si tiene reparaciones asignadas no se podrá: entonces desactívalo.',
      aceptar: 'Borrar',
      peligro: true,
    });
    if (!si) {
      return;
    }
    try {
      await this.personas.borrarTrabajador(t.id);
      this.avisos.exito('Trabajador borrado.');
      this.trabajadores.reload();
    } catch (e) {
      this.avisos.error(
        estaEnUso(e)
          ? `${t.nombre} tiene reparaciones: desactívalo en lugar de borrarlo.`
          : mensajeError(e),
      );
    }
  }
}
