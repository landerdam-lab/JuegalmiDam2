import {
  diasHasta,
  fecha,
  hoyIso,
  plural,
  precio,
  referenciaPedido,
  referenciaReparacion,
  SIGUIENTE_PEDIDO,
  SIGUIENTE_REPARACION,
  subtituloProducto,
} from './formato';
import type { Producto } from './modelos';

// Pruebas de los formatos de pantalla: son funciones puras, se prueban sin Angular.
describe('formato', () => {
  it('escribe los precios en euros con coma decimal', () => {
    // Intl usa un espacio duro antes del €: se normaliza para comparar
    expect(precio(59.99).replace(/\s/g, ' ')).toBe('59,99 €');
    expect(precio(null).replace(/\s/g, ' ')).toBe('0,00 €');
  });

  it('convierte una fecha ISO en dd/MM/yyyy sin cambiar de día por la zona horaria', () => {
    expect(fecha('2026-11-04')).toBe('04/11/2026');
    expect(fecha('2026-11-04T23:30:00+00:00')).toBe('04/11/2026');
  });

  it('cuenta los días que faltan (o que han pasado) hasta una fecha', () => {
    const hoy = new Date(2026, 10, 4);
    expect(diasHasta('2026-11-07', hoy)).toBe(3);
    expect(diasHasta('2026-11-04', hoy)).toBe(0);
    expect(diasHasta('2026-11-01', hoy)).toBe(-3);
  });

  it('da la fecha de hoy en AAAA-MM-DD para los filtros', () => {
    expect(hoyIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('forma las referencias de pedido y reparación con 4 cifras', () => {
    expect(referenciaPedido(7)).toBe('#PED-0007');
    expect(referenciaReparacion(123)).toBe('#REP-0123');
  });

  it('elige singular o plural', () => {
    expect(plural(1, 'día', 'días')).toBe('1 día');
    expect(plural(4, 'día', 'días')).toBe('4 días');
  });

  it('solo permite los cambios de estado de ADR-015 (los mismos que la API)', () => {
    expect(SIGUIENTE_PEDIDO.pendiente).toEqual(['preparado', 'cancelado']);
    expect(SIGUIENTE_PEDIDO.entregado).toEqual([]);
    expect(SIGUIENTE_REPARACION.en_reparacion).toEqual(['lista', 'cancelada']);
    expect(SIGUIENTE_REPARACION.lista).toEqual(['entregada']);
  });

  it('compone la línea secundaria de la tarjeta según el tipo de producto', () => {
    const base = { marca: { id: 1, nombre: 'Nintendo' } } as Producto;
    expect(
      subtituloProducto({ ...base, tipo: 'videojuego', plataforma: { id: 3, nombre: 'Switch 2' } }),
    ).toBe('Nintendo · Switch 2');
    expect(subtituloProducto({ ...base, tipo: 'movil', formato: 'tablet' })).toBe(
      'Nintendo · Tablet',
    );
    expect(subtituloProducto({ ...base, tipo: 'consola', modelo: null })).toBe('Nintendo');
  });
});
