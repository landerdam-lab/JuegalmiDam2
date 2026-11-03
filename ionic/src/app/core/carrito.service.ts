import { Injectable, computed, signal } from '@angular/core';

import type { LineaPeticion, Producto } from './modelos';

const CLAVE = 'carrito';

export interface LineaCarrito {
  tipo: 'compra' | 'alquiler';
  producto: Producto;
  cantidad: number;
  dias: number;
}

export function subtotal(l: LineaCarrito): number {
  return l.tipo === 'alquiler' ? (l.producto.precioAlquiler ?? 0) * l.dias : l.producto.precio * l.cantidad;
}

/**
 * Carrito local (Local Storage + signal): sobrevive a cerrar la app y las páginas se actualizan solas.
 * Los precios son orientativos: el total de verdad lo calcula la API al crear el pedido.
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly datos = signal<LineaCarrito[]>(this.leer());

  readonly lineas = this.datos.asReadonly();
  readonly unidades = computed(() => this.datos().reduce((n, l) => n + (l.tipo === 'compra' ? l.cantidad : 1), 0));
  readonly total = computed(() => this.datos().reduce((t, l) => t + subtotal(l), 0));

  comprar(p: Producto, cantidad = 1): void {
    const lineas = [...this.datos()];
    const i = lineas.findIndex((l) => l.tipo === 'compra' && l.producto.id === p.id);
    if (i >= 0) {
      lineas[i] = { ...lineas[i], cantidad: Math.min(lineas[i].cantidad + cantidad, Math.max(p.stock, 1)) };
    } else {
      lineas.push({ tipo: 'compra', producto: p, cantidad, dias: 0 });
    }
    this.guardar(lineas);
  }

  alquilar(p: Producto, dias: number): void {
    const lineas = [...this.datos()];
    const i = lineas.findIndex((l) => l.tipo === 'alquiler' && l.producto.id === p.id);
    if (i >= 0) {
      lineas[i] = { ...lineas[i], dias };
    } else {
      lineas.push({ tipo: 'alquiler', producto: p, cantidad: 1, dias });
    }
    this.guardar(lineas);
  }

  cambiarCantidad(linea: LineaCarrito, cantidad: number): void {
    this.guardar(this.datos().map((l) => (l === linea ? { ...l, cantidad } : l)));
  }

  quitar(linea: LineaCarrito): number {
    const posicion = this.datos().indexOf(linea);
    this.guardar(this.datos().filter((l) => l !== linea));
    return posicion;
  }

  reponer(linea: LineaCarrito, posicion: number): void {
    const lineas = [...this.datos()];
    lineas.splice(Math.min(posicion, lineas.length), 0, linea);
    this.guardar(lineas);
  }

  vaciar(): void {
    this.guardar([]);
  }

  paraLaApi(): LineaPeticion[] {
    return this.datos().map((l) =>
      l.tipo === 'compra'
        ? { productoId: l.producto.id, tipo: 'compra', cantidad: l.cantidad }
        : { productoId: l.producto.id, tipo: 'alquiler', dias: l.dias },
    );
  }

  private guardar(lineas: LineaCarrito[]): void {
    this.datos.set(lineas);
    localStorage.setItem(CLAVE, JSON.stringify(lineas));
  }

  private leer(): LineaCarrito[] {
    try {
      return JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    } catch {
      return [];
    }
  }
}
