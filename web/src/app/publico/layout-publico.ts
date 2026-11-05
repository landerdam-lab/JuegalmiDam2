import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Sesion } from '../core/sesion';
import { Temas } from '../core/tema';
import { Icono } from '../shared/icono';
import { Logo } from '../shared/logo';
import { PiePublico } from './pie-publico';

/**
 * Marco de la parte pública (PW-01 a PW-04): barra superior con el menú de Roles y permisos
 * (Inicio · Catálogo · La tienda · La app · Acceso) y el pie con los datos de la tienda.
 * En el móvil el menú se pliega en un botón ☰, como el drawer de las apps.
 */
@Component({
  selector: 'ja-layout-publico',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono, Logo, PiePublico],
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    header {
      position: sticky;
      top: 0;
      z-index: 20;
      background: var(--ja-fondo);
      border-bottom: var(--ja-borde-fino) solid var(--ja-borde);
    }
    /* Progreso de lectura como barra de vida: 10 segmentos que se encienden a saltos al bajar.
       CSS nativo ligado al scroll (sin JavaScript); donde no hay soporte, no se muestra. */
    .progreso {
      display: none;
    }
    @supports (animation-timeline: scroll()) {
      .progreso {
        position: absolute;
        left: 0;
        right: 0;
        bottom: calc(var(--ja-borde-fino) * -1);
        display: flex;
        gap: var(--ja-espacio-1);
        height: var(--ja-borde-foco);
        pointer-events: none;
      }
      .progreso span {
        flex: 1;
        border-radius: var(--ja-radio-segmento);
        background: var(--ja-marca);
        opacity: 0;
        animation: encender-segmento linear both;
        animation-timeline: scroll(root block);
        animation-range: calc(var(--n) * 10% + 8%) calc(var(--n) * 10% + 9%);
      }
    }
    @keyframes encender-segmento {
      to {
        opacity: 1;
      }
    }
    .barra {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-4);
      height: var(--ja-tamano-barra-superior);
    }
    .barra > a:first-child {
      text-decoration: none;
      margin-right: auto;
    }
    nav ul {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    nav a {
      display: inline-flex;
      align-items: center;
      min-height: var(--ja-tamano-tactil-min);
      padding: 0 var(--ja-espacio-3);
      border-radius: var(--ja-radio-m);
      color: var(--ja-texto-2);
      font: var(--ja-tipo-etiqueta);
      text-decoration: none;
    }
    nav a:hover {
      color: var(--ja-texto);
      background: var(--ja-superficie-2);
    }
    nav a.activa {
      color: var(--ja-marca);
      background: var(--ja-marca-suave);
    }
    .acceso {
      gap: var(--ja-espacio-2);
    }
    .menu {
      display: none;
    }
    main {
      flex: 1;
    }

    @media (max-width: 900px) {
      .menu {
        display: inline-flex;
      }
      nav {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        display: none;
        padding: var(--ja-espacio-2) var(--ja-espacio-4) var(--ja-espacio-4);
        background: var(--ja-fondo);
        border-bottom: var(--ja-borde-fino) solid var(--ja-borde);
        box-shadow: var(--ja-elevacion-2);
      }
      nav.abierto {
        display: block;
      }
      nav ul {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
  template: `
    <a class="ja-saltar" href="#contenido">Saltar al contenido</a>
    <header>
      <div class="ja-contenedor barra">
        <a routerLink="/" aria-label="Almi Companion, inicio"><ja-logo /></a>
        <nav id="menu-publico" [class.abierto]="menuAbierto()" aria-label="Principal">
          <ul>
            <li>
              <a
                routerLink="/"
                routerLinkActive="activa"
                [routerLinkActiveOptions]="{ exact: true }"
                ariaCurrentWhenActive="page"
                >Inicio</a
              >
            </li>
            <li>
              <a routerLink="/catalogo" routerLinkActive="activa" ariaCurrentWhenActive="page"
                >Catálogo</a
              >
            </li>
            <li>
              <a routerLink="/tienda" routerLinkActive="activa" ariaCurrentWhenActive="page"
                >La tienda</a
              >
            </li>
            <li><a routerLink="/" fragment="app">La app</a></li>
            <li>
              <a class="acceso" [routerLink]="sesion.haySesion() ? '/admin' : '/acceso'">
                <ja-icono nombre="lock" />{{
                  sesion.haySesion() ? 'Backoffice' : 'Acceso personal'
                }}
              </a>
            </li>
          </ul>
        </nav>
        <button
          type="button"
          class="ja-boton-icono"
          [attr.aria-label]="temas.esOscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          (click)="temas.alternar()"
        >
          <ja-icono [nombre]="temas.esOscuro() ? 'light_mode' : 'dark_mode'" />
        </button>
        <button
          type="button"
          class="ja-boton-icono menu"
          aria-controls="menu-publico"
          [attr.aria-expanded]="menuAbierto()"
          aria-label="Menú"
          (click)="menuAbierto.set(!menuAbierto())"
        >
          <ja-icono [nombre]="menuAbierto() ? 'close' : 'menu'" />
        </button>
      </div>
      <div class="progreso" aria-hidden="true">
        @for (n of segmentos; track n) {
          <span [style.--n]="n"></span>
        }
      </div>
    </header>
    <main id="contenido" tabindex="-1"><router-outlet /></main>
    <ja-pie-publico />
  `,
})
export class LayoutPublico {
  protected readonly sesion = inject(Sesion);
  protected readonly temas = inject(Temas);
  protected readonly menuAbierto = signal(false);
  /** Los 10 segmentos de la barra de progreso de lectura. */
  protected readonly segmentos = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  constructor() {
    // Al navegar se cierra el menú del móvil
    inject(Router).events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.menuAbierto.set(false);
      }
    });
  }
}
