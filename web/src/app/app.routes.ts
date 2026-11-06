import type { Routes } from '@angular/router';

import { adminGuard, invitadoGuard, sesionGuard } from './core/guardas';

/**
 * Rutas de la web (bóveda 08-Diseno-UI/Mapa de pantallas, PW-xx). Todas las pantallas se cargan
 * bajo demanda (loadComponent): la portada no descarga el código del backoffice.
 * - Parte pública, sin login (ADR-028): PW-01 a PW-04.
 * - Backoffice, /admin (ADR-024 y ADR-032): admin todo; técnico solo /admin/reparaciones y su perfil.
 */
const marca = ' · Almi Companion';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./publico/layout-publico').then((m) => m.LayoutPublico),
    children: [
      {
        path: '',
        title: 'Almi Companion · JuegAlmi Bilbao',
        loadComponent: () => import('./publico/portada').then((m) => m.Portada),
      },
      {
        path: 'catalogo',
        title: 'Catálogo' + marca,
        loadComponent: () => import('./publico/catalogo').then((m) => m.CatalogoPublico),
      },
      {
        path: 'producto/:id',
        title: 'Producto' + marca,
        loadComponent: () => import('./publico/detalle').then((m) => m.Detalle),
      },
      {
        path: 'tienda',
        title: 'La tienda' + marca,
        loadComponent: () => import('./publico/tienda').then((m) => m.TiendaPublica),
      },
    ],
  },
  {
    path: 'acceso',
    title: 'Acceso del personal' + marca,
    canActivate: [invitadoGuard],
    loadComponent: () => import('./admin/acceso').then((m) => m.Acceso),
  },
  {
    path: 'admin',
    canActivate: [sesionGuard],
    loadComponent: () => import('./admin/layout-admin').then((m) => m.LayoutAdmin),
    children: [
      {
        path: '',
        title: 'Resumen' + marca,
        canActivate: [adminGuard],
        loadComponent: () => import('./admin/resumen').then((m) => m.Resumen),
      },
      {
        path: 'productos',
        title: 'Productos' + marca,
        canActivate: [adminGuard],
        loadComponent: () => import('./admin/productos').then((m) => m.Productos),
      },
      {
        path: 'catalogos',
        title: 'Marcas, plataformas y servicios' + marca,
        canActivate: [adminGuard],
        loadComponent: () => import('./admin/catalogos').then((m) => m.Catalogos),
      },
      {
        path: 'proveedores',
        title: 'Proveedores' + marca,
        canActivate: [adminGuard],
        loadComponent: () => import('./admin/proveedores').then((m) => m.ProveedoresAdmin),
      },
      {
        path: 'clientes',
        title: 'Clientes' + marca,
        canActivate: [adminGuard],
        loadComponent: () => import('./admin/clientes').then((m) => m.Clientes),
      },
      {
        path: 'trabajadores',
        title: 'Trabajadores' + marca,
        canActivate: [adminGuard],
        loadComponent: () => import('./admin/trabajadores').then((m) => m.Trabajadores),
      },
      {
        path: 'pedidos',
        title: 'Pedidos y alquileres' + marca,
        canActivate: [adminGuard],
        loadComponent: () => import('./admin/pedidos').then((m) => m.PedidosAdmin),
      },
      {
        path: 'reparaciones',
        title: 'Reparaciones' + marca,
        loadComponent: () => import('./admin/reparaciones').then((m) => m.ReparacionesAdmin),
      },
      {
        path: 'tienda',
        title: 'Tienda y galería' + marca,
        canActivate: [adminGuard],
        loadComponent: () => import('./admin/tienda-admin').then((m) => m.TiendaAdmin),
      },
      {
        path: 'ubicaciones',
        title: 'Registro de ubicaciones' + marca,
        canActivate: [adminGuard],
        loadComponent: () => import('./admin/ubicaciones-admin').then((m) => m.UbicacionesAdmin),
      },
      {
        path: 'perfil',
        title: 'Mi perfil' + marca,
        loadComponent: () => import('./admin/perfil').then((m) => m.Perfil),
      },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada' + marca,
    loadComponent: () => import('./publico/layout-publico').then((m) => m.LayoutPublico),
    children: [
      {
        path: '',
        loadComponent: () => import('./publico/no-encontrada').then((m) => m.NoEncontrada),
      },
    ],
  },
];
