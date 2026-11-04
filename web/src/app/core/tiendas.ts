import { Service, inject } from '@angular/core';

import { Api } from './api';
import type { FotoTienda, Tienda } from './modelos';

export type DatosTienda = Pick<
  Tienda,
  'nombre' | 'direccion' | 'latitud' | 'longitud' | 'historia'
>;

/**
 * La tienda física: datos, ubicación, historia y galería (PW-04 en público, PW-17 en el backoffice).
 * La demo tiene una sola tienda; se usa la primera que devuelve la API.
 */
@Service()
export class Tiendas {
  private readonly api = inject(Api);

  async principal(): Promise<Tienda> {
    const tiendas = await this.api.get<Tienda[]>('tiendas');
    if (!tiendas.length) {
      throw new Error('No hay ninguna tienda dada de alta.');
    }
    return this.api.get<Tienda>(`tiendas/${tiendas[0].id}`);
  }

  fotos(tiendaId: number): Promise<FotoTienda[]> {
    return this.api.get<FotoTienda[]>(`tiendas/${tiendaId}/fotos`);
  }

  actualizar(id: number, datos: Partial<DatosTienda>): Promise<Tienda> {
    return this.api.put<Tienda>(`tiendas/${id}`, datos);
  }

  /** La imagen se sube antes con Imagenes.subir(): aquí se manda su URL. */
  crearFoto(tiendaId: number, imagen: string, descripcion: string | null): Promise<FotoTienda> {
    return this.api.post<FotoTienda>('fotos-tienda', { tiendaId, imagen, descripcion });
  }

  actualizarFoto(id: number, descripcion: string | null): Promise<FotoTienda> {
    return this.api.put<FotoTienda>(`fotos-tienda/${id}`, { descripcion });
  }

  borrarFoto(id: number): Promise<unknown> {
    return this.api.delete(`fotos-tienda/${id}`);
  }
}
