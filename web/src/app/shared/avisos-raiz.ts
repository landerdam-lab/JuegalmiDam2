import { Component, inject } from '@angular/core';

import { Avisos } from '../core/avisos';
import { Icono } from './icono';

/**
 * Snackbar del sistema (DESIGN.md §9): fondo tinta, muesca de 8 e icono del tipo de aviso.
 * aria-live="polite": el lector de pantalla lo lee sin interrumpir.
 */
@Component({
  selector: 'ja-avisos',
  imports: [Icono],
  styles: `
    :host {
      position: fixed;
      right: var(--ja-espacio-4);
      bottom: var(--ja-espacio-4);
      left: var(--ja-espacio-4);
      z-index: 50;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--ja-espacio-2);
      pointer-events: none;
    }
    .aviso {
      --corte: var(--ja-radio-s);
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-3);
      max-width: 440px;
      padding: var(--ja-espacio-3) var(--ja-espacio-2) var(--ja-espacio-3) var(--ja-espacio-4);
      border-radius: var(--ja-radio-m);
      background: var(--ja-texto);
      color: var(--ja-fondo);
      font: var(--ja-tipo-cuerpo);
      box-shadow: var(--ja-elevacion-2);
      animation: entrar var(--ja-duracion-base) var(--ja-curva-entrada);
    }
    .aviso > span {
      flex: 1;
    }
    .exito ja-icono:first-child {
      color: var(--ja-primario);
    }
    .error ja-icono:first-child {
      color: var(--ja-error-suave);
    }
    button {
      display: grid;
      place-items: center;
      width: var(--ja-tamano-tactil-min);
      height: var(--ja-tamano-tactil-min);
      border: 0;
      border-radius: var(--ja-radio-completo);
      background: none;
      color: inherit;
      cursor: pointer;
    }
    @keyframes entrar {
      from {
        opacity: 0;
        transform: translateY(var(--ja-espacio-2));
      }
    }
  `,
  template: `
    <div aria-live="polite" role="status" class="ja-oculto">
      @for (a of avisos.lista(); track a.id) {
        {{ a.texto }}
      }
    </div>
    @for (a of avisos.lista(); track a.id) {
      <div class="aviso ja-recorte {{ a.tipo }}">
        <ja-icono
          [nombre]="a.tipo === 'exito' ? 'check_circle' : a.tipo === 'error' ? 'error' : 'info'"
        />
        <span>{{ a.texto }}</span>
        <button type="button" aria-label="Cerrar aviso" (click)="avisos.cerrar(a.id)">
          <ja-icono nombre="close" />
        </button>
      </div>
    }
  `,
})
export class AvisosRaiz {
  protected readonly avisos = inject(Avisos);
}
