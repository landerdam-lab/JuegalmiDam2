import { Component, inject, input, model, signal } from '@angular/core';

import { ApiError } from '../core/api-error';
import { type Carpeta, Imagenes } from '../core/ubicaciones';
import { Icono } from './icono';
import { Imagen } from './imagen';

/** Tamaño máximo que se deja elegir: el mismo límite orientativo que las apps (fotos reducidas). */
const MAXIMO_MB = 5;

/**
 * Elegir y subir una imagen (POST /imagenes, ADR-019). En cuanto se elige, se sube y [(url)]
 * pasa a ser la URL que devuelve la API; el formulario la guarda después con el resto de datos.
 */
@Component({
  selector: 'ja-subir-imagen',
  imports: [Icono, Imagen],
  styles: `
    :host {
      display: grid;
      grid-template-columns: 112px 1fr;
      gap: var(--ja-espacio-4);
      align-items: center;
    }
    ja-imagen {
      --proporcion: 1;
      --tam-placeholder: var(--ja-espacio-8);
      border-radius: var(--ja-radio-m);
    }
    .acciones {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--ja-espacio-2);
    }
    input[type='file'] {
      display: none;
    }
  `,
  template: `
    <ja-imagen class="ja-recorte" [src]="url()" [alt]="etiqueta()" />
    <div class="acciones">
      <span class="ja-etiqueta">{{ etiqueta() }}</span>
      <label
        class="ja-boton ja-boton--secundario ja-boton--peque"
        [attr.aria-disabled]="subiendo()"
      >
        <ja-icono [nombre]="subiendo() ? 'schedule' : 'upload'" />
        {{ subiendo() ? 'Subiendo…' : url() ? 'Cambiar imagen' : 'Elegir imagen' }}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          [disabled]="subiendo()"
          (change)="elegir($event)"
        />
      </label>
      @if (error()) {
        <span class="ja-ayuda ja-ayuda--error" role="alert"
          ><ja-icono nombre="error" />{{ error() }}</span
        >
      } @else {
        <span class="ja-ayuda">JPG, PNG o WebP de hasta {{ maximo }} MB.</span>
      }
    </div>
  `,
})
export class SubirImagen {
  private readonly imagenes = inject(Imagenes);

  readonly url = model<string | null>(null);
  readonly carpeta = input.required<Carpeta>();
  readonly etiqueta = input('Imagen');

  protected readonly maximo = MAXIMO_MB;
  protected readonly subiendo = signal(false);
  protected readonly error = signal('');

  protected async elegir(evento: Event): Promise<void> {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    campo.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) {
      return;
    }
    if (archivo.size > MAXIMO_MB * 1024 * 1024) {
      this.error.set(`La imagen pesa más de ${MAXIMO_MB} MB. Elige una más pequeña.`);
      return;
    }
    this.error.set('');
    this.subiendo.set(true);
    try {
      const subida = await this.imagenes.subir(archivo, this.carpeta());
      this.url.set(subida.url);
    } catch (e) {
      const err = ApiError.de(e);
      this.error.set(err.campos['imagen'] ?? err.mensaje);
    } finally {
      this.subiendo.set(false);
    }
  }
}
