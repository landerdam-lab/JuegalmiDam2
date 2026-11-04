import type { ElementRef } from '@angular/core';
import { Component, Service, effect, inject, signal, viewChild } from '@angular/core';

import { Icono } from './icono';

interface Pregunta {
  titulo: string;
  texto: string;
  aceptar: string;
  peligro: boolean;
  responder: (si: boolean) => void;
}

/**
 * Confirmaciones antes de una acción que no se puede deshacer (borrar, cancelar un pedido…).
 * const si = await dialogos.confirmar({...}) — devuelve true si se acepta.
 */
@Service()
export class Dialogos {
  readonly pregunta = signal<Pregunta | null>(null);

  confirmar(opciones: {
    titulo: string;
    texto: string;
    aceptar: string;
    peligro?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      this.pregunta.set({
        ...opciones,
        peligro: opciones.peligro ?? false,
        responder: (si) => {
          this.pregunta.set(null);
          resolve(si);
        },
      });
    });
  }
}

/** Pinta la pregunta pendiente. Va una sola vez en la raíz de la app. */
@Component({
  selector: 'ja-dialogos',
  imports: [Icono],
  styles: `
    .contenido {
      display: grid;
      gap: var(--ja-espacio-3);
      padding: var(--ja-espacio-6);
    }
    .icono {
      width: var(--ja-espacio-12);
      height: var(--ja-espacio-12);
      display: grid;
      place-items: center;
      border-radius: var(--ja-radio-completo);
      background: var(--ja-marca-suave);
      color: var(--ja-marca);
    }
    .icono.peligro {
      background: var(--ja-error-suave);
      color: var(--ja-error);
    }
    h2 {
      font: var(--ja-tipo-titular-m);
      letter-spacing: var(--ja-tipo-titular-m-espaciado);
    }
    .botones {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: var(--ja-espacio-2);
      padding-top: var(--ja-espacio-3);
    }
  `,
  template: `
    <dialog
      #dialogo
      class="ja-dialogo"
      aria-labelledby="dialogo-titulo"
      (cancel)="responder(false)"
    >
      @if (dialogos.pregunta(); as p) {
        <div class="contenido">
          <div class="icono" [class.peligro]="p.peligro">
            <ja-icono [nombre]="p.peligro ? 'warning' : 'info'" />
          </div>
          <h2 id="dialogo-titulo">{{ p.titulo }}</h2>
          <p class="ja-cuerpo-l ja-t2">{{ p.texto }}</p>
          <div class="botones">
            <button type="button" class="ja-boton ja-boton--texto" (click)="responder(false)">
              Volver
            </button>
            <button
              type="button"
              class="ja-boton"
              [class.ja-boton--peligro]="p.peligro"
              [class.ja-boton--secundario]="!p.peligro"
              (click)="responder(true)"
            >
              {{ p.aceptar }}
            </button>
          </div>
        </div>
      }
    </dialog>
  `,
})
export class DialogosRaiz {
  protected readonly dialogos = inject(Dialogos);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const d = this.dialogo().nativeElement;
      if (this.dialogos.pregunta() && !d.open) {
        d.showModal();
      } else if (!this.dialogos.pregunta() && d.open) {
        d.close();
      }
    });
  }

  protected responder(si: boolean): void {
    this.dialogos.pregunta()?.responder(si);
  }
}
