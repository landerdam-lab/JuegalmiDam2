import {
  Component,
  computed,
  inject,
  input,
  numberAttribute,
  resource,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { Catalogo, type FiltrosCatalogo, type Orden } from '../core/catalogo';
import { TIPOS } from '../core/formato';
import type { TipoProducto } from '../core/modelos';
import { EstadoVista } from '../shared/estado-vista';
import { Icono } from '../shared/icono';
import { Paginador } from '../shared/paginador';
import { TarjetaProducto } from '../shared/tarjeta-producto';

const POR_PAGINA = 12;
const TIPOS_VALIDOS: TipoProducto[] = ['videojuego', 'movil', 'consola'];

/** Convierte el ?tipo= de la URL en un tipo válido (por defecto, videojuegos). */
function tipoAttr(valor: unknown): TipoProducto {
  return TIPOS_VALIDOS.includes(valor as TipoProducto) ? (valor as TipoProducto) : 'videojuego';
}
function numeroONull(valor: unknown): number | null {
  const n = numberAttribute(valor, NaN);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * PW-02 Catálogo público (sin login, ADR-028): pestañas Videojuegos · Móviles y tablets · Consolas,
 * buscador, filtros y orden. Sin comprar: eso se hace en la app.
 * El estado de los filtros vive en la URL (?tipo=consola&marca=3…): se puede compartir el enlace,
 * y «atrás» en el navegador deshace el último filtro. Los parámetros llegan como input()
 * gracias a withComponentInputBinding().
 */
@Component({
  selector: 'ja-catalogo-publico',
  imports: [EstadoVista, Icono, Paginador, TarjetaProducto],
  styleUrl: './catalogo.scss',
  templateUrl: './catalogo.html',
})
export class CatalogoPublico {
  private readonly catalogo = inject(Catalogo);
  private readonly router = inject(Router);

  // ── Parámetros de la URL ──
  readonly tipo = input(tipoAttr('videojuego'), { transform: tipoAttr });
  readonly q = input('', { transform: (v: unknown) => (typeof v === 'string' ? v : '') });
  readonly marca = input(null, { transform: numeroONull });
  readonly plataforma = input(null, { transform: numeroONull });
  readonly pegi = input(null, { transform: numeroONull });
  readonly genero = input('', { transform: (v: unknown) => (typeof v === 'string' ? v : '') });
  readonly formato = input('', {
    transform: (v: unknown) => (v === 'movil' || v === 'tablet' ? v : ''),
  });
  readonly alquilable = input(false, {
    transform: (v: unknown) => v === '1' || v === 1 || v === true,
  });
  readonly orden = input<Orden>('nombre', {
    transform: (v: unknown) => (v === 'precio_asc' || v === 'precio_desc' ? v : 'nombre'),
  });
  readonly page = input(1, { transform: (v: unknown) => numeroONull(v) ?? 1 });

  protected readonly tipos = TIPOS;
  protected readonly listaTipos = TIPOS_VALIDOS;
  protected readonly edadesPegi = [3, 7, 12, 16, 18];
  protected readonly filtrosAbiertos = signal(false);

  /** Lo que se pide a la API: se recalcula (y se vuelve a pedir) cuando cambia la URL. */
  private readonly filtros = computed<FiltrosCatalogo>(() => {
    const f: FiltrosCatalogo = {
      q: this.q(),
      orden: this.orden(),
      page: this.page(),
      limit: POR_PAGINA,
    };
    if (this.tipo() === 'videojuego') {
      Object.assign(f, {
        plataforma: this.plataforma(),
        genero: this.genero(),
        pegi: this.pegi(),
        alquilable: this.alquilable() || undefined,
      });
    } else {
      Object.assign(f, {
        marca: this.marca(),
        formato: this.tipo() === 'movil' ? this.formato() : '',
      });
    }
    return f;
  });

  protected readonly productos = resource({
    params: () => ({ tipo: this.tipo(), filtros: this.filtros() }),
    loader: ({ params }) => this.catalogo.listar(params.tipo, params.filtros),
  });

  // Listas para los filtros (pequeñas y sin paginar)
  protected readonly marcas = resource({ loader: () => this.catalogo.marcas() });
  protected readonly plataformas = resource({ loader: () => this.catalogo.plataformas() });
  protected readonly generos = resource({ loader: () => this.catalogo.generos() });

  protected readonly hayFiltros = computed(
    () =>
      !!this.q() ||
      (this.tipo() === 'videojuego'
        ? !!(this.plataforma() || this.genero() || this.pegi() || this.alquilable())
        : !!(this.marca() || this.formato())),
  );

  private temporizador?: ReturnType<typeof setTimeout>;

  /** Cambia uno o varios filtros en la URL y vuelve a la página 1. */
  protected filtrar(cambios: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      queryParams: { ...cambios, page: null },
      queryParamsHandling: 'merge',
      replaceUrl: 'q' in cambios, // escribir en el buscador no llena el historial
    });
  }

  /** El buscador espera 300 ms sin teclear antes de pedir (menos peticiones, CPU mínima). */
  protected buscar(texto: string): void {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.filtrar({ q: texto.trim() || null }), 300);
  }

  protected cambiarTipo(tipo: TipoProducto): void {
    void this.router.navigate([], { queryParams: { tipo, q: this.q() || null } });
  }

  protected limpiar(): void {
    void this.router.navigate([], { queryParams: { tipo: this.tipo() } });
  }

  protected irAPagina(page: number): void {
    void this.router.navigate([], { queryParams: { page }, queryParamsHandling: 'merge' });
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
