import { Component, computed, inject, resource, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';

import { ApiError } from '../core/api-error';
import { Avisos } from '../core/avisos';
import { Catalogo } from '../core/catalogo';
import { LINEAS, precio } from '../core/formato';
import type { LineaServicio, Servicio } from '../core/modelos';
import { Dialogos } from '../shared/dialogos';
import { ErrorCampo } from '../shared/error-campo';
import { EstadoVista } from '../shared/estado-vista';
import { Hoja } from '../shared/hoja';
import { Icono } from '../shared/icono';
import { mensajeError } from './errores';
import { ListaReferencias } from './lista-referencias';

interface ModeloServicio {
  linea: LineaServicio;
  nombre: string;
  descripcion: string;
  /** Vacío = «según presupuesto» (precioOrientativo null en la BBDD). */
  precio: string;
}

/**
 * PW-12 Marcas, plataformas y servicios (RF-16). Las dos primeras son listas sencillas;
 * los servicios se agrupan por línea de negocio (las 3 pestañas de «La tienda», ADR-030).
 */
@Component({
  selector: 'ja-catalogos',
  imports: [FormField, FormRoot, ErrorCampo, EstadoVista, Hoja, Icono, ListaReferencias],
  styles: `
    .listas {
      display: grid;
      gap: var(--ja-espacio-4);
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      margin-bottom: var(--ja-espacio-8);
    }
    .servicios-cabecera {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ja-espacio-3);
      margin-bottom: var(--ja-espacio-3);
    }
    .servicios-cabecera h2 {
      font: var(--ja-tipo-titular-m);
    }
    .ja-pestanas {
      margin-bottom: var(--ja-espacio-4);
    }
    .descripcion {
      max-width: 48ch;
      color: var(--ja-texto-2);
    }
  `,
  template: `
    <header class="ja-admin-cabecera">
      <div>
        <h1>Marcas, plataformas y servicios</h1>
        <p>
          Las listas que usan los productos y la sección «La tienda». Lo que esté en uso no se puede
          borrar.
        </p>
      </div>
    </header>

    <div class="listas">
      <ja-lista-referencias recurso="marcas" titulo="Marcas" singular="marca" />
      <ja-lista-referencias recurso="plataformas" titulo="Plataformas" singular="plataforma" />
    </div>

    <section aria-labelledby="t-servicios">
      <div class="servicios-cabecera">
        <h2 id="t-servicios">Servicios</h2>
        <button type="button" class="ja-boton" (click)="nuevo()">
          <ja-icono nombre="add" />Nuevo servicio
        </button>
      </div>
      <nav class="ja-pestanas" aria-label="Línea de negocio">
        @for (l of listaLineas; track l) {
          <button type="button" [attr.aria-selected]="linea() === l" (click)="linea.set(l)">
            <ja-icono [nombre]="lineas[l].icono" />{{ lineas[l].nombre }}
          </button>
        }
      </nav>
      @if (servicios.hasValue()) {
        @if (serviciosLinea().length) {
          <div class="ja-tabla-caja">
            <table class="ja-tabla">
              <thead>
                <tr>
                  <th scope="col">Servicio</th>
                  <th scope="col">Descripción</th>
                  <th scope="col" class="num">Precio orientativo</th>
                  <th scope="col"><span class="ja-oculto">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                @for (s of serviciosLinea(); track s.id) {
                  <tr>
                    <td class="fuerte">{{ s.nombre }}</td>
                    <td class="descripcion">{{ s.descripcion }}</td>
                    <td class="num">
                      {{
                        s.precioOrientativo !== null
                          ? precio(s.precioOrientativo)
                          : 'Según presupuesto'
                      }}
                    </td>
                    <td class="acciones">
                      <button
                        type="button"
                        class="ja-boton-icono"
                        [attr.aria-label]="'Editar ' + s.nombre"
                        (click)="editar(s)"
                      >
                        <ja-icono nombre="edit" />
                      </button>
                      <button
                        type="button"
                        class="ja-boton-icono ja-boton-icono--peligro"
                        [attr.aria-label]="'Borrar ' + s.nombre"
                        (click)="borrar(s)"
                      >
                        <ja-icono nombre="delete" />
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <ja-estado-vista
            tipo="vacio"
            icono="handyman"
            [titulo]="'No hay servicios de ' + lineas[linea()].nombre.toLowerCase()"
            texto="Añade el primero con «Nuevo servicio»."
          />
        }
      } @else if (servicios.error()) {
        <ja-estado-vista tipo="error" (reintentar)="servicios.reload()" />
      } @else {
        <ja-estado-vista tipo="cargando" />
      }
    </section>

    <ja-hoja
      [abierta]="hojaAbierta()"
      [titulo]="editando() ? 'Editar servicio' : 'Nuevo servicio'"
      (cerrar)="hojaAbierta.set(false)"
    >
      <form id="form-servicio" class="ja-form" [formRoot]="formulario">
        @if (error()) {
          <p class="ja-aviso-linea" role="alert"><ja-icono nombre="error" />{{ error() }}</p>
        }
        <div class="ja-campo">
          <label for="s-linea">Línea de negocio</label>
          <select id="s-linea" [formField]="formulario.linea">
            @for (l of listaLineas; track l) {
              <option [value]="l">{{ lineas[l].nombre }}</option>
            }
          </select>
        </div>
        <div class="ja-campo">
          <label for="s-nombre">Nombre</label>
          <input id="s-nombre" [formField]="formulario.nombre" placeholder="Cambio de pantalla" />
          <ja-error-campo [campo]="formulario.nombre" />
        </div>
        <div class="ja-campo">
          <label for="s-descripcion">Descripción</label>
          <textarea id="s-descripcion" rows="3" [formField]="formulario.descripcion"></textarea>
        </div>
        <div class="ja-campo">
          <label for="s-precio">Precio orientativo (€)</label>
          <input
            id="s-precio"
            type="text"
            inputmode="decimal"
            [formField]="formulario.precio"
            placeholder="Déjalo vacío si es según presupuesto"
          />
          <ja-error-campo [campo]="formulario.precio" />
        </div>
      </form>
      <div pie>
        <button type="button" class="ja-boton ja-boton--texto" (click)="hojaAbierta.set(false)">
          Cancelar
        </button>
        <button
          type="submit"
          form="form-servicio"
          class="ja-boton"
          [disabled]="formulario().submitting()"
        >
          <ja-icono nombre="check" />{{ editando() ? 'Guardar cambios' : 'Añadir servicio' }}
        </button>
      </div>
    </ja-hoja>
  `,
})
export class Catalogos {
  private readonly catalogo = inject(Catalogo);
  private readonly avisos = inject(Avisos);
  private readonly dialogos = inject(Dialogos);

  protected readonly lineas = LINEAS;
  protected readonly listaLineas: LineaServicio[] = ['videojuegos', 'consolas', 'telefonia'];
  protected readonly precio = precio;

  protected readonly linea = signal<LineaServicio>('videojuegos');
  protected readonly servicios = resource({ loader: () => this.catalogo.servicios() });
  protected readonly serviciosLinea = computed(() =>
    this.servicios.hasValue() ? this.servicios.value().filter((s) => s.linea === this.linea()) : [],
  );

  protected readonly hojaAbierta = signal(false);
  protected readonly editando = signal<Servicio | null>(null);
  protected readonly error = signal('');
  private readonly modelo = signal<ModeloServicio>({
    linea: 'videojuegos',
    nombre: '',
    descripcion: '',
    precio: '',
  });

  protected readonly formulario = form(
    this.modelo,
    (c) => {
      required(c.nombre, { message: 'Escribe el nombre del servicio.' });
      // El precio es texto para poder dejarlo vacío («según presupuesto»); se comprueba al guardar
    },
    {
      submission: {
        action: async (f) => {
          const m = f().value();
          const texto = m.precio.trim().replace(',', '.');
          if (texto && (Number.isNaN(Number(texto)) || Number(texto) < 0)) {
            return {
              kind: 'precio',
              message: 'Escribe un precio como 25 o 25,50, o déjalo vacío.',
              fieldTree: f.precio,
            };
          }
          this.error.set('');
          const datos = {
            linea: m.linea,
            nombre: m.nombre.trim(),
            descripcion: m.descripcion.trim() || null,
            precioOrientativo: texto ? Number(texto) : null,
          };
          try {
            await this.catalogo.guardarServicio(datos, this.editando()?.id);
            this.avisos.exito(`Servicio «${datos.nombre}» guardado.`);
            this.linea.set(datos.linea);
            this.hojaAbierta.set(false);
            this.servicios.reload();
            return undefined;
          } catch (e) {
            this.error.set(mensajeError(e));
            return { kind: 'servidor', message: ApiError.de(e).mensaje };
          }
        },
      },
    },
  );

  protected nuevo(): void {
    this.editando.set(null);
    this.modelo.set({ linea: this.linea(), nombre: '', descripcion: '', precio: '' });
    this.formulario().reset();
    this.error.set('');
    this.hojaAbierta.set(true);
  }

  protected editar(s: Servicio): void {
    this.editando.set(s);
    this.modelo.set({
      linea: s.linea,
      nombre: s.nombre,
      descripcion: s.descripcion ?? '',
      precio: s.precioOrientativo !== null ? String(s.precioOrientativo) : '',
    });
    this.formulario().reset();
    this.error.set('');
    this.hojaAbierta.set(true);
  }

  protected async borrar(s: Servicio): Promise<void> {
    const si = await this.dialogos.confirmar({
      titulo: `¿Borrar «${s.nombre}»?`,
      texto: 'Dejará de verse en «La tienda» de la web y de las apps.',
      aceptar: 'Borrar',
      peligro: true,
    });
    if (!si) {
      return;
    }
    try {
      await this.catalogo.borrarServicio(s.id);
      this.avisos.exito(`«${s.nombre}» borrado.`);
      this.servicios.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }
}
