import type { OnInit } from '@angular/core';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonChip, IonContent, IonModal } from '@ionic/angular';

import type { ApiError } from '../../core/api-error';
import { AvisosService } from '../../core/avisos.service';
import { CarritoService } from '../../core/carrito.service';
import { CatalogoService } from '../../core/catalogo.service';
import { decimal, dentroDe, precio } from '../../core/formato';
import type { Producto, TipoProducto } from '../../core/modelos';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Icono } from '../../shared/icono.component';
import { Imagen } from '../../shared/imagen.component';
import { estadoStock, Pastilla } from '../../shared/pastilla.component';
import { Vida } from '../../shared/vida.component';

/** PT-06, PT-08 y PT-10 Ficha de producto, con la hoja de alquiler PT-15. Solo se alquilan videojuegos (ADR-029). */
@Component({
  imports: [IonContent, IonButton, IonChip, IonModal, Barra, Estado, Icono, Imagen, Pastilla, Vida],
  styles: `
    .cabeza {
      display: flex;
      gap: var(--ja-espacio-4);
      align-items: flex-start;
    }
    .portada {
      flex: none;
      width: 120px;
      border-radius: var(--ja-radio-m);
      --proporcion: 3 / 4;
    }
    .cabeza .datos {
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--ja-espacio-2);
    }
    .alquiler {
      background: var(--ja-alquiler-suave);
      border-color: var(--ja-alquiler);
      color: var(--ja-alquiler);
    }
    .alquiler .titulo {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-2);
    }
    .rejilla {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--ja-espacio-4);
    }
    .marca {
      color: var(--ja-marca);
    }
    .botones {
      display: flex;
      gap: var(--ja-espacio-2);
    }
    .botones ion-button {
      flex: 1;
      margin: 0;
    }
    .hoja {
      padding: var(--ja-espacio-6) var(--ja-espacio-4);
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-3);
    }
    .duraciones {
      display: flex;
      gap: var(--ja-espacio-2);
    }
    .duraciones ion-chip {
      flex: 1;
      justify-content: center;
      margin: 0;
    }
    p {
      white-space: pre-line;
    }
    ion-modal {
      --height: auto;
      --border-radius: var(--ja-radio-xl);
    }
  `,
  template: `
    <ja-barra atras="/inicio" />
    <ion-content>
      @if (producto(); as p) {
        <div class="ja-pagina ja-columna">
          <div class="cabeza">
            <ja-imagen class="portada ja-muesca" [src]="p.imagen" [alt]="'Imagen de ' + p.nombre" />
            <div class="datos">
              <h1 class="ja-titular-m ja-sin-margen">{{ p.nombre }}</h1>
              <div class="ja-etiqueta marca">{{ subtitulo() }}</div>
              <ja-pastilla [estado]="stock().estado" [texto]="textoStock()" />
            </div>
          </div>

          @if (p.tipo === 'videojuego') {
            <div class="ja-caja ja-muesca alquiler">
              <div class="ja-entre">
                <span class="ja-subtitulo titulo"><ja-icono nombre="event" />Alquiler</span>
                <span class="ja-precio">{{ formato(p.precioAlquiler) }}<span class="ja-etiqueta-s">/día</span></span>
              </div>
              @if (p.copiasDisponibles) {
                <ja-vida [llenos]="segmentosAlquiler()" [total]="5" color="var(--ja-alquiler)" />
                <div class="ja-etiqueta-s ja-t2">
                  {{ p.copiasDisponibles }} de {{ p.copiasAlquiler }} copias disponibles
                </div>
              } @else {
                <div class="ja-etiqueta-s ja-t2">No quedan copias para alquilar ahora mismo</div>
              }
            </div>
          }

          <div class="botones">
            <ion-button color="primary" [disabled]="p.stock <= 0" (click)="comprar(p)"
              >Comprar · {{ formato(p.precio) }}</ion-button
            >
            @if (p.tipo === 'videojuego') {
              <ion-button
                fill="outline"
                color="tertiary"
                [disabled]="!p.copiasDisponibles"
                (click)="hojaAbierta.set(true)"
                ><ja-icono slot="start" nombre="swap_horiz" />Alquilar</ion-button
              >
            }
          </div>

          @if (p.descripcion) {
            <div class="ja-caja ja-muesca">
              <div class="ja-titulo">Descripción</div>
              <p class="ja-cuerpo ja-t2 ja-sin-margen">{{ p.descripcion }}</p>
            </div>
          }

          <div class="ja-caja ja-muesca">
            <div class="ja-titulo">Detalles</div>
            <div class="rejilla">
              @for (f of filas(); track f[0]) {
                <div>
                  <div class="ja-cuerpo ja-t2">{{ f[0] }}</div>
                  <div class="ja-subtitulo">{{ f[1] }}</div>
                </div>
              }
            </div>
          </div>
        </div>
      } @else if (error()) {
        <ja-estado tipo="error" titulo="No hemos podido cargar el producto" [texto]="error()" (reintentar)="cargar()" />
      } @else {
        <div class="ja-pagina"><ja-estado tipo="cargando" /></div>
      }

      <ion-modal
        [isOpen]="hojaAbierta()"
        [initialBreakpoint]="1"
        [breakpoints]="[0, 1]"
        (didDismiss)="hojaAbierta.set(false)"
      >
        <ng-template>
          @if (producto(); as p) {
            <div class="hoja">
              <div class="ja-titular-m">{{ p.nombre }}</div>
              <div class="ja-subtitulo">¿Cuántos días?</div>
              <div class="duraciones">
                @for (d of duraciones; track d) {
                  <ion-chip [class.activo]="dias() === d" (click)="dias.set(d)">{{ d }} días</ion-chip>
                }
              </div>
              <div class="ja-ticket-fila">
                <span class="ja-t2">{{ formato(p.precioAlquiler) }} × {{ dias() }} días</span
                ><span class="ja-precio-s">{{ formato((p.precioAlquiler ?? 0) * dias()) }}</span>
              </div>
              <div class="ja-etiqueta-s ja-t2">Devolución: {{ fechaFin() }}</div>
              <ion-button class="ja-boton-ancho" color="primary" (click)="anadirAlquiler(p)"
                >Añadir alquiler al carrito</ion-button
              >
            </div>
          }
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
})
export class DetallePage implements OnInit {
  private readonly catalogo = inject(CatalogoService);
  private readonly carrito = inject(CarritoService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);

  readonly tipo = input.required<TipoProducto>();
  readonly id = input.required<string>();

  readonly producto = signal<Producto | null>(null);
  readonly error = signal('');
  readonly hojaAbierta = signal(false);
  readonly duraciones = [3, 7, 14];
  readonly dias = signal(7);
  readonly formato = precio;

  readonly stock = computed(() => estadoStock(this.producto()?.stock ?? 0));
  readonly textoStock = computed(() => {
    const unidades = this.producto()?.stock ?? 0;
    return unidades > 0 ? `${this.stock().texto} · ${unidades} uds.` : this.stock().texto;
  });
  readonly subtitulo = computed(() => {
    const p = this.producto();
    return [p?.marca?.nombre, p?.plataforma?.nombre].filter(Boolean).join(' · ');
  });
  /** La barra de alquiler siempre tiene 5 segmentos, como en la nativa. */
  readonly segmentosAlquiler = computed(() => {
    const p = this.producto();
    const total = p?.copiasAlquiler || 1;
    return Math.ceil(((p?.copiasDisponibles ?? 0) / total) * 5);
  });
  readonly fechaFin = computed(() => dentroDe(this.dias()));
  readonly filas = computed<[string, string][]>(() => {
    const p = this.producto();
    if (!p) {
      return [];
    }
    const filas: [string, string | null | undefined][] = [
      ['Marca', p.marca?.nombre],
      ['Plataforma', p.plataforma?.nombre],
      ['Género', p.genero],
      ['PEGI', p.pegi ? String(p.pegi) : null],
      ['Formato', p.formato === 'tablet' ? 'Tablet' : p.formato === 'movil' ? 'Móvil' : null],
      ['Modelo', p.modelo],
      ['Pantalla', p.pantallaPulgadas ? `${decimal(p.pantallaPulgadas)}″` : null],
      ['RAM', p.ramGb ? `${p.ramGb} GB` : null],
      ['Almacenamiento', p.almacenamientoGb ? `${p.almacenamientoGb} GB` : null],
    ];
    return filas.filter((f): f is [string, string] => !!f[1]);
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.error.set('');
    this.catalogo.detalle(this.tipo(), Number(this.id())).subscribe({
      next: (p) => this.producto.set(p),
      error: (e: ApiError) => this.error.set(e.mensaje),
    });
  }

  comprar(p: Producto): void {
    this.carrito.comprar(p);
    void this.avisos.mensaje(`«${p.nombre}» añadido al carrito`, {
      texto: 'Ver carrito',
      hacer: () => void this.router.navigateByUrl('/carrito'),
    });
  }

  anadirAlquiler(p: Producto): void {
    this.carrito.alquilar(p, this.dias());
    this.hojaAbierta.set(false);
    void this.avisos.mensaje(`Alquiler de ${p.nombre} añadido al carrito`, {
      texto: 'Ver carrito',
      hacer: () => void this.router.navigateByUrl('/carrito'),
    });
  }
}
