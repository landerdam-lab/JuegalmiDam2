import type { Routes } from '@angular/router';

import { conSesion } from './core/guardas';

// Cada página se carga al entrar (carga rápida). Los comentarios son los ID de 08-Diseno-UI/Mapa de pantallas.md
export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./pages/auth/splash.page').then((m) => m.SplashPage) }, // PT-01
  { path: 'login', loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage) }, // PT-02
  { path: 'registro', loadComponent: () => import('./pages/auth/registro.page').then((m) => m.RegistroPage) }, // PT-03
  {
    path: '',
    canActivate: [conSesion],
    children: [
      { path: 'inicio', loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage) }, // PT-04, 05, 07, 09, 29
      {
        path: 'producto/:tipo/:id',
        loadComponent: () => import('./pages/detalle/detalle.page').then((m) => m.DetallePage),
      }, // PT-06, 08, 10, 15
      { path: 'carrito', loadComponent: () => import('./pages/pedidos/carrito.page').then((m) => m.CarritoPage) }, // PT-11
      {
        path: 'pedido/confirmar',
        loadComponent: () => import('./pages/pedidos/confirmar.page').then((m) => m.ConfirmarPage),
      }, // PT-12
      {
        path: 'pedido/:id/hecho',
        loadComponent: () => import('./pages/pedidos/realizado.page').then((m) => m.RealizadoPage),
      }, // PT-12
      { path: 'pedidos', loadComponent: () => import('./pages/pedidos/pedidos.page').then((m) => m.PedidosPage) }, // PT-13
      {
        path: 'pedidos/:id',
        loadComponent: () => import('./pages/pedidos/detalle-pedido.page').then((m) => m.DetallePedidoPage),
      }, // PT-14
      {
        path: 'alquileres',
        loadComponent: () => import('./pages/alquileres/alquileres.page').then((m) => m.AlquileresPage),
      }, // PT-16
      {
        path: 'reparaciones',
        loadComponent: () => import('./pages/reparaciones/reparaciones.page').then((m) => m.ReparacionesPage),
      }, // PT-18
      {
        path: 'reparaciones/nueva',
        loadComponent: () => import('./pages/reparaciones/nueva-reparacion.page').then((m) => m.NuevaReparacionPage),
      }, // PT-17
      { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage) }, // PT-21
      { path: 'tienda', loadComponent: () => import('./pages/tienda/tienda.page').then((m) => m.TiendaPage) }, // PT-24
      {
        path: 'tienda/servicios',
        loadComponent: () => import('./pages/tienda/servicios.page').then((m) => m.ServiciosPage),
      }, // PT-25
      {
        path: 'tienda/ubicacion',
        loadComponent: () => import('./pages/tienda/ubicacion.page').then((m) => m.UbicacionPage),
      }, // PT-26
      { path: 'tienda/galeria', loadComponent: () => import('./pages/tienda/galeria.page').then((m) => m.GaleriaPage) }, // PT-27
      {
        path: 'tienda/historia',
        loadComponent: () => import('./pages/tienda/historia.page').then((m) => m.HistoriaPage),
      }, // PT-28
    ],
  },
  { path: '**', redirectTo: '' },
];
