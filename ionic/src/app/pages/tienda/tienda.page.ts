import type { OnInit } from '@angular/core';
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
    .portada-caja {
      position: relative;
    }
    .portada {
      --proporcion: 16 / 9;
    }
    .rotulo {
      position: absolute;
      inset: auto 0 0;
      padding: var(--ja-espacio-8) var(--ja-espacio-4) var(--ja-espacio-3);
      border-radius: 0 0 var(--ja-radio-l) var(--ja-radio-l);
      background: linear-gradient(transparent, color-mix(in srgb, var(--ja-sobre-primario) 75%, transparent));
    }
    .rotulo h1 {
      color: var(--ja-primario);
    }
    .rotulo div {
      color: var(--ja-primario);
      font: var(--ja-tipo-codigo);
    }
    .rejilla {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--ja-espacio-3);
    }
    .rejilla ion-card {
      cursor: pointer;
      padding: var(--ja-espacio-4);
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-1);
      border: none;
      background: var(--color);
    }
    .cabeza {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--ja-espacio-6);
    }
    .baldosa {
      width: var(--ja-espacio-12);
      height: var(--ja-espacio-12);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ja-radio-m);
      background: var(--ja-superficie);
      color: var(--ja-texto);
    }
  `,
  template: `
    <ja-barra titulo="La tienda" />
    <ion-content>
      @if (tienda(); as t) {
        <div class="ja-pagina ja-columna">
          <div class="portada-caja">
            <ja-imagen class="portada ja-muesca--destacada" [src]="portada()" [alt]="t.nombre" />
            <div class="rotulo">
              <h1 class="ja-titular-l ja-sin-margen">{{ t.nombre }}</h1>
              <div>{{ t.direccion }}</div>
            </div>
          </div>
          <div class="ja-titulo">Explora la tienda</div>
          <div class="rejilla">
            @for (s of secciones; track s.ruta) {
              <ion-card class="ja-tarjeta" [style.--color]="s.color" [routerLink]="s.ruta">
                <div class="cabeza">
                  <div class="baldosa"><ja-icono [nombre]="s.icono" /></div>
                  <ja-icono nombre="arrow_forward" />
                </div>
                <div class="ja-titulo">{{ s.titulo }}</div>
                <div class="ja-cuerpo ja-t2">{{ s.texto }}</div>
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
    {
      ruta: '/tienda/servicios',
      icono: 'handyman',
      titulo: 'Servicios',
      texto: 'Reparación de consolas y móviles',
      color: 'var(--ja-marca-suave)',
    },
    {
      ruta: '/tienda/ubicacion',
      icono: 'location_on',
      titulo: 'Ubicación',
      texto: 'Cómo llegar a la tienda',
      color: 'var(--ja-info-suave)',
    },
    {
      ruta: '/tienda/galeria',
      icono: 'photo_library',
      titulo: 'Galería',
      texto: 'Fotos de la tienda',
      color: 'var(--ja-alquiler-suave)',
    },
    {
      ruta: '/tienda/historia',
      icono: 'menu_book',
      titulo: 'Historia',
      texto: 'Quiénes somos',
      color: 'var(--ja-aviso-suave)',
    },
  ];
  readonly tienda = signal<Tienda | null>(null);
  readonly portada = signal<string | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.error.set('');
    this.servicio
      .tienda()
      .subscribe({ next: (t) => this.tienda.set(t), error: (e: ApiError) => this.error.set(e.mensaje) });
    this.servicio
      .fotos()
      .subscribe({ next: (f: FotoTienda[]) => this.portada.set(f[0]?.imagen ?? null), error: () => undefined });
  }
}
