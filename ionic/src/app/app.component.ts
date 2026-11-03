import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonContent, IonItem, IonLabel, IonList, IonListHeader, IonMenu, IonMenuToggle, IonRouterOutlet } from '@ionic/angular';

import { AuthService } from './core/auth.service';
import { AvisosService } from './core/avisos.service';
import { PreferenciasService } from './core/preferencias.service';
import { SesionService } from './core/sesion.service';
import { Icono } from './shared/icono.component';
import { Logo } from './shared/logo.component';

/** Menú lateral (Navigation Drawer) y el hueco donde se abren las páginas. */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- nombre estándar de la raíz de Angular
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, IonMenu, IonContent, IonList, IonListHeader, IonItem, IonLabel, IonMenuToggle, RouterLink, RouterLinkActive, Icono, Logo],
  styles: `
    ion-menu { --width: 300px; }
    ion-list, ion-list-header { background: transparent; }
    .cabecera { padding: var(--ja-espacio-6) var(--ja-espacio-4) var(--ja-espacio-4); display: flex; flex-direction: column; gap: var(--ja-espacio-3); }
    .usuario { display: flex; align-items: center; gap: var(--ja-espacio-3); }
    .avatar { width: var(--ja-tamano-avatar); height: var(--ja-tamano-avatar); border-radius: var(--ja-radio-completo); object-fit: cover; background: var(--ja-marca-suave); color: var(--ja-marca); display: flex; align-items: center; justify-content: center; flex: none; font: var(--ja-tipo-subtitulo); }
    ion-item.seleccionado { --background: var(--ja-marca-suave); --color: var(--ja-marca); font-weight: 600; }
    ion-item { --background: transparent; --border-radius: var(--ja-radio-m); margin: 0 var(--ja-espacio-2); }
    ja-icono { margin-inline-end: var(--ja-espacio-3); }
    .salir { --color: var(--ja-error); }
  `,
  template: `
    <ion-app>
      <ion-menu contentId="principal" [disabled]="!usuario()">
        <ion-content>
          <div class="cabecera">
            <ja-logo />
            @if (usuario(); as u) {
              <div class="usuario">
                @if (u.foto) {
                  <img class="avatar" [src]="u.foto" alt="" />
                } @else {
                  <span class="avatar">{{ inicial() }}</span>
                }
                <div>
                  <div class="ja-subtitulo">{{ u.nombre }} {{ u.apellidos }}</div>
                  <div class="ja-etiqueta-s ja-t2">Cliente</div>
                </div>
              </div>
            }
          </div>
          <ion-list lines="none">
            <ion-list-header>Comprar</ion-list-header>
            @for (e of comprar; track e.ruta) {
              <ion-menu-toggle [autoHide]="false">
                <ion-item button [detail]="false" [routerLink]="e.ruta" routerLinkActive="seleccionado" routerDirection="root">
                  <ja-icono [nombre]="e.icono" /><ion-label>{{ e.texto }}</ion-label>
                </ion-item>
              </ion-menu-toggle>
            }
            <ion-list-header>Mi cuenta</ion-list-header>
            @for (e of cuenta; track e.ruta) {
              <ion-menu-toggle [autoHide]="false">
                <ion-item button [detail]="false" [routerLink]="e.ruta" routerLinkActive="seleccionado" routerDirection="root">
                  <ja-icono [nombre]="e.icono" /><ion-label>{{ e.texto }}</ion-label>
                </ion-item>
              </ion-menu-toggle>
            }
            <ion-menu-toggle [autoHide]="false">
              <ion-item class="salir" button [detail]="false" (click)="cerrarSesion()">
                <ja-icono nombre="logout" /><ion-label>Cerrar sesión</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
        </ion-content>
      </ion-menu>
      <ion-router-outlet id="principal" />
    </ion-app>
  `,
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);

  readonly usuario = inject(SesionService).usuario;
  readonly inicial = computed(() => this.usuario()?.nombre.charAt(0).toUpperCase() ?? '');

  readonly comprar = [
    { ruta: '/inicio', icono: 'home', texto: 'Inicio' },
    { ruta: '/carrito', icono: 'shopping_cart', texto: 'Carrito' },
    { ruta: '/tienda', icono: 'storefront', texto: 'La tienda' },
  ];
  readonly cuenta = [
    { ruta: '/pedidos', icono: 'receipt_long', texto: 'Mis pedidos' },
    { ruta: '/alquileres', icono: 'event', texto: 'Mis alquileres' },
    { ruta: '/reparaciones', icono: 'build', texto: 'Mis reparaciones' },
    { ruta: '/perfil', icono: 'person', texto: 'Perfil' },
  ];

  constructor() {
    // Se crea aquí para que el tema se aplique desde el primer momento
    inject(PreferenciasService);
  }

  async cerrarSesion(): Promise<void> {
    const si = await this.avisos.confirmarDestructivo('Cerrar sesión', 'Tendrás que volver a entrar con tu correo y contraseña. El carrito se vaciará.', 'Cerrar sesión');
    if (si) {
      this.auth.logout();
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }
}
