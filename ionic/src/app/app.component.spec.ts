import { describe, expect, it } from 'vitest';

import { subtotal } from './core/carrito.service';
import { precio, referenciaPedido } from './core/formato';
import type { Producto } from './core/modelos';

describe('precios del carrito', () => {
  const juego = { id: 1, precio: 59.99, precioAlquiler: 2.5 } as Producto;

  it('una compra multiplica por la cantidad y un alquiler por los días', () => {
    expect(subtotal({ tipo: 'compra', producto: juego, cantidad: 2, dias: 0 })).toBeCloseTo(119.98);
    expect(subtotal({ tipo: 'alquiler', producto: juego, cantidad: 1, dias: 7 })).toBeCloseTo(17.5);
  });

  it('formatea como en Android', () => {
    expect(referenciaPedido(7)).toBe('#PED-0007');
    expect(precio(59.99).replace(/\s/g, ' ')).toBe('59,99 €');
  });
});
