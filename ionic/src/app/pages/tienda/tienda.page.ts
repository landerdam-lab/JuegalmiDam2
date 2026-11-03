import type { OnInit} from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard, IonContent } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import type { FotoTienda, Tienda } from '../../core/modelos';
import { TiendaService } from '../../core/tienda.service';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Icono } from '../../shared/icono.component';
import { Imagen } from '../../shared/imagen.component';

/** PT-24 La tienda: portada y las cuatro secciones, estilo Google Play. */
@Component({
  imports: [RouterLink, IonContent, IonCard, Barra, Estado, Icono, Imagen],
  styles: `
    .portada { --proporcion: 16 / 9; }
    .rejilla { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ja-espacio-3); }
    .rejilla ion-card { cursor: pointer; padding: var(--ja-espacio-4); display: flex; flex-direction: column; gap: var(--ja-espacio-2); }
    .marca { color: var(--ja-marca); }
  `,
  template: `
    <ja-barra titulo="La tienda" />
    <ion-content>
      @if (tienda(); as t) {
        <div class="ja-pagina ja-columna">
          <ja-imagen class="portada ja-muesca--destacada" [src]="portada()" [alt]="t.nombre" />
          <div>
            <h1 class="ja-titular-m ja-sin-margen">{{ t.nombre }}</h1>
            <div class="ja-cuerpo ja-t2">{{ t.direccion }}</div>
          </div>
          <div class="ja-titulo">Explora la tienda</div>
          <div class="rejilla">
            @for (s of secciones; track s.ruta) {
              <ion-card class="ja-tarjeta" [routerLink]="s.ruta">
                <ja-icono class="marca" [nombre]="s.icono" />
                <div class="ja-subtitulo">{{ s.titulo }}</div>
                <div class="ja-etiqueta-s ja-t2">{{ s.texto }}</div>
              </ion-card>
            }
          </div>
        </div>
      } @else if (error()) {
        <ja-estado tipo="error" titulo="No hemos podido cargar la tienda" [texto]="error()" (reintentar)="cargar()" />
      } @else {
        <div class="ja-pagina"><ja-estado tipo="cargando" /></div>
      }
    </ion-content>
  `,
})
export class TiendaPage implements OnInit {
  private readonly servicio = inject(TiendaService);

  readonly secciones = [
    { ruta: '/tienda/servicios', icono: 'build', titulo: 'Servicios', texto: 'Reparación de consolas y móviles' },
    { ruta: '/tienda/ubicacion', icono: 'location_on', titulo: 'Ubicación', texto: 'Cómo llegar a la tienda' },
    { ruta: '/tienda/galeria', icono: 'image', titulo: 'Galería', texto: 'Fotos de la tienda' },
    { ruta: '/tienda/historia', icono: 'storefront', titulo: 'Historia', texto: 'Quiénes somos' },
  ];
  readonly tienda = signal<Tienda | null>(null);
  readonly portada = signal<string | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.error.set('');
    this.servicio.tienda().subscribe({ next: (t) => this.tienda.set(t), error: (e: ApiError) => this.error.set(e.mensaje) });
    this.servicio.fotos().subscribe({ next: (f: FotoTienda[]) => this.portada.set(f[0]?.imagen ?? null), error: () => undefined });
  }
}
