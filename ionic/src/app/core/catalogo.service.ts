import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from './api.service';
import type { Pagina, Producto, Referencia, TipoProducto } from './modelos';

export type Orden = 'nombre' | 'precio_asc' | 'precio_desc';

export interface Filtro {
  tipo: TipoProducto;
  texto?: string;
  soloAlquilables?: boolean;
  formato?: 'movil' | 'tablet' | null;
  plataforma?: number | null;
  genero?: string | null;
  pegi?: number | null;
  marca?: number | null;
  orden: Orden;
}

const RECURSO: Record<TipoProducto, string> = { videojuego: 'videojuegos', movil: 'moviles', consola: 'consolas' };
export const POR_PAGINA = 20;

export function hayFiltros(f: Filtro): boolean {
  return (
    !!f.soloAlquilables ||
    !!f.formato ||
    f.plataforma != null ||
    f.genero != null ||
    f.pegi != null ||
    f.marca != null ||
    f.orden !== 'nombre'
  );
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly api = inject(ApiService);

  listar(f: Filtro, pagina: number, limite = POR_PAGINA): Observable<Pagina<Producto>> {
    return this.api.get<Pagina<Producto>>(RECURSO[f.tipo], {
      page: pagina,
      limit: limite,
      q: f.texto,
      alquilable: f.soloAlquilables ? 1 : null,
      formato: f.formato,
      plataforma: f.plataforma,
      genero: f.genero,
      pegi: f.pegi,
      marca: f.marca,
      orden: f.orden,
    });
  }

  detalle(tipo: TipoProducto, id: number): Observable<Producto> {
    return this.api.get<Producto>(`${RECURSO[tipo]}/${id}`);
  }

  plataformas(): Observable<Referencia[]> {
    return this.api.get<Referencia[]>('plataformas');
  }

  marcas(): Observable<Referencia[]> {
    return this.api.get<Referencia[]>('marcas');
  }

  generos(): Observable<string[]> {
    return this.api.get<string[]>('generos');
  }
}
