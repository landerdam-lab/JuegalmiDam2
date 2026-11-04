import { Component, computed, input } from '@angular/core';

import { Icono } from './icono';

/** Lo mínimo que necesita este componente de un campo de Signal Forms (form.nombre). */
type CampoFormulario = () => {
  touched(): boolean;
  invalid(): boolean;
  errors(): readonly { message?: string }[];
};

/**
 * Error de un campo de formulario, debajo de él y diciendo cómo corregirlo (DESIGN.md §10).
 * Solo aparece cuando el campo ya se ha tocado (o al intentar guardar, que los toca todos).
 * <ja-error-campo [campo]="formulario.nombre" id="nombre-error" />
 */
@Component({
  selector: 'ja-error-campo',
  imports: [Icono],
  host: { role: 'alert' },
  styles: `
    :host {
      display: contents;
    }
    .ja-ayuda--error {
      --tam: var(--ja-espacio-4);
    }
  `,
  template: `
    @if (mensaje()) {
      <span class="ja-ayuda ja-ayuda--error"><ja-icono nombre="error" />{{ mensaje() }}</span>
    }
  `,
})
export class ErrorCampo {
  readonly campo = input.required<CampoFormulario>();
  protected readonly mensaje = computed(() => {
    const estado = this.campo()();
    return estado.touched() && estado.invalid()
      ? (estado.errors()[0]?.message ?? 'Revisa este campo.')
      : '';
  });
}
