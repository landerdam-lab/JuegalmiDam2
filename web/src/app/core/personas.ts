import { Service, inject } from '@angular/core';

import { Api } from './api';
import type { Pagina, Puesto, Trabajador, Usuario } from './modelos';

export interface DatosCliente {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni: string;
  password?: string;
  activo?: boolean;
}

export interface DatosTrabajador {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  puesto: Puesto;
  /** Solo y siempre en los técnicos (si no, 422). */
  departamentoId: number | null;
  password?: string;
  activo?: boolean;
}

/**
 * Clientes (PW-13, /usuarios) y trabajadores (PW-14, /trabajadores). Solo admin.
 * Las bajas son lógicas (activo = false, ADR-025): un DELETE con pedidos o reparaciones da 409.
 */
@Service()
export class Personas {
  private readonly api = inject(Api);

  clientes(
    filtros: { q?: string; activo?: 0 | 1; page?: number; limit?: number } = {},
  ): Promise<Pagina<Usuario>> {
    return this.api.get<Pagina<Usuario>>('usuarios', { ...filtros, tipo: 'cliente' });
  }

  guardarCliente(datos: DatosCliente, id?: number): Promise<Usuario> {
    return id
      ? this.api.put<Usuario>(`usuarios/${id}`, datos)
      : this.api.post<Usuario>('usuarios', datos);
  }

  borrarCliente(id: number): Promise<unknown> {
    return this.api.delete(`usuarios/${id}`);
  }

  trabajadores(
    filtros: {
      puesto?: Puesto | '';
      departamento?: number | null;
      activo?: 0 | 1;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<Pagina<Trabajador>> {
    return this.api.get<Pagina<Trabajador>>('trabajadores', filtros);
  }

  guardarTrabajador(datos: DatosTrabajador, id?: number): Promise<Trabajador> {
    return id
      ? this.api.put<Trabajador>(`trabajadores/${id}`, datos)
      : this.api.post<Trabajador>('trabajadores', datos);
  }

  borrarTrabajador(id: number): Promise<unknown> {
    return this.api.delete(`trabajadores/${id}`);
  }
}
