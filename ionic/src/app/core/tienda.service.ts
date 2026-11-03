import { Injectable, inject } from '@angular/core';
import type { Observable} from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs';

import { ApiService } from './api.service';
import type { FotoTienda, Servicio, Tienda } from './modelos';

@Injectable({ providedIn: 'root' })
export class TiendaService {
  private readonly api = inject(ApiService);

  /** Solo hay una tienda y casi nunca cambia: se pide una vez y se reutiliza (carga rápida, CPU mínima). */
  private readonly tiendaCompartida = this.api.get<Tienda[]>('tiendas').pipe(
    map((lista) => lista[0]),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  tienda(): Observable<Tienda> {
    return this.tiendaCompartida;
  }

  fotos(): Observable<FotoTienda[]> {
    return this.tiendaCompartida.pipe(switchMap((t) => this.api.get<FotoTienda[]>(`tiendas/${t.id}/fotos`)));
  }

  servicios(linea: string): Observable<Servicio[]> {
    return this.api.get<Servicio[]>('servicios', { linea });
  }
}
