import { Component, computed, inject, input, resource, signal } from '@angular/core';

import { Avisos } from '../core/avisos';
import { precio } from '../core/formato';
import type { ProveedorDeProducto } from '../core/modelos';
import { Proveedores } from '../core/proveedores';
import { Dialogos } from '../shared/dialogos';
import { Icono } from '../shared/icono';
import { mensajeError } from './errores';

/**
 * Bloque «Proveedores» de la ficha de un producto (PW-11, ADR-042): a quién se compra y a qué
 * precio, con el margen sobre el precio de venta. Añadir un proveedor que ya estaba solo le cambia
 * el precio (la API usa un PUT idempotente). Va fuera del <form> del producto: se guarda al momento.
 */
@Component({
  selector: 'ja-proveedores-producto',
  imports: [Icono],
  styles: `
    :host {
      display: grid;
      gap: var(--ja-espacio-3);
      margin-top: var(--ja-espacio-6);
      padding-top: var(--ja-espacio-4);
      border-top: var(--ja-borde-fino) solid var(--ja-borde);
    }
    .nuevo {
      display: grid;
      grid-template-columns: 1fr 140px auto;
      gap: var(--ja-espacio-3);
      align-items: end;
    }
    @media (max-width: 520px) {
      .nuevo {
        grid-template-columns: 1fr;
      }
    }
    .margen-negativo {
      color: var(--ja-error);
    }
  `,
  template: `
    <p class="ja-form-seccion">Proveedores</p>
    <p class="ja-ayuda">
      A quién se compra este producto y cuánto le cuesta a la tienda. Solo lo ve la administración.
    </p>

    @if (lista.hasValue()) {
      @if (lista.value().length) {
        <div class="ja-tabla-caja">
          <table class="ja-tabla">
            <caption class="ja-oculto">
              Proveedores del producto
            </caption>
            <thead>
              <tr>
                <th scope="col">Proveedor</th>
                <th scope="col" class="num">Coste</th>
                <th scope="col" class="num">Margen</th>
                <th scope="col"><span class="ja-oculto">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              @for (f of lista.value(); track f.id) {
                <tr>
                  <td>{{ f.proveedor.nombre }}</td>
                  <td class="num">{{ precio(f.precioCoste) }}</td>
                  <td class="num" [class.margen-negativo]="precioVenta() < f.precioCoste">
                    {{ margen(f) }}
                  </td>
                  <td class="acciones">
                    <button
                      type="button"
                      class="ja-boton-icono"
                      [attr.aria-label]="'Cambiar el coste de ' + f.proveedor.nombre"
                      (click)="editar(f)"
                    >
                      <ja-icono nombre="edit" />
                    </button>
                    <button
                      type="button"
                      class="ja-boton-icono ja-boton-icono--peligro"
                      [attr.aria-label]="'Quitar a ' + f.proveedor.nombre"
                      (click)="quitar(f)"
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
        <p class="ja-aviso-linea ja-aviso-linea--info">
          <ja-icono nombre="info" />Este producto todavía no tiene proveedores.
        </p>
      }
    } @else if (lista.error()) {
      <p class="ja-aviso-linea" role="alert">
        <ja-icono nombre="error" />No se han podido cargar los proveedores.
      </p>
    }

    <div class="nuevo">
      <div class="ja-campo">
        <label for="pp-proveedor">Proveedor</label>
        <select id="pp-proveedor" [value]="proveedorId()" (change)="proveedorId.set(valor($event))">
          <option value="">Elige un proveedor</option>
          @if (todos.hasValue()) {
            @for (p of todos.value(); track p.id) {
              <option [value]="p.id">{{ p.nombre }}</option>
            }
          }
        </select>
      </div>
      <div class="ja-campo">
        <label for="pp-coste">Coste (€)</label>
        <input
          id="pp-coste"
          type="number"
          step="0.01"
          min="0"
          inputmode="decimal"
          [value]="coste()"
          (input)="coste.set(valor($event))"
        />
      </div>
      <button
        type="button"
        class="ja-boton ja-boton--secundario"
        [disabled]="guardando()"
        (click)="asignar()"
      >
        <ja-icono nombre="add" />{{ yaEsta() ? 'Cambiar coste' : 'Añadir' }}
      </button>
    </div>
    @if (error()) {
      <p class="ja-aviso-linea" role="alert"><ja-icono nombre="error" />{{ error() }}</p>
    }
  `,
})
export class ProveedoresProducto {
  private readonly proveedores = inject(Proveedores);
  private readonly avisos = inject(Avisos);
  private readonly dialogos = inject(Dialogos);

  readonly productoId = input.required<number>();
  readonly precioVenta = input.required<number>();

  protected readonly precio = precio;
  protected readonly lista = resource({
    params: () => this.productoId(),
    loader: ({ params }) => this.proveedores.deProducto(params),
  });
  protected readonly todos = resource({ loader: () => this.proveedores.listar() });

  protected readonly proveedorId = signal('');
  protected readonly coste = signal('');
  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  /** ¿El proveedor elegido ya sirve este producto? Entonces el botón solo cambia el coste. */
  protected readonly yaEsta = computed(
    () =>
      this.lista.hasValue() &&
      this.lista.value().some((f) => String(f.proveedor.id) === this.proveedorId()),
  );

  protected valor(e: Event): string {
    return (e.target as HTMLInputElement | HTMLSelectElement).value;
  }

  /** Margen = venta − coste, en euros y en % sobre el precio de venta. */
  protected margen(f: ProveedorDeProducto): string {
    const venta = this.precioVenta();
    const euros = venta - f.precioCoste;
    const porcentaje = venta > 0 ? Math.round((euros / venta) * 100) : 0;
    return `${precio(euros)} (${porcentaje} %)`;
  }

  protected editar(f: ProveedorDeProducto): void {
    this.proveedorId.set(String(f.proveedor.id));
    this.coste.set(String(f.precioCoste));
    this.error.set('');
  }

  protected async asignar(): Promise<void> {
    this.error.set('');
    const coste = Number(this.coste());
    if (!this.proveedorId()) {
      this.error.set('Elige el proveedor.');
      return;
    }
    if (this.coste() === '' || Number.isNaN(coste) || coste < 0) {
      this.error.set('Escribe el coste: un número igual o mayor que 0.');
      return;
    }
    this.guardando.set(true);
    try {
      await this.proveedores.asignar(this.productoId(), Number(this.proveedorId()), coste);
      this.avisos.exito(this.yaEsta() ? 'Coste actualizado.' : 'Proveedor añadido.');
      this.proveedorId.set('');
      this.coste.set('');
      this.lista.reload();
    } catch (e) {
      this.error.set(mensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async quitar(f: ProveedorDeProducto): Promise<void> {
    // Se guarda al momento: como el resto de borrados del backoffice, pide confirmación
    const si = await this.dialogos.confirmar({
      titulo: `¿Quitar a ${f.proveedor.nombre} de este producto?`,
      texto: 'Se pierde su precio de coste. El proveedor no se borra: puedes volver a añadirlo.',
      aceptar: 'Quitar proveedor',
      peligro: true,
    });
    if (!si) {
      return;
    }
    try {
      await this.proveedores.quitar(this.productoId(), f.proveedor.id);
      this.avisos.exito(`${f.proveedor.nombre} ya no sirve este producto.`);
      this.lista.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }
}
