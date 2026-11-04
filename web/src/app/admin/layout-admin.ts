import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Auth } from '../core/auth';
import { Sesion } from '../core/sesion';
import { Temas } from '../core/tema';
import { Icono } from '../shared/icono';
import { Logo } from '../shared/logo';

interface Enlace {
  ruta: string;
  texto: string;
  icono: string;
  exacta?: boolean;
}

interface Grupo {
  titulo: string;
  enlaces: Enlace[];
}

/**
 * Marco del backoffice: menú lateral con muesca (el drawer de las apps, DESIGN.md §9) y barra superior.
 * El menú depende del rol (Roles y permisos): el admin ve toda la gestión; el técnico, solo
 * las reparaciones de su departamento. En pantallas estrechas el menú se abre con ☰.
 */
@Component({
  selector: 'ja-layout-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono, Logo],
  styleUrl: './layout-admin.scss',
  templateUrl: './layout-admin.html',
})
export class LayoutAdmin {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  protected readonly sesion = inject(Sesion);
  protected readonly temas = inject(Temas);

  protected readonly menuAbierto = signal(false);

  protected readonly grupos = computed<Grupo[]>(() => {
    if (!this.sesion.esAdmin()) {
      return [
        {
          titulo: 'Taller',
          enlaces: [{ ruta: '/admin/reparaciones', texto: 'Reparaciones', icono: 'build' }],
        },
      ];
    }
    return [
      {
        titulo: 'Día a día',
        enlaces: [
          { ruta: '/admin', texto: 'Resumen', icono: 'dashboard', exacta: true },
          { ruta: '/admin/pedidos', texto: 'Pedidos y alquileres', icono: 'receipt_long' },
          { ruta: '/admin/reparaciones', texto: 'Reparaciones', icono: 'build' },
        ],
      },
      {
        titulo: 'Catálogo',
        enlaces: [
          { ruta: '/admin/productos', texto: 'Productos', icono: 'inventory_2' },
          { ruta: '/admin/catalogos', texto: 'Marcas, plataformas y servicios', icono: 'category' },
        ],
      },
      {
        titulo: 'Personas',
        enlaces: [
          { ruta: '/admin/clientes', texto: 'Clientes', icono: 'group' },
          { ruta: '/admin/trabajadores', texto: 'Trabajadores', icono: 'badge' },
        ],
      },
      {
        titulo: 'Tienda',
        enlaces: [
          { ruta: '/admin/tienda', texto: 'Tienda y galería', icono: 'storefront' },
          { ruta: '/admin/ubicaciones', texto: 'Registro de ubicaciones', icono: 'pin_drop' },
        ],
      },
    ];
  });

  protected readonly iniciales = computed(() => {
    const u = this.sesion.usuario();
    return u ? `${u.nombre[0] ?? ''}${u.apellidos[0] ?? ''}`.toUpperCase() : '';
  });

  protected readonly puesto = computed(() => {
    const u = this.sesion.usuario();
    if (!u) {
      return '';
    }
    return u.puesto === 'admin' ? 'Administración' : `Técnico · ${u.departamento?.nombre ?? ''}`;
  });

  constructor() {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.menuAbierto.set(false);
      }
    });
    // Refresca el nombre, el puesto y el departamento (por si el admin los cambió)
    this.auth.comprobarSesion().catch(() => undefined);
  }

  protected async salir(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/acceso', { replaceUrl: true });
  }
}
