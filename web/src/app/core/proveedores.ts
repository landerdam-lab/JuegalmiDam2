import { Service, inject } from '@angular/core';

import { Api } from './api';
import type { Proveedor, ProveedorConProductos, ProveedorDeProducto } from './modelos';

export interface DatosProveedor {
  nombre: string;
  cif: string;
  telefono: string;
  email: string;
  direccion: string | null;
}

/**
 * Proveedores y su precio de coste por producto (PW-19, ADR-042). Solo admin: la API da 403 a
 * cualquier otro usuario. Un DELETE de un proveedor que sirve productos da 409 EN_USO.
 */
@Service()
export class Proveedores {
  private readonly api = inject(Api);

  listar(): Promise<Proveedor[]> {
    return this.api.get<Proveedor[]>('proveedores');
  }

  ver(id: number): Promise<ProveedorConProductos> {
    return this.api.get<ProveedorConProductos>(`proveedores/${id}`);
  }

  guardar(datos: DatosProveedor, id?: number): Promise<Proveedor> {
    return id
      ? this.api.put<Proveedor>(`proveedores/${id}`, datos)
      : this.api.post<Proveedor>('proveedores', datos);
  }

  borrar(id: number): Promise<unknown> {
    return this.api.delete(`proveedores/${id}`);
  }

  // Proveedores de un producto (la ficha del producto, PW-11)

  deProducto(productoId: number): Promise<ProveedorDeProducto[]> {
    return this.api.get<ProveedorDeProducto[]>(`productos/${productoId}/proveedores`);
  }

  /** Lo añade si el proveedor no servía el producto, o le cambia el precio (PUT idempotente). */
  asignar(
    productoId: number,
    proveedorId: number,
    precioCoste: number,
  ): Promise<ProveedorDeProducto> {
    return this.api.put<ProveedorDeProducto>(`productos/${productoId}/proveedores/${proveedorId}`, {
      precioCoste,
    });
  }

  quitar(productoId: number, proveedorId: number): Promise<unknown> {
    return this.api.delete(`productos/${productoId}/proveedores/${proveedorId}`);
  }
}
