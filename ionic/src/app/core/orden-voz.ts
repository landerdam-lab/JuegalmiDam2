/** Interpreta una frase dicha en voz alta. Función pura y con pruebas: lo mismo que OrdenVoz en Android. */
export type Accion =
  | 'inicio' | 'carrito' | 'pedidos' | 'alquileres' | 'reparaciones' | 'nueva_reparacion' | 'perfil'
  | 'tienda' | 'servicios' | 'ubicacion' | 'galeria' | 'historia'
  | 'videojuegos' | 'moviles' | 'consolas' | 'buscar';

export interface OrdenVoz {
  accion: Accion;
  texto?: string;
}

const BUSCAR = /^(?:busca|buscar|buscame|encuentra)\s+(?:el |la |los |las |un |una )?(.+)$/;

// El orden importa: lo más concreto primero («nueva reparacion» antes que «reparacion»)
const REGLAS: [Accion, string[]][] = [
  ['nueva_reparacion', ['nueva reparacion', 'pedir reparacion', 'solicitar reparacion', 'reparar', 'arreglar']],
  ['carrito', ['carrito', 'cesta']],
  ['pedidos', ['mis pedidos', 'pedidos', 'mi pedido']],
  ['alquileres', ['alquiler', 'alquileres', 'alquilado']],
  ['reparaciones', ['reparacion', 'reparaciones']],
  ['perfil', ['perfil', 'mi cuenta', 'mis datos']],
  ['ubicacion', ['como llegar', 'llevame', 'ubicacion', 'mapa', 'donde esta']],
  ['servicios', ['servicios', 'servicio']],
  ['galeria', ['galeria', 'fotos']],
  ['historia', ['historia', 'quienes sois', 'quienes somos']],
  ['tienda', ['tienda']],
  ['inicio', ['inicio', 'catalogo', 'portada']],
  ['moviles', ['moviles', 'movil', 'tablets', 'tablet', 'telefonos']],
  ['consolas', ['consolas', 'consola']],
  ['videojuegos', ['videojuegos', 'juegos']],
];

export function normalizar(frase: string): string {
  return frase
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function interpretar(frase: string): OrdenVoz {
  const f = normalizar(frase);
  const busqueda = BUSCAR.exec(f);
  if (busqueda) {
    // «busca …» siempre es una búsqueda, aunque el juego se llame como una sección
    return { accion: 'buscar', texto: busqueda[1].trim() };
  }
  const rodeada = ` ${f} `;
  for (const [accion, expresiones] of REGLAS) {
    if (expresiones.some((e) => rodeada.includes(` ${e} `))) {
      return { accion };
    }
  }
  return { accion: 'buscar', texto: f };
}
