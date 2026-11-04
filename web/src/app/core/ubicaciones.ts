import { Service, inject } from '@angular/core';

import { Api } from './api';
import type { ImagenSubida, Pagina, RegistroUbicacion } from './modelos';

export type Carpeta = 'productos' | 'usuarios' | 'reparaciones' | 'tienda';

/**
 * Registro de ubicaciones (PW-18, RF-11): dónde estaba cada cliente al usar la app.
 * Lo escriben las apps con X-Latitud / X-Longitud (ADR-014); la web solo lo consulta.
 */
@Service()
export class Ubicaciones {
  private readonly api = inject(Api);

  listar(
    filtros: {
      usuario?: number | null;
      desde?: string;
      hasta?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<Pagina<RegistroUbicacion>> {
    return this.api.get<Pagina<RegistroUbicacion>>('registros-ubicacion', filtros);
  }
}

/**
 * Subida de imágenes (ADR-019): primero se sube el archivo y la API devuelve su URL;
 * después esa URL se guarda en el producto o en la foto de la tienda.
 */
@Service()
export class Imagenes {
  private readonly api = inject(Api);

  subir(archivo: File, carpeta: Carpeta): Promise<ImagenSubida> {
    const datos = new FormData();
    datos.append('imagen', archivo);
    datos.append('carpeta', carpeta);
    return this.api.enviarFormulario<ImagenSubida>('imagenes', datos);
  }
}
