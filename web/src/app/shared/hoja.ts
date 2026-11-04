import type { ElementRef } from '@angular/core';
import { Component, effect, input, output, viewChild } from '@angular/core';

import { Icono } from './icono';

/**
 * Hoja lateral para los formularios y fichas del backoffice. Usa <dialog> nativo con showModal():
 * el navegador ya atrapa el foco, cierra con Escape y pone el fondo (::backdrop) sin librerías.
 * El pie (botones) se pasa con <div pie>…</div>.
 */
@Component({
  selector: 'ja-hoja',
  imports: [Icono],
  styles: `
    .marco {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    header {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-3);
      padding: var(--ja-espacio-4) var(--ja-espacio-10) var(--ja-espacio-4) var(--ja-espacio-6);
      border-bottom: var(--ja-borde-fino) solid var(--ja-borde);
    }
    header h2 {
      flex: 1;
      font: var(--ja-tipo-titular-m);
      letter-spacing: var(--ja-tipo-titular-m-espaciado);
    }
    .cuerpo {
      flex: 1;
      overflow-y: auto;
      padding: var(--ja-espacio-6);
    }
    .pie {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: var(--ja-espacio-2);
      padding: var(--ja-espacio-4) var(--ja-espacio-6);
      border-top: var(--ja-borde-fino) solid var(--ja-borde);
    }
    .pie:empty {
      display: none;
    }
  `,
  template: `
    <dialog
      #dialogo
      class="ja-hoja"
      [attr.aria-labelledby]="'hoja-' + id"
      (close)="cerrar.emit()"
      (cancel)="cerrar.emit()"
    >
      <div class="marco">
        <header>
          <h2 [id]="'hoja-' + id">{{ titulo() }}</h2>
          <button type="button" class="ja-boton-icono" aria-label="Cerrar" (click)="cerrar.emit()">
            <ja-icono nombre="close" />
          </button>
        </header>
        <div class="cuerpo"><ng-content /></div>
        <div class="pie"><ng-content select="[pie]" /></div>
      </div>
    </dialog>
  `,
})
export class Hoja {
  private static contador = 0;
  protected readonly id = ++Hoja.contador;

  readonly abierta = input(false);
  readonly titulo = input('');
  readonly cerrar = output<void>();

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const d = this.dialogo().nativeElement;
      if (this.abierta() && !d.open) {
        d.showModal();
      } else if (!this.abierta() && d.open) {
        d.close();
      }
    });
  }
}
