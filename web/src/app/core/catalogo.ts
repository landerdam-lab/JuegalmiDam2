import { Service, inject } from '@angular/core';

import { Api, type Parametros } from './api';
import type {
  LineaServicio,
  Pagina,
  Producto,
  Referencia,
  Servicio,
  TipoProducto,
} from './modelos';

/** Ruta de la API de cada subtipo de producto. */
export const RECURSO: Record<TipoProducto, string> = {
  videojuego: 'videojuegos',
  movil: 'moviles',
  consola: 'consolas',
};

export type Orden = 'nombre' | 'precio_asc' | 'precio_desc';

export interface FiltrosCatalogo {
  q?: string;
  marca?: number | null;
  orden?: Orden;
  page?: number;
  limit?: number;
  // Videojuegos
  plataforma?: number | null;
  genero?: string;
  pegi?: number | null;
  alquilable?: boolean;
  // Móviles
  formato?: string;
  // Solo admin: ?activo=0 lista los retirados (ADR-018)
  activo?: 0 | 1;
}

/** Datos de alta o edición de un producto (los mismos nombres que espera la API). */
export type DatosProducto = Record<string, string | number | boolean | null>;

/**
 * Catálogo: lectura pública (la web la usa sin token, ADR-028) y CRUD del backoffice (solo admin).
 * Productos, marcas, plataformas, géneros, departamentos y servicios.
 */
@Service()
export class Catalogo {
  private readonly api = inject(Api);

  // ── Lectura ──

  listar(tipo: TipoProducto, filtros: FiltrosCatalogo = {}): Promise<Pagina<Producto>> {
    return this.api.get<Pagina<Producto>>(RECURSO[tipo], filtros as Parametros);
  }

  /** Todos los tipos mezclados: /productos?tipo=&q= (portada y resumen). */
  listarTodos(filtros: FiltrosCatalogo & { tipo?: TipoProducto } = {}): Promise<Pagina<Producto>> {
    return this.api.get<Pagina<Producto>>('productos', filtros as Parametros);
  }

  producto(id: number): Promise<Producto> {
    return this.api.get<Producto>(`productos/${id}`);
  }

  marcas(): Promise<Referencia[]> {
    return this.api.get<Referencia[]>('marcas');
  }

  plataformas(): Promise<Referencia[]> {
    return this.api.get<Referencia[]>('plataformas');
  }

  generos(): Promise<string[]> {
    return this.api.get<string[]>('generos');
  }

  departamentos(): Promise<Referencia[]> {
    return this.api.get<Referencia[]>('departamentos');
  }

  servicios(linea?: LineaServicio): Promise<Servicio[]> {
    return this.api.get<Servicio[]>('servicios', { linea });
  }

  // ── Gestión de productos (PW-11) ──

  crearProducto(tipo: TipoProducto, datos: DatosProducto): Promise<Producto> {
    return this.api.post<Producto>(RECURSO[tipo], datos);
  }

  /** PUT parcial: solo cambia lo que se envía. Retirar = {activo: false} (baja lógica, ADR-018). */
  actualizarProducto(tipo: TipoProducto, id: number, datos: DatosProducto): Promise<Producto> {
    return this.api.put<Producto>(`${RECURSO[tipo]}/${id}`, datos);
  }

  /** 409 EN_USO si tiene ventas o alquileres: entonces hay que retirarlo. */
  borrarProducto(tipo: TipoProducto, id: number): Promise<unknown> {
    return this.api.delete(`${RECURSO[tipo]}/${id}`);
  }

  // ── Marcas, plataformas y servicios (PW-12) ──

  guardarReferencia(
    recurso: 'marcas' | 'plataformas',
    nombre: string,
    id?: number,
  ): Promise<Referencia> {
    return id
      ? this.api.put<Referencia>(`${recurso}/${id}`, { nombre })
      : this.api.post<Referencia>(recurso, { nombre });
  }

  /** 409 si tiene productos (marcas) o videojuegos (plataformas). */
  borrarReferencia(recurso: 'marcas' | 'plataformas', id: number): Promise<unknown> {
    return this.api.delete(`${recurso}/${id}`);
  }

  guardarServicio(datos: Omit<Servicio, 'id'>, id?: number): Promise<Servicio> {
    return id
      ? this.api.put<Servicio>(`servicios/${id}`, datos)
      : this.api.post<Servicio>('servicios', datos);
  }

  borrarServicio(id: number): Promise<unknown> {
    return this.api.delete(`servicios/${id}`);
  }
}
