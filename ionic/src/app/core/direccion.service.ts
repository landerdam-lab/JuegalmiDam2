import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from './api.service';
import type { DireccionEncontrada } from './modelos';

/** Busca en el mapa la dirección de entrega. La búsqueda real la hace la API (ADR-040). */
@Injectable({ providedIn: 'root' })
export class DireccionService {
  private readonly api = inject(ApiService);

  buscar(texto: string): Observable<DireccionEncontrada> {
    return this.api.get<DireccionEncontrada>('direcciones', { texto });
  }
}
