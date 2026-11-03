import { Injectable, inject } from '@angular/core';
import type { Observable} from 'rxjs';
import { map } from 'rxjs';

import { ApiService } from './api.service';

/** POST /imagenes: primero se sube la foto y luego se manda su URL (ADR-019). */
@Injectable({ providedIn: 'root' })
export class ImagenesService {
  private readonly api = inject(ApiService);

  subir(foto: Blob, carpeta: 'usuarios' | 'reparaciones'): Observable<string> {
    const datos = new FormData();
    datos.append('imagen', foto, 'foto.jpg');
    datos.append('carpeta', carpeta);
    return this.api.post<{ ruta: string; url: string }>('imagenes', datos).pipe(map((r) => r.url));
  }
}
