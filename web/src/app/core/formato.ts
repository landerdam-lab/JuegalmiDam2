// Formatos de pantalla (los mismos que la app de Ionic): precios, fechas y referencias.
import type {
  EstadoAlquiler,
  EstadoPedido,
  EstadoReparacion,
  LineaServicio,
  Producto,
  TipoProducto,
} from './modelos';

const ES = 'es-ES';
const PRECIO = new Intl.NumberFormat(ES, { style: 'currency', currency: 'EUR' });
const FECHA_HORA = new Intl.DateTimeFormat(ES, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const FECHA_LARGA = new Intl.DateTimeFormat(ES, { day: 'numeric', month: 'long', year: 'numeric' });

export function precio(importe: number | null | undefined): string {
  return PRECIO.format(importe ?? 0);
}

export function decimal(valor: number, decimales = 1): string {
  return new Intl.NumberFormat(ES, { maximumFractionDigits: decimales }).format(valor);
}

export function fechaHora(iso: string): string {
  return FECHA_HORA.format(new Date(iso));
}

export function fechaLarga(iso: string): string {
  return FECHA_LARGA.format(new Date(iso));
}

/** dd/MM/yyyy de una fecha ISO (se usa la parte de la fecha, sin cambios de zona). */
export function fecha(dia: string): string {
  const [a, m, d] = dia.substring(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** Días que faltan hasta una fecha (negativo si ya pasó). */
export function diasHasta(dia: string, hoy = new Date()): number {
  const [a, m, d] = dia.substring(0, 10).split('-').map(Number);
  const inicioHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((Date.UTC(a, m - 1, d) - inicioHoy) / 86400000);
}

/** Hoy en AAAA-MM-DD, para los filtros de fecha. */
export function hoyIso(hoy = new Date()): string {
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${m}-${d}`;
}

export function referenciaPedido(id: number): string {
  return `#PED-${String(id).padStart(4, '0')}`;
}

export function referenciaReparacion(id: number): string {
  return `#REP-${String(id).padStart(4, '0')}`;
}

export function coordenada(valor: number): string {
  return valor.toFixed(5);
}

const METODOS: Record<string, string> = {
  tarjeta: 'Tarjeta',
  bizum: 'Bizum',
  paypal: 'PayPal',
  en_tienda: 'En tienda',
};

export function metodoPago(metodo: string): string {
  return METODOS[metodo] ?? metodo;
}

// ── Textos de los enumerados (los valores son idénticos en BBDD, API y apps) ──

export const TIPOS: Record<TipoProducto, { singular: string; plural: string; icono: string }> = {
  videojuego: { singular: 'Videojuego', plural: 'Videojuegos', icono: 'sports_esports' },
  movil: { singular: 'Móvil o tablet', plural: 'Móviles y tablets', icono: 'smartphone' },
  consola: { singular: 'Consola', plural: 'Consolas', icono: 'videogame_asset' },
};

export const LINEAS: Record<LineaServicio, { nombre: string; icono: string }> = {
  videojuegos: { nombre: 'Videojuegos', icono: 'sports_esports' },
  consolas: { nombre: 'Consolas', icono: 'videogame_asset' },
  telefonia: { nombre: 'Telefonía', icono: 'smartphone' },
};

/** Estado de un pedido: texto, icono y cuántos segmentos de la barra de vida (3) se llenan. */
export const ESTADOS_PEDIDO: Record<EstadoPedido, { texto: string; icono: string; paso: number }> =
  {
    pendiente: { texto: 'Pendiente', icono: 'schedule', paso: 1 },
    preparado: { texto: 'Preparado', icono: 'inventory_2', paso: 2 },
    entregado: { texto: 'Entregado', icono: 'check_circle', paso: 3 },
    cancelado: { texto: 'Cancelado', icono: 'cancel', paso: 0 },
  };

/** Estado de una reparación: texto, icono y segmentos de la barra de vida (4). */
export const ESTADOS_REPARACION: Record<
  EstadoReparacion,
  { texto: string; icono: string; paso: number }
> = {
  recibida: { texto: 'Recibida', icono: 'inventory_2', paso: 1 },
  en_reparacion: { texto: 'En reparación', icono: 'build', paso: 2 },
  lista: { texto: 'Lista para recoger', icono: 'check', paso: 3 },
  entregada: { texto: 'Entregada', icono: 'check_circle', paso: 4 },
  cancelada: { texto: 'Cancelada', icono: 'cancel', paso: 0 },
};

export const ESTADOS_ALQUILER: Record<EstadoAlquiler, { texto: string; icono: string }> = {
  activo: { texto: 'Activo', icono: 'event' },
  retrasado: { texto: 'Retrasado', icono: 'warning' },
  devuelto: { texto: 'Devuelto', icono: 'assignment_return' },
  cancelado: { texto: 'Cancelado', icono: 'cancel' },
};

/** Siguientes estados permitidos (los mismos que comprueba la API, ADR-015). */
export const SIGUIENTE_PEDIDO: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ['preparado', 'cancelado'],
  preparado: ['entregado'],
  entregado: [],
  cancelado: [],
};

export const SIGUIENTE_REPARACION: Record<EstadoReparacion, EstadoReparacion[]> = {
  recibida: ['en_reparacion', 'cancelada'],
  en_reparacion: ['lista', 'cancelada'],
  lista: ['entregada'],
  entregada: [],
  cancelada: [],
};

/** Línea secundaria de una tarjeta: «Nintendo · Switch 2» o «Samsung · Tablet». */
export function subtituloProducto(p: Producto): string {
  const partes = [p.marca?.nombre];
  if (p.tipo === 'videojuego') {
    partes.push(p.plataforma?.nombre);
  } else if (p.tipo === 'movil') {
    partes.push(p.formato === 'tablet' ? 'Tablet' : 'Móvil');
  } else {
    partes.push(p.modelo ?? undefined);
  }
  return partes.filter(Boolean).join(' · ');
}

/** «1 día» / «3 días»: número + palabra en singular o plural. */
export function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
