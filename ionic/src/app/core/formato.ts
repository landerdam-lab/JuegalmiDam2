const ES = 'es-ES';
const PRECIO = new Intl.NumberFormat(ES, { style: 'currency', currency: 'EUR' });
const FECHA_HORA = new Intl.DateTimeFormat(ES, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function precio(importe: number | null | undefined): string {
  return PRECIO.format(importe ?? 0);
}

export function decimal(valor: number): string {
  return new Intl.NumberFormat(ES, { maximumFractionDigits: 1 }).format(valor);
}

export function fechaHora(iso: string): string {
  return FECHA_HORA.format(new Date(iso));
}

/** dd/MM/yyyy de una fecha ISO (se usa la parte de la fecha, sin cambios de zona). */
export function fecha(dia: string): string {
  const [a, m, d] = dia.substring(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function fechaCorta(dia: string): string {
  return fecha(dia).substring(0, 5);
}

export function diasHasta(dia: string, hoy = new Date()): number {
  const [a, m, d] = dia.substring(0, 10).split('-').map(Number);
  const inicioHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((Date.UTC(a, m - 1, d) - inicioHoy) / 86400000);
}

export function dentroDe(dias: number, hoy = new Date()): string {
  const f = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + dias);
  return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`;
}

export function referenciaPedido(id: number): string {
  return `#PED-${String(id).padStart(4, '0')}`;
}

export function referenciaReparacion(id: number): string {
  return `#REP-${String(id).padStart(4, '0')}`;
}

const METODOS: Record<string, string> = { tarjeta: 'Tarjeta', bizum: 'Bizum', paypal: 'PayPal', en_tienda: 'En tienda' };

export function metodoPago(metodo: string): string {
  return METODOS[metodo] ?? metodo;
}
