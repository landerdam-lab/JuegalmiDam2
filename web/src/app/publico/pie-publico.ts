import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Tiendas } from '../core/tiendas';
import { Logo } from '../shared/logo';

/** Pie de la parte pública: los datos de la tienda salen de la API (nada escrito a mano, A-29). */
@Component({
  selector: 'ja-pie-publico',
  imports: [RouterLink, Logo],
  styles: `
    footer {
      margin-top: var(--ja-espacio-16);
      padding: var(--ja-espacio-12) 0 var(--ja-espacio-8);
      border-top: var(--ja-borde-fino) solid var(--ja-borde);
      background: var(--ja-superficie);
    }
    .columnas {
      display: grid;
      gap: var(--ja-espacio-8);
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
    h2 {
      font: var(--ja-tipo-etiqueta);
      color: var(--ja-texto);
      margin-bottom: var(--ja-espacio-3);
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: var(--ja-espacio-2);
    }
    a {
      color: var(--ja-texto-2);
      text-decoration: none;
      font: var(--ja-tipo-cuerpo);
    }
    a:hover {
      color: var(--ja-marca);
      text-decoration: underline;
    }
    address {
      font-style: normal;
      font: var(--ja-tipo-cuerpo);
      color: var(--ja-texto-2);
    }
    .lema {
      margin-top: var(--ja-espacio-3);
      font: var(--ja-tipo-cuerpo);
      color: var(--ja-texto-2);
      max-width: 32ch;
    }
    .legal {
      margin-top: var(--ja-espacio-10);
      padding-top: var(--ja-espacio-4);
      border-top: var(--ja-borde-fino) solid var(--ja-borde);
      font: var(--ja-tipo-etiqueta-s);
      color: var(--ja-texto-3);
    }
  `,
  template: `
    <footer>
      <div class="ja-contenedor">
        <div class="columnas">
          <div>
            <ja-logo />
            <p class="lema">
              La app de JuegAlmi: videojuegos, consolas y telefonía, para comprar, alquilar y
              reparar.
            </p>
          </div>
          <div>
            <h2>Catálogo</h2>
            <ul>
              <li>
                <a routerLink="/catalogo" [queryParams]="{ tipo: 'videojuego' }">Videojuegos</a>
              </li>
              <li><a routerLink="/catalogo" [queryParams]="{ tipo: 'consola' }">Consolas</a></li>
              <li>
                <a routerLink="/catalogo" [queryParams]="{ tipo: 'movil' }">Móviles y tablets</a>
              </li>
            </ul>
          </div>
          <div>
            <h2>La tienda</h2>
            <ul>
              <li><a routerLink="/tienda" fragment="servicios">Servicios y reparaciones</a></li>
              <li><a routerLink="/tienda" fragment="ubicacion">Cómo llegar</a></li>
              <li><a routerLink="/tienda" fragment="historia">Nuestra historia</a></li>
            </ul>
          </div>
          <div>
            <h2>Dónde estamos</h2>
            @if (tienda.hasValue()) {
              <address>{{ tienda.value().nombre }}<br />{{ tienda.value().direccion }}</address>
            } @else if (tienda.error()) {
              <address>Bilbao (Bizkaia)</address>
            } @else {
              <span class="ja-esqueleto" style="height: var(--ja-espacio-10)"></span>
            }
          </div>
        </div>
        <p class="legal">
          Demo académica del Reto 2 de DAM2 · Centro de Estudios ALMI · curso 2025-26 ·
          <a routerLink="/acceso">Acceso del personal</a>
        </p>
      </div>
    </footer>
  `,
})
export class PiePublico {
  private readonly tiendas = inject(Tiendas);
  /** resource(): carga asíncrona con estado (cargando / valor / error) sin suscripciones a mano. */
  protected readonly tienda = resource({ loader: () => this.tiendas.principal() });
}
