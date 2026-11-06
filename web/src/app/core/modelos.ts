// Interfaces iguales al JSON de la API (bóveda 05-API/Endpoints.md y api/src/Service/Presentador.php).
// Las mismas que usa la app de Ionic, más los campos que solo ve el backoffice (cliente, técnico, stock…).

export interface Referencia {
  id: number;
  nombre: string;
}

export type TipoProducto = 'videojuego' | 'movil' | 'consola';
export type FormatoMovil = 'movil' | 'tablet';

export interface Producto {
  id: number;
  tipo: TipoProducto;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  imagen: string | null;
  activo: boolean;
  marca: Referencia | null;
  /** Solo con token (ADR-028): la web pública no recibe el stock exacto. */
  stock?: number;
  // Videojuego
  plataforma?: Referencia | null;
  genero?: string | null;
  pegi?: number | null;
  precioAlquiler?: number | null;
  alquilable?: boolean;
  copiasAlquiler?: number;
  copiasDisponibles?: number;
  // Móvil o tablet
  formato?: FormatoMovil | null;
  pantallaPulgadas?: number | null;
  ramGb?: number | null;
  // Móvil y consola
  almacenamientoGb?: number | null;
  // Consola
  modelo?: string | null;
}

export interface ProductoCorto {
  id: number;
  tipo: TipoProducto;
  nombre: string;
  imagen: string | null;
  plataforma?: Referencia | null;
}

export interface Pagina<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export type Puesto = 'tecnico' | 'admin';

export interface Usuario {
  id: number;
  tipo: 'cliente' | 'trabajador';
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  dni: string | null;
  foto: string | null;
  puesto: Puesto | null;
  departamentoId: number | null;
  departamento: Referencia | null;
}

export interface Trabajador extends Usuario {
  /** Solo técnicos: reparaciones sin entregar ni cancelar. */
  reparacionesAbiertas: number | null;
}

export interface LoginRespuesta {
  token: string;
  expira: string;
  usuario: Usuario;
}

export interface Compra {
  id: number;
  producto: ProductoCorto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export type EstadoAlquiler = 'activo' | 'retrasado' | 'devuelto' | 'cancelado';

export interface Alquiler {
  id: number;
  videojuego: ProductoCorto;
  precioDia: number;
  dias: number;
  subtotal: number;
  fechaInicio: string;
  fechaFin: string;
  fechaDevolucion: string | null;
  estado: EstadoAlquiler;
  pedidoId?: number;
  clienteId?: number;
}

export type EstadoPedido = 'pendiente' | 'preparado' | 'entregado' | 'cancelado';

export interface ClienteCorto {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
}

export interface Pedido {
  id: number;
  fecha: string;
  estado: EstadoPedido;
  metodoPago: string;
  entrega: 'tienda' | 'domicilio';
  direccionEntrega: string | null;
  latitudEntrega: number | null;
  longitudEntrega: number | null;
  cliente: ClienteCorto;
  compras: Compra[];
  alquileres: Alquiler[];
  total: number;
}

export type EstadoReparacion = 'recibida' | 'en_reparacion' | 'lista' | 'entregada' | 'cancelada';

export interface Reparacion {
  id: number;
  dispositivo: string;
  problema: string;
  estado: EstadoReparacion;
  fechaEntrada: string;
  fechaSalida: string | null;
  presupuesto: number | null;
  foto: string | null;
  departamento: Referencia | null;
  tecnico: { id: number; nombre: string; apellidos: string };
  cliente: ClienteCorto;
}

export interface FotoTienda {
  id: number;
  tiendaId: number | null;
  imagen: string;
  descripcion: string | null;
}

export interface Tienda {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  historia: string | null;
  fotos?: FotoTienda[];
}

export type LineaServicio = 'videojuegos' | 'consolas' | 'telefonia';

export interface Servicio {
  id: number;
  linea: LineaServicio;
  nombre: string;
  descripcion: string | null;
  precioOrientativo: number | null;
}

export interface RegistroUbicacion {
  id: number;
  fecha: string;
  latitud: number;
  longitud: number;
  metodo: string;
  ruta: string;
  usuario: { id: number; email: string; nombre: string; tipo: 'cliente' | 'trabajador' };
}

export interface ImagenSubida {
  ruta: string;
  url: string;
}

// Proveedores (ADR-042): solo el admin. El precio de coste no sale nunca en el catálogo.
export interface Proveedor {
  id: number;
  nombre: string;
  cif: string;
  telefono: string;
  email: string;
  direccion: string | null;
  /** Cuántos productos sirve (en la lista y en la ficha). */
  numProductos?: number;
}

/** Un proveedor de un producto, con lo que le cuesta a la tienda (GET /productos/{id}/proveedores). */
export interface ProveedorDeProducto {
  id: number;
  proveedor: Referencia;
  precioCoste: number;
}

/** Un producto de un proveedor (GET /proveedores/{id}). */
export interface ProductoDeProveedor {
  id: number;
  producto: ProductoCorto & { precio: number };
  precioCoste: number;
}

export interface ProveedorConProductos extends Proveedor {
  productos: ProductoDeProveedor[];
}
