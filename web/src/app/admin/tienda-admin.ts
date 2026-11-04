import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { form, FormField, FormRoot, max, min, required } from '@angular/forms/signals';

import { ApiError } from '../core/api-error';
import { Avisos } from '../core/avisos';
import type { FotoTienda } from '../core/modelos';
import { Tiendas } from '../core/tiendas';
import { Dialogos } from '../shared/dialogos';
import { ErrorCampo } from '../shared/error-campo';
import { EstadoVista } from '../shared/estado-vista';
import { Icono } from '../shared/icono';
import { Imagen } from '../shared/imagen';
import { Mapa } from '../shared/mapa';
import { SubirImagen } from '../shared/subir-imagen';
import { mensajeError } from './errores';

interface ModeloTienda {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  historia: string;
}

/**
 * PW-17 Tienda y galería (RF-16, RF-08): lo que se ve en «La tienda» de la web y de las apps.
 * Para cambiar la ubicación basta con pulsar en el mapa: se rellenan latitud y longitud.
 */
@Component({
  selector: 'ja-tienda-admin',
  imports: [FormField, FormRoot, ErrorCampo, EstadoVista, Icono, Imagen, Mapa, SubirImagen],
  styleUrl: './tienda-admin.scss',
  templateUrl: './tienda-admin.html',
})
export class TiendaAdmin {
  private readonly tiendas = inject(Tiendas);
  private readonly avisos = inject(Avisos);
  private readonly dialogos = inject(Dialogos);

  protected readonly tienda = resource({ loader: () => this.tiendas.principal() });
  protected readonly fotos = resource({
    params: () => (this.tienda.hasValue() ? this.tienda.value().id : undefined),
    loader: ({ params }) => this.tiendas.fotos(params),
  });

  protected readonly error = signal('');
  private readonly modelo = signal<ModeloTienda>({
    nombre: '',
    direccion: '',
    latitud: 0,
    longitud: 0,
    historia: '',
  });

  protected readonly formulario = form(
    this.modelo,
    (c) => {
      required(c.nombre, { message: 'Escribe el nombre de la tienda.' });
      required(c.direccion, { message: 'Escribe la dirección completa.' });
      min(c.latitud, -90, { message: 'La latitud va de -90 a 90.' });
      max(c.latitud, 90, { message: 'La latitud va de -90 a 90.' });
      min(c.longitud, -180, { message: 'La longitud va de -180 a 180.' });
      max(c.longitud, 180, { message: 'La longitud va de -180 a 180.' });
    },
    {
      submission: {
        action: async (f) => {
          const t = this.tienda.hasValue() ? this.tienda.value() : null;
          if (!t) {
            return undefined;
          }
          this.error.set('');
          const m = f().value();
          try {
            await this.tiendas.actualizar(t.id, {
              nombre: m.nombre.trim(),
              direccion: m.direccion.trim(),
              // 7 decimales, como DECIMAL(10,7) en la BBDD
              latitud: Number(m.latitud.toFixed(7)),
              longitud: Number(m.longitud.toFixed(7)),
              historia: m.historia.trim() || null,
            });
            this.avisos.exito('Datos de la tienda guardados. Ya se ven en la web y en las apps.');
            this.formulario().reset();
            return undefined;
          } catch (e) {
            this.error.set(mensajeError(e));
            return { kind: 'servidor', message: ApiError.de(e).mensaje };
          }
        },
      },
    },
  );

  protected readonly marca = computed(() => {
    const m = this.modelo();
    return [
      { latitud: m.latitud, longitud: m.longitud, tipo: 'tienda' as const, titulo: m.nombre },
    ];
  });

  // ── Galería ──
  protected readonly nuevaImagen = signal<string | null>(null);
  protected readonly nuevaDescripcion = signal('');
  protected readonly anadiendo = signal(false);

  constructor() {
    // Cuando llegan los datos de la API se copian al formulario
    effect(() => {
      if (this.tienda.hasValue()) {
        const t = this.tienda.value();
        this.modelo.set({
          nombre: t.nombre,
          direccion: t.direccion,
          latitud: t.latitud,
          longitud: t.longitud,
          historia: t.historia ?? '',
        });
      }
    });
  }

  protected moverMarca(punto: { latitud: number; longitud: number }): void {
    this.modelo.update((m) => ({ ...m, latitud: punto.latitud, longitud: punto.longitud }));
    this.formulario.latitud().markAsDirty();
  }

  protected valor(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected async anadirFoto(): Promise<void> {
    const imagen = this.nuevaImagen();
    if (!imagen || !this.tienda.hasValue()) {
      return;
    }
    this.anadiendo.set(true);
    try {
      await this.tiendas.crearFoto(
        this.tienda.value().id,
        imagen,
        this.nuevaDescripcion().trim() || null,
      );
      this.nuevaImagen.set(null);
      this.nuevaDescripcion.set('');
      this.avisos.exito('Foto añadida a la galería.');
      this.fotos.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    } finally {
      this.anadiendo.set(false);
    }
  }

  protected async guardarDescripcion(f: FotoTienda, evento: Event): Promise<void> {
    const descripcion = this.valor(evento).trim() || null;
    if (descripcion === f.descripcion) {
      return;
    }
    try {
      await this.tiendas.actualizarFoto(f.id, descripcion);
      this.avisos.exito('Descripción guardada.');
      this.fotos.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }

  protected async borrarFoto(f: FotoTienda): Promise<void> {
    const si = await this.dialogos.confirmar({
      titulo: '¿Quitar esta foto de la galería?',
      texto: f.descripcion
        ? `«${f.descripcion}» dejará de verse en la web y en las apps.`
        : 'Dejará de verse en la web y en las apps.',
      aceptar: 'Quitar foto',
      peligro: true,
    });
    if (!si) {
      return;
    }
    try {
      await this.tiendas.borrarFoto(f.id);
      this.avisos.exito('Foto quitada.');
      this.fotos.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }
}
