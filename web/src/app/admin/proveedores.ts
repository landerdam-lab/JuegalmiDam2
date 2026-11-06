import { Component, inject, resource, signal } from '@angular/core';
import { email, form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { ApiError } from '../core/api-error';
import { Avisos } from '../core/avisos';
import { precio } from '../core/formato';
import type { Proveedor, ProveedorConProductos } from '../core/modelos';
import { type DatosProveedor, Proveedores } from '../core/proveedores';
import { Dialogos } from '../shared/dialogos';
import { ErrorCampo } from '../shared/error-campo';
import { EstadoVista } from '../shared/estado-vista';
import { Hoja } from '../shared/hoja';
import { Icono } from '../shared/icono';
import { Imagen } from '../shared/imagen';
import { estaEnUso, mensajeError } from './errores';

interface ModeloProveedor {
  nombre: string;
  cif: string;
  telefono: string;
  email: string;
  direccion: string;
}

const VACIO: ModeloProveedor = { nombre: '', cif: '', telefono: '', email: '', direccion: '' };

/** El mismo formato que comprueba la API (y un CHECK de la BBDD): letra, 7 cifras y control. */
const CIF = /^[A-Za-z][0-9]{7}[0-9A-Ja-j]$/;

/**
 * PW-19 Proveedores (ADR-042): a quién compra la tienda la mercancía. Alta, edición y borrado
 * (409 si sirve productos), y la ficha con los productos que sirve, su coste y el margen.
 * Qué proveedores tiene cada producto se cambia en la ficha del producto (PW-11).
 */
@Component({
  selector: 'ja-proveedores',
  imports: [FormField, FormRoot, RouterLink, ErrorCampo, EstadoVista, Hoja, Icono, Imagen],
  templateUrl: './proveedores.html',
  styles: `
    .venta {
      display: block;
    }
  `,
})
export class ProveedoresAdmin {
  private readonly proveedores = inject(Proveedores);
  private readonly avisos = inject(Avisos);
  private readonly dialogos = inject(Dialogos);

  protected readonly precio = precio;
  protected readonly lista = resource({ loader: () => this.proveedores.listar() });

  // ── Hoja de alta / edición ──
  protected readonly hojaAbierta = signal(false);
  protected readonly editando = signal<Proveedor | null>(null);
  protected readonly error = signal('');
  private readonly modelo = signal<ModeloProveedor>({ ...VACIO });

  // ── Hoja con los productos de un proveedor ──
  protected readonly fichaAbierta = signal(false);
  protected readonly ficha = signal<ProveedorConProductos | null>(null);

  protected readonly formulario = form(
    this.modelo,
    (c) => {
      required(c.nombre, { message: 'Escribe el nombre de la empresa.' });
      required(c.cif, { message: 'Escribe el CIF.' });
      pattern(c.cif, CIF, {
        message: 'El CIF es una letra, 7 cifras y una cifra o letra de control (p. ej. B12345678).',
      });
      required(c.telefono, { message: 'Escribe un teléfono de contacto.' });
      required(c.email, { message: 'Escribe el email de pedidos.' });
      email(c.email, { message: 'Ese email no es válido: revisa que tenga @ y dominio.' });
    },
    {
      submission: {
        action: async (f) => {
          this.error.set('');
          const m = f().value();
          const datos: DatosProveedor = {
            nombre: m.nombre.trim(),
            cif: m.cif.trim(),
            telefono: m.telefono.trim(),
            email: m.email.trim(),
            direccion: m.direccion.trim() || null,
          };
          try {
            await this.proveedores.guardar(datos, this.editando()?.id);
            this.avisos.exito(`${datos.nombre} guardado.`);
            this.hojaAbierta.set(false);
            this.lista.reload();
            return undefined;
          } catch (e) {
            const err = ApiError.de(e);
            this.error.set(mensajeError(e));
            return Object.entries(err.campos)
              .filter(([campo]) => campo in VACIO)
              .map(([campo, message]) => ({
                kind: 'servidor',
                message,
                fieldTree: f[campo as keyof ModeloProveedor],
              }));
          }
        },
      },
    },
  );

  protected nuevo(): void {
    this.editando.set(null);
    this.modelo.set({ ...VACIO });
    this.formulario().reset();
    this.error.set('');
    this.hojaAbierta.set(true);
  }

  protected editar(p: Proveedor): void {
    this.editando.set(p);
    this.modelo.set({
      nombre: p.nombre,
      cif: p.cif,
      telefono: p.telefono,
      email: p.email,
      direccion: p.direccion ?? '',
    });
    this.formulario().reset();
    this.error.set('');
    this.hojaAbierta.set(true);
  }

  protected async verProductos(p: Proveedor): Promise<void> {
    try {
      this.ficha.set(await this.proveedores.ver(p.id));
      this.fichaAbierta.set(true);
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }

  /** Margen = venta − coste, en euros y en % sobre el precio de venta. */
  protected margen(venta: number, coste: number): string {
    const porcentaje = venta > 0 ? Math.round(((venta - coste) / venta) * 100) : 0;
    return `${precio(venta - coste)} (${porcentaje} %)`;
  }

  protected async borrar(p: Proveedor): Promise<void> {
    const si = await this.dialogos.confirmar({
      titulo: `¿Borrar a ${p.nombre}?`,
      texto:
        'Si todavía sirve algún producto no se podrá: quítaselo antes desde la ficha del producto.',
      aceptar: 'Borrar',
      peligro: true,
    });
    if (!si) {
      return;
    }
    try {
      await this.proveedores.borrar(p.id);
      this.avisos.exito('Proveedor borrado.');
      this.lista.reload();
    } catch (e) {
      this.avisos.error(
        estaEnUso(e)
          ? `${p.nombre} sirve ${p.numProductos ?? 'algunos'} productos: quítaselos antes de borrarlo.`
          : mensajeError(e),
      );
    }
  }
}
