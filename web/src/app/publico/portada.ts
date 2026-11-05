import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';

import { environment } from '../../environments/environment';
import { Catalogo } from '../core/catalogo';
import { ESTADOS_REPARACION, LINEAS, precio } from '../core/formato';
import type { EstadoReparacion, Producto, TipoProducto } from '../core/modelos';
import { Tiendas } from '../core/tiendas';
import { EstadoVista } from '../shared/estado-vista';
import { Icono } from '../shared/icono';
import { Imagen } from '../shared/imagen';
import { Logo } from '../shared/logo';
import { Mapa } from '../shared/mapa';
import { TarjetaProducto } from '../shared/tarjeta-producto';
import { Vida } from '../shared/vida';

interface Cartucho {
  tipo: TipoProducto;
  titulo: string;
  icono: string;
  texto: string;
}

/**
 * PW-01 Portada (publicidad, RF-18): «Inserta el cartucho». Hero con el mostrador y un cartucho en
 * primer plano; las tres líneas de negocio como cartuchos (cartucho, tarjeta SD y SIM comparten la
 * muesca, DESIGN.md §1) que encajan al bajar; el taller como escena oscura con la barra de vida
 * ligada al scroll; la fachada y la app. Los datos salen de la API (A-29); las imágenes de
 * public/portada son solo ambientación. Toda la animación es CSS (portada.scss): este archivo
 * no tiene lógica de movimiento.
 */
@Component({
  selector: 'ja-portada',
  imports: [RouterLink, EstadoVista, Icono, Imagen, Logo, Mapa, TarjetaProducto, Vida],
  styleUrls: ['./portada.scss', './portada-movimiento.scss'],
  templateUrl: './portada.html',
})
export class Portada {
  private readonly catalogo = inject(Catalogo);
  private readonly tiendas = inject(Tiendas);

  protected readonly apkUrl = environment.apkUrl;
  protected readonly precio = precio;
  protected readonly lineas = LINEAS;

  // Las peticiones salen a la vez (cada resource carga en paralelo): la portada no espera a una para pedir otra
  protected readonly juegos = resource({
    loader: () => this.catalogo.listar('videojuego', { alquilable: true, limit: 4 }),
  });
  protected readonly consolas = resource({
    loader: () => this.catalogo.listar('consola', { limit: 2 }),
  });
  protected readonly moviles = resource({
    loader: () => this.catalogo.listar('movil', { limit: 2 }),
  });
  protected readonly servicios = resource({ loader: () => this.catalogo.servicios() });
  protected readonly tienda = resource({ loader: () => this.tiendas.principal() });

  protected readonly cartuchos: Cartucho[] = [
    {
      tipo: 'videojuego',
      titulo: 'Videojuegos',
      icono: 'sports_esports',
      texto: 'Cómpralos o alquílalos por días',
    },
    {
      tipo: 'consola',
      titulo: 'Consolas',
      icono: 'videogame_asset',
      texto: 'Nuevas, y reparación de las tuyas',
    },
    {
      tipo: 'movil',
      titulo: 'Telefonía',
      icono: 'smartphone',
      texto: 'Móviles y tablets, y su servicio técnico',
    },
  ];

  /** Primer producto de cada línea: su foto va en la etiqueta del cartucho. */
  protected readonly portadas = computed<Record<TipoProducto, Producto | undefined>>(() => ({
    videojuego: this.juegos.hasValue() ? this.juegos.value().items[0] : undefined,
    consola: this.consolas.hasValue() ? this.consolas.value().items[0] : undefined,
    movil: this.moviles.hasValue() ? this.moviles.value().items[0] : undefined,
  }));

  /** Cuántos productos hay de cada línea (el total que devuelve la API paginada). */
  protected readonly totales = computed<Record<TipoProducto, number | null>>(() => ({
    videojuego: this.juegos.hasValue() ? this.juegos.value().total : null,
    consola: this.consolas.hasValue() ? this.consolas.value().total : null,
    movil: this.moviles.hasValue() ? this.moviles.value().total : null,
  }));

  /** Consolas y móviles juntos en la segunda fila de tarjetas. */
  protected readonly dispositivos = computed(() => [
    ...(this.consolas.hasValue() ? this.consolas.value().items : []),
    ...(this.moviles.hasValue() ? this.moviles.value().items : []),
  ]);

  /** Servicios de reparación (consolas y telefonía) con precio orientativo, como mucho 6. */
  protected readonly reparaciones = computed(() =>
    this.servicios.hasValue()
      ? this.servicios
          .value()
          .filter((s) => s.linea !== 'videojuegos')
          .slice(0, 6)
      : [],
  );

  /** El proceso real de una reparación (ADR-015): los 4 pasos de la barra de vida. */
  protected readonly pasos: EstadoReparacion[] = [
    'recibida',
    'en_reparacion',
    'lista',
    'entregada',
  ];
  protected readonly estados = ESTADOS_REPARACION;

  /** Qué pasa en cada paso (el flujo real: la API asigna el técnico y el presupuesto va en la reparación). */
  protected readonly textosPaso: Record<EstadoReparacion, string> = {
    recibida:
      'La pides desde la app con una foto del problema y le llega a un técnico de Consolas o de Telefonía.',
    en_reparacion: 'El técnico la revisa, te pone el presupuesto y se pone manos a la obra.',
    lista: 'En la app ves que ya está arreglada y lista para pasar a recogerla.',
    entregada: 'La recoges en la tienda y queda guardada en tu historial de reparaciones.',
    cancelada: '',
  };

  protected readonly marcaTienda = computed(() =>
    this.tienda.hasValue()
      ? [
          {
            latitud: this.tienda.value().latitud,
            longitud: this.tienda.value().longitud,
            tipo: 'tienda' as const,
            titulo: this.tienda.value().nombre,
          },
        ]
      : [],
  );

  protected readonly fotoTienda = computed(() =>
    this.tienda.hasValue() ? this.tienda.value().fotos?.[0] : undefined,
  );

  protected recargarProductos(): void {
    this.juegos.reload();
    this.consolas.reload();
    this.moviles.reload();
  }
}
