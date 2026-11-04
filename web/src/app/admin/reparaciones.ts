import {
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  resource,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';

import { Avisos } from '../core/avisos';
import { Catalogo } from '../core/catalogo';
import {
  ESTADOS_REPARACION,
  fechaHora,
  precio,
  referenciaReparacion,
  SIGUIENTE_REPARACION,
} from '../core/formato';
import type { EstadoReparacion, Reparacion } from '../core/modelos';
import { Personas } from '../core/personas';
import { Reparaciones } from '../core/reparaciones';
import { Sesion } from '../core/sesion';
import { Dialogos } from '../shared/dialogos';
import { EstadoVista } from '../shared/estado-vista';
import { Hoja } from '../shared/hoja';
import { Icono } from '../shared/icono';
import { Imagen } from '../shared/imagen';
import { Paginador } from '../shared/paginador';
import { Pastilla } from '../shared/pastilla';
import { Vida } from '../shared/vida';
import { mensajeError } from './errores';

const ESTADOS: EstadoReparacion[] = [
  'recibida',
  'en_reparacion',
  'lista',
  'entregada',
  'cancelada',
];

/** Color de la barra de vida según el estado (los mismos roles que las pastillas, DESIGN.md §3). */
const COLOR: Record<EstadoReparacion, string> = {
  recibida: 'var(--ja-neutro-estado)',
  en_reparacion: 'var(--ja-aviso)',
  lista: 'var(--ja-info)',
  entregada: 'var(--ja-exito)',
  cancelada: 'var(--ja-error)',
};

const ACCION: Record<EstadoReparacion, string> = {
  recibida: '',
  en_reparacion: 'Empezar la reparación',
  lista: 'Marcar como lista',
  entregada: 'Marcar como entregada',
  cancelada: 'Cancelar reparación',
};

/**
 * PW-16 Reparaciones (RF-07). El admin ve todas y puede reasignar el técnico;
 * el técnico solo ve las de su departamento y cambia estado y presupuesto (ADR-032).
 * La API aplica las mismas reglas: recibida → en reparación → lista → entregada, o cancelada.
 */
@Component({
  selector: 'ja-reparaciones-admin',
  imports: [EstadoVista, Hoja, Icono, Imagen, Paginador, Pastilla, Vida],
  styleUrl: './reparaciones.scss',
  templateUrl: './reparaciones.html',
})
export class ReparacionesAdmin {
  private readonly reparaciones = inject(Reparaciones);
  private readonly catalogo = inject(Catalogo);
  private readonly personas = inject(Personas);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);
  private readonly dialogos = inject(Dialogos);
  protected readonly sesion = inject(Sesion);

  readonly estado = input<EstadoReparacion | '', unknown>('', {
    transform: (v) => (ESTADOS.includes(v as EstadoReparacion) ? (v as EstadoReparacion) : ''),
  });
  readonly departamento = input(null, {
    transform: (v: unknown) => (v ? numberAttribute(v) : null),
  });
  readonly page = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });
  readonly reparacion = input(null, { transform: (v: unknown) => (v ? numberAttribute(v) : null) });

  protected readonly estados = ESTADOS_REPARACION;
  protected readonly listaEstados = ESTADOS;
  protected readonly siguientes = SIGUIENTE_REPARACION;
  protected readonly color = COLOR;
  protected readonly accion = ACCION;
  protected readonly precio = precio;
  protected readonly fechaHora = fechaHora;
  protected readonly ref = referenciaReparacion;

  protected readonly departamentos = resource({ loader: () => this.catalogo.departamentos() });
  protected readonly lista = resource({
    params: () => ({ estado: this.estado(), departamento: this.departamento(), page: this.page() }),
    loader: ({ params }) => this.reparaciones.listar({ ...params, limit: 12 }),
  });

  // ── Ficha ──
  protected readonly seleccionada = signal<Reparacion | null>(null);
  protected readonly presupuesto = signal('');
  protected readonly guardando = signal(false);

  /** Técnicos del departamento de la reparación abierta (solo el admin puede reasignar). */
  protected readonly tecnicos = resource({
    params: () => {
      const r = this.seleccionada();
      return this.sesion.esAdmin() && r?.departamento
        ? { departamento: r.departamento.id }
        : undefined;
    },
    loader: ({ params }) =>
      this.personas.trabajadores({
        puesto: 'tecnico',
        departamento: params.departamento,
        limit: 100,
      }),
  });

  protected readonly abierta = computed(() => {
    const r = this.seleccionada();
    return !!r && r.estado !== 'entregada' && r.estado !== 'cancelada';
  });

  constructor() {
    effect(() => {
      const id = this.reparacion();
      untracked(() => (id ? void this.abrir(id) : this.seleccionada.set(null)));
    });
  }

  protected navegar(cambios: Record<string, string | number | null>): void {
    void this.router.navigate([], { queryParams: cambios, queryParamsHandling: 'merge' });
  }

  protected valor(e: Event): string {
    return (e.target as HTMLInputElement | HTMLSelectElement).value;
  }

  private async abrir(id: number): Promise<void> {
    try {
      this.mostrar(await this.reparaciones.ver(id));
    } catch (e) {
      this.avisos.error(mensajeError(e));
      this.navegar({ reparacion: null });
    }
  }

  private mostrar(r: Reparacion): void {
    this.seleccionada.set(r);
    this.presupuesto.set(r.presupuesto !== null ? String(r.presupuesto) : '');
  }

  protected async cambiarEstado(r: Reparacion, estado: EstadoReparacion): Promise<void> {
    if (estado === 'cancelada') {
      const si = await this.dialogos.confirmar({
        titulo: `¿Cancelar la reparación ${this.ref(r.id)}?`,
        texto: 'El cliente la verá como cancelada en la app. No se puede deshacer.',
        aceptar: 'Cancelar reparación',
        peligro: true,
      });
      if (!si) {
        return;
      }
    }
    await this.guardar(
      r,
      { estado },
      `${this.ref(r.id)}: ${this.estados[estado].texto.toLowerCase()}.`,
    );
  }

  protected async guardarPresupuesto(r: Reparacion): Promise<void> {
    const texto = this.presupuesto().trim().replace(',', '.');
    const valor = texto === '' ? null : Number(texto);
    if (valor !== null && (Number.isNaN(valor) || valor < 0)) {
      this.avisos.error(
        'Escribe el presupuesto como un número (por ejemplo, 49,90) o déjalo vacío.',
      );
      return;
    }
    await this.guardar(r, { presupuesto: valor }, 'Presupuesto guardado.');
  }

  protected async reasignar(r: Reparacion, evento: Event): Promise<void> {
    const tecnicoId = Number(this.valor(evento));
    if (tecnicoId && tecnicoId !== r.tecnico.id) {
      await this.guardar(r, { tecnicoId }, 'Técnico reasignado.');
    }
  }

  private async guardar(
    r: Reparacion,
    cambios: Parameters<Reparaciones['actualizar']>[1],
    mensaje: string,
  ): Promise<void> {
    this.guardando.set(true);
    try {
      this.mostrar(await this.reparaciones.actualizar(r.id, cambios));
      this.avisos.exito(mensaje);
      this.lista.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async borrar(r: Reparacion): Promise<void> {
    const si = await this.dialogos.confirmar({
      titulo: `¿Borrar la reparación ${this.ref(r.id)}?`,
      texto: 'Desaparece también de la app del cliente. Para anularla, mejor cancélala.',
      aceptar: 'Borrar',
      peligro: true,
    });
    if (!si) {
      return;
    }
    try {
      await this.reparaciones.borrar(r.id);
      this.avisos.exito('Reparación borrada.');
      this.navegar({ reparacion: null });
      this.lista.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }
}
