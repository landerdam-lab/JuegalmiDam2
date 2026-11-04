import { Service, inject } from '@angular/core';

import { Api } from './api';
import type { EstadoReparacion, Pagina, Reparacion } from './modelos';

export interface CambiosReparacion {
  estado?: EstadoReparacion;
  presupuesto?: number | null;
  /** Solo el admin puede reasignar el técnico (del mismo departamento). */
  tecnicoId?: number;
}

/**
 * Reparaciones (PW-16). El admin ve todas; el técnico, solo las de su departamento
 * (la API ignora el filtro de departamento que mande un técnico, ADR-032).
 */
@Service()
export class Reparaciones {
  private readonly api = inject(Api);

  listar(
    filtros: {
      estado?: EstadoReparacion | '';
      departamento?: number | null;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<Pagina<Reparacion>> {
    return this.api.get<Pagina<Reparacion>>('reparaciones', filtros);
  }

  ver(id: number): Promise<Reparacion> {
    return this.api.get<Reparacion>(`reparaciones/${id}`);
  }

  actualizar(id: number, cambios: CambiosReparacion): Promise<Reparacion> {
    return this.api.put<Reparacion>(`reparaciones/${id}`, cambios);
  }

  borrar(id: number): Promise<unknown> {
    return this.api.delete(`reparaciones/${id}`);
  }
}
