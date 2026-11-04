import { Component, inject, input, resource, signal } from '@angular/core';

import { Avisos } from '../core/avisos';
import { Catalogo } from '../core/catalogo';
import type { Referencia } from '../core/modelos';
import { Dialogos } from '../shared/dialogos';
import { EstadoVista } from '../shared/estado-vista';
import { Icono } from '../shared/icono';
import { estaEnUso, mensajeError } from './errores';

/**
 * Lista editable de marcas o de plataformas (las dos tablas solo tienen «nombre»).
 * Se añade arriba y se edita en la misma fila: son tablas pequeñas y así no hace falta otra pantalla.
 */
@Component({
  selector: 'ja-lista-referencias',
  imports: [EstadoVista, Icono],
  styles: `
    :host {
      display: block;
    }
    .ja-panel {
      padding: var(--ja-espacio-5);
      display: grid;
      gap: var(--ja-espacio-4);
      align-content: start;
      height: 100%;
    }
    header {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-3);
    }
    header h2 {
      flex: 1;
      font: var(--ja-tipo-titulo);
    }
    .contador {
      font: var(--ja-tipo-codigo);
      color: var(--ja-texto-2);
    }
    .alta {
      display: flex;
      gap: var(--ja-espacio-2);
      align-items: flex-start;
    }
    .alta .ja-campo {
      flex: 1;
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      max-height: 420px;
      overflow-y: auto;
    }
    li {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-1);
      min-height: var(--ja-espacio-12);
      border-top: var(--ja-borde-fino) solid var(--ja-borde);
    }
    li .nombre {
      flex: 1;
      font: var(--ja-tipo-subtitulo);
    }
    li .ja-campo {
      flex: 1;
    }
    li .ja-campo input {
      min-height: var(--ja-tamano-tactil-min) !important;
      padding-block: var(--ja-espacio-2) !important;
    }
  `,
  template: `
    <section class="ja-panel" [attr.aria-labelledby]="'t-' + recurso()">
      <header>
        <h2 [id]="'t-' + recurso()">{{ titulo() }}</h2>
        @if (lista.hasValue()) {
          <span class="contador">{{ lista.value().length }}</span>
        }
      </header>

      <form class="alta" (submit)="$event.preventDefault(); crear()">
        <div class="ja-campo">
          <label class="ja-oculto" [for]="'nuevo-' + recurso()">Nueva {{ singular() }}</label>
          <input
            [id]="'nuevo-' + recurso()"
            [placeholder]="'Nueva ' + singular()"
            [value]="nuevo()"
            (input)="nuevo.set(valor($event))"
            maxlength="80"
          />
        </div>
        <button
          type="submit"
          class="ja-boton ja-boton--secundario ja-boton--peque"
          [disabled]="!nuevo().trim() || guardando()"
        >
          <ja-icono nombre="add" />Añadir
        </button>
      </form>

      @if (lista.hasValue()) {
        <ul>
          @for (r of lista.value(); track r.id) {
            <li>
              @if (editandoId() === r.id) {
                <div class="ja-campo">
                  <label class="ja-oculto" [for]="'ed-' + recurso() + r.id">Nombre</label>
                  <input
                    [id]="'ed-' + recurso() + r.id"
                    [value]="texto()"
                    (input)="texto.set(valor($event))"
                    (keydown.enter)="guardar(r)"
                    (keydown.escape)="editandoId.set(null)"
                  />
                </div>
                <button
                  type="button"
                  class="ja-boton-icono"
                  aria-label="Guardar"
                  [disabled]="!texto().trim()"
                  (click)="guardar(r)"
                >
                  <ja-icono nombre="check" />
                </button>
                <button
                  type="button"
                  class="ja-boton-icono"
                  aria-label="Cancelar"
                  (click)="editandoId.set(null)"
                >
                  <ja-icono nombre="close" />
                </button>
              } @else {
                <span class="nombre">{{ r.nombre }}</span>
                <button
                  type="button"
                  class="ja-boton-icono"
                  [attr.aria-label]="'Editar ' + r.nombre"
                  (click)="editar(r)"
                >
                  <ja-icono nombre="edit" />
                </button>
                <button
                  type="button"
                  class="ja-boton-icono ja-boton-icono--peligro"
                  [attr.aria-label]="'Borrar ' + r.nombre"
                  (click)="borrar(r)"
                >
                  <ja-icono nombre="delete" />
                </button>
              }
            </li>
          }
        </ul>
      } @else if (lista.error()) {
        <ja-estado-vista tipo="error" (reintentar)="lista.reload()" />
      } @else {
        <ja-estado-vista tipo="cargando" />
      }
    </section>
  `,
})
export class ListaReferencias {
  private readonly catalogo = inject(Catalogo);
  private readonly avisos = inject(Avisos);
  private readonly dialogos = inject(Dialogos);

  readonly recurso = input.required<'marcas' | 'plataformas'>();
  readonly titulo = input.required<string>();
  readonly singular = input.required<string>();

  protected readonly lista = resource({
    params: () => this.recurso(),
    loader: ({ params }) =>
      params === 'marcas' ? this.catalogo.marcas() : this.catalogo.plataformas(),
  });

  protected readonly nuevo = signal('');
  protected readonly guardando = signal(false);
  protected readonly editandoId = signal<number | null>(null);
  protected readonly texto = signal('');

  protected valor(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected async crear(): Promise<void> {
    const nombre = this.nuevo().trim();
    if (!nombre) {
      return;
    }
    this.guardando.set(true);
    try {
      await this.catalogo.guardarReferencia(this.recurso(), nombre);
      this.nuevo.set('');
      this.avisos.exito(`«${nombre}» añadida.`);
      this.lista.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }

  protected editar(r: Referencia): void {
    this.texto.set(r.nombre);
    this.editandoId.set(r.id);
  }

  protected async guardar(r: Referencia): Promise<void> {
    const nombre = this.texto().trim();
    if (!nombre) {
      return;
    }
    try {
      await this.catalogo.guardarReferencia(this.recurso(), nombre, r.id);
      this.editandoId.set(null);
      this.avisos.exito('Cambio guardado.');
      this.lista.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }

  protected async borrar(r: Referencia): Promise<void> {
    const si = await this.dialogos.confirmar({
      titulo: `¿Borrar «${r.nombre}»?`,
      texto: `Solo se puede borrar si ningún producto la usa.`,
      aceptar: 'Borrar',
      peligro: true,
    });
    if (!si) {
      return;
    }
    try {
      await this.catalogo.borrarReferencia(this.recurso(), r.id);
      this.avisos.exito(`«${r.nombre}» borrada.`);
      this.lista.reload();
    } catch (e) {
      this.avisos.error(
        estaEnUso(e)
          ? `«${r.nombre}» tiene productos asociados: cámbialos de ${this.singular()} antes de borrarla.`
          : mensajeError(e),
      );
    }
  }
}
