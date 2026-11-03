import { describe, expect, it } from 'vitest';

import { interpretar } from './orden-voz';

describe('interpretar órdenes de voz', () => {
  it('abre secciones aunque la frase lleve más palabras o tildes', () => {
    expect(interpretar('Abre el carrito').accion).toBe('carrito');
    expect(interpretar('quiero ver mis pedidos').accion).toBe('pedidos');
    expect(interpretar('llévame a la tienda').accion).toBe('ubicacion');
    expect(interpretar('la galería').accion).toBe('galeria');
  });

  it('lo más concreto va primero', () => {
    expect(interpretar('nueva reparación').accion).toBe('nueva_reparacion');
    expect(interpretar('mis reparaciones').accion).toBe('reparaciones');
  });

  it('«busca» siempre busca, aunque coincida con una sección', () => {
    expect(interpretar('busca el carrito de Mario')).toEqual({ accion: 'buscar', texto: 'carrito de mario' });
  });

  it('lo que no entiende lo busca en el catálogo', () => {
    expect(interpretar('Zelda')).toEqual({ accion: 'buscar', texto: 'zelda' });
  });
});
