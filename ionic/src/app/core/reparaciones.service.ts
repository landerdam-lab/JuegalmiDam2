import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from './api.service';
import type { Pagina, Referencia, Reparacion } from './modelos';

export interface NuevaReparacion {
  departamentoId: number;
  dispositivo: string;
  problema: string;
  foto?: string;
}

@Injectable({ providedIn: 'root' })
export class ReparacionesService {
  private readonly api = inject(ApiService);

  listar(pagina: number): Observable<Pagina<Reparacion>> {
    // 50, como en Android: los filtros (todas, activas, finalizadas) se aplican en la app sobre esta página
    return this.api.get<Pagina<Reparacion>>('reparaciones', { page: pagina, limit: 50 });
  }

  departamentos(): Observable<Referencia[]> {
    return this.api.get<Referencia[]>('departamentos');
  }

  crear(datos: NuevaReparacion): Observable<Reparacion> {
    return this.api.post<Reparacion>('reparaciones', datos);
  }

  cancelar(id: number): Observable<Reparacion> {
    return this.api.put<Reparacion>(`reparaciones/${id}`, { estado: 'cancelada' });
  }
}
