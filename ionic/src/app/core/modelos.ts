// Interfaces iguales al JSON de la API (05-API/Endpoints.md). Camel case, como la API.
export interface Referencia {
  id: number;
  nombre: string;
}

export type TipoProducto = 'videojuego' | 'movil' | 'consola';

export interface Producto {
  id: number;
  tipo: TipoProducto;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  imagen: string | null;
  marca: Referencia | null;
  stock: number;
  // Videojuego
  plataforma?: Referencia | null;
  genero?: string | null;
  pegi?: number | null;
  precioAlquiler?: number | null;
  alquilable?: boolean;
  copiasAlquiler?: number | null;
  copiasDisponibles?: number | null;
  // Móvil o tablet
  formato?: 'movil' | 'tablet' | null;
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
  pedidoId: number;
}

export type EstadoPedido = 'pendiente' | 'preparado' | 'entregado' | 'cancelado';

export interface Pedido {
  id: number;
  fecha: string;
  estado: EstadoPedido;
  metodoPago: string;
  entrega: 'tienda' | 'domicilio';
  direccionEntrega: string | null;
  latitudEntrega: number | null;
  longitudEntrega: number | null;
  compras: Compra[];
  alquileres: Alquiler[];
  total: number;
}

export interface LineaPeticion {
  productoId: number;
  tipo: 'compra' | 'alquiler';
  cantidad?: number;
  dias?: number;
}

export interface Entrega {
  entrega: 'tienda' | 'domicilio';
  direccionEntrega?: string;
  latitudEntrega?: number;
  longitudEntrega?: number;
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
}

export interface FotoTienda {
  id: number;
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
}

export interface Servicio {
  id: number;
  linea: 'videojuegos' | 'consolas' | 'telefonia';
  nombre: string;
  descripcion: string | null;
  precioOrientativo: number | null;
}
