import type { OnInit } from '@angular/core';
import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import {
  ActionSheetController,
  IonButton,
  IonCard,
  IonChip,
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular';
import type { Subscription } from 'rxjs';

import { AgitarService } from '../../core/agitar.service';
import type { ApiError } from '../../core/api-error';
import type { Filtro, Orden } from '../../core/catalogo.service';
import { CatalogoService, hayFiltros, POR_PAGINA } from '../../core/catalogo.service';
import { precio } from '../../core/formato';
import type { Producto, Referencia, TipoProducto } from '../../core/modelos';
import { UbicacionService } from '../../core/ubicacion.service';
import { VozService } from '../../core/voz.service';
import { Barra } from '../../shared/barra.component';
import { Estado } from '../../shared/estado.component';
import { Icono } from '../../shared/icono.component';
import { Imagen } from '../../shared/imagen.component';
import { ProductoTarjeta } from '../../shared/producto-tarjeta.component';

const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: 'nombre', texto: 'Nombre' },
  { valor: 'precio_asc', texto: 'Precio: de menor a mayor' },
  { valor: 'precio_desc', texto: 'Precio: de mayor a menor' },
];

@Component({
  imports: [
    RouterLink,
    IonContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonChip,
    IonCard,
    IonButton,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    Barra,
    Estado,
    Icono,
    Imagen,
    ProductoTarjeta,
  ],
  styles: `
    .fijo {
      background: var(--ja-fondo);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    .buscador {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-1);
      margin: 0 var(--ja-espacio-4) var(--ja-espacio-2);
      padding-right: var(--ja-espacio-1);
      background: var(--ja-superficie-2);
      border: var(--ja-borde-fino) solid var(--ja-borde);
      border-radius: var(--ja-radio-completo);
      overflow: hidden;
      max-height: var(--ja-espacio-16);
      transition:
        max-height var(--ja-duracion-base) var(--ja-curva-estandar),
        opacity var(--ja-duracion-base);
    }
    .buscador.oculto {
      max-height: 0;
      opacity: 0;
      margin-bottom: 0;
      border-width: 0;
    }
    ion-searchbar {
      padding: 0;
      --background: transparent;
      --border-radius: var(--ja-radio-completo);
      --box-shadow: none;
    }
    .micro {
      flex: none;
      width: var(--ja-tamano-tactil-min);
      height: var(--ja-tamano-tactil-min);
      --padding-start: 0;
      --padding-end: 0;
      --border-radius: var(--ja-radio-completo);
      margin: 0;
    }
    ion-segment {
      justify-content: flex-start;
      border-bottom: var(--ja-borde-fino) solid var(--ja-borde);
    }
    .lista {
      padding: 0 var(--ja-espacio-4) var(--ja-espacio-4);
    }
    .seccion {
      padding: var(--ja-espacio-2) var(--ja-espacio-4) var(--ja-espacio-4);
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-3);
    }
    .contador {
      padding: 0 var(--ja-espacio-4) var(--ja-espacio-2);
    }
    .carrusel {
      display: flex;
      gap: var(--ja-espacio-3);
      overflow-x: auto;
      scrollbar-width: none;
    }
    .mini {
      flex: none;
      width: 160px;
      cursor: pointer;
    }
    .mini ja-imagen {
      --proporcion: 4 / 3;
    }
    .mini .datos {
      padding: var(--ja-espacio-3);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--ja-espacio-1);
    }
    .mini .nombre {
      font: var(--ja-tipo-subtitulo);
      color: var(--ja-texto);
      min-height: 2lh;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
    .reparamos {
      padding: var(--ja-espacio-4);
      display: flex;
      flex-direction: column;
      gap: var(--ja-espacio-3);
    }
    .reparamos ion-button {
      margin: 0;
    }
    .reparamos .fila {
      display: flex;
      gap: var(--ja-espacio-3);
      align-items: center;
    }
    .reparamos .circulo {
      flex: none;
      width: var(--ja-espacio-12);
      height: var(--ja-espacio-12);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ja-radio-completo);
      background: var(--ja-marca-suave);
      color: var(--ja-marca);
    }
  `,
  template: `
    <ja-barra />
    <ion-content [scrollEvents]="true" (ionScroll)="alDesplazar($any($event).detail.scrollTop)">
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content /></ion-refresher>
      <div class="fijo">
        <div class="buscador" [class.oculto]="buscadorOculto()">
          <ion-searchbar
            placeholder="Busca juegos, móviles o consolas"
            [debounce]="350"
            [value]="texto()"
            (ionInput)="buscar($any($event).detail.value ?? '')"
            searchIcon="assets/iconos/search.svg"
            clearIcon="assets/iconos/close.svg"
          />
          <ion-button class="micro" color="primary" aria-label="Hablar con la app" (click)="voz.escuchar()"
            ><ja-icono nombre="mic"
          /></ion-button>
        </div>
        <ion-segment [value]="tipo()" [scrollable]="true" (ionChange)="cambiarPestana($any($event).detail.value)">
          <ion-segment-button value="videojuego"><ion-label>Videojuegos</ion-label></ion-segment-button>
          <ion-segment-button value="movil"><ion-label>Móviles y tablets</ion-label></ion-segment-button>
          <ion-segment-button value="consola"><ion-label>Consolas</ion-label></ion-segment-button>
        </ion-segment>
      </div>
      <div class="ja-chips">
        @if (conFiltros()) {
          <ion-chip (click)="quitarFiltros()"><ja-icono nombre="close" />Quitar filtros</ion-chip>
        }
        @if (tipo() === 'videojuego') {
          <ion-chip
            [class.activo]="filtro().soloAlquilables"
            (click)="cambiar({ soloAlquilables: !filtro().soloAlquilables })"
            >Solo alquilables</ion-chip
          >
          <ion-chip [class.activo]="(filtro().plataforma ?? null) !== null" (click)="elegirPlataforma()"
            >Plataforma: {{ nombrePlataforma() }}<ja-icono nombre="expand_more"
          /></ion-chip>
          <ion-chip [class.activo]="(filtro().genero ?? null) !== null" (click)="elegirGenero()"
            >Género: {{ filtro().genero ?? 'Todos' }}<ja-icono nombre="expand_more"
          /></ion-chip>
          <ion-chip [class.activo]="(filtro().pegi ?? null) !== null" (click)="elegirPegi()"
            >PEGI: {{ filtro().pegi ?? 'Todos' }}<ja-icono nombre="expand_more"
          /></ion-chip>
        }
        @if (tipo() === 'movil') {
          <ion-chip [class.activo]="!filtro().formato" (click)="cambiar({ formato: null })">Todos</ion-chip>
          <ion-chip [class.activo]="filtro().formato === 'movil'" (click)="cambiar({ formato: 'movil' })"
            >Móviles</ion-chip
          >
          <ion-chip [class.activo]="filtro().formato === 'tablet'" (click)="cambiar({ formato: 'tablet' })"
            >Tablets</ion-chip
          >
        }
        <ion-chip [class.activo]="(filtro().marca ?? null) !== null" (click)="elegirMarca()"
          >Marca: {{ nombreMarca() }}<ja-icono nombre="expand_more"
        /></ion-chip>
        <ion-chip [class.activo]="filtro().orden !== 'nombre'" (click)="elegirOrden()"
          >Ordenar: {{ textoOrden() }}<ja-icono nombre="expand_more"
        /></ion-chip>
      </div>
      @if (!cargando() && !error()) {
        <div class="contador ja-contador">
          {{ total() }} {{ total() === 1 ? 'producto encontrado' : 'productos encontrados' }}
        </div>
      }

      @if (mostrarCabecera()) {
        <div class="seccion">
          @if (tipo() === 'videojuego' && paraAlquilar().length) {
            <div class="ja-entre">
              <div class="ja-titular-m">Para alquilar</div>
              <ion-button fill="clear" color="secondary" (click)="cambiar({ soloAlquilables: true })"
                >Ver todo<ja-icono slot="end" nombre="arrow_forward"
              /></ion-button>
            </div>
            <div class="carrusel">
              @for (p of paraAlquilar(); track p.id) {
                <ion-card class="mini ja-tarjeta" [routerLink]="['/producto', p.tipo, p.id]">
                  <ja-imagen [src]="p.imagen" [alt]="'Imagen de ' + p.nombre" />
                  <div class="datos">
                    <div class="nombre">{{ p.nombre }}</div>
                    <div class="ja-etiqueta-s ja-t2">{{ p.marca?.nombre }} · {{ p.plataforma?.nombre }}</div>
                    <div class="ja-precio-s">{{ formatoPrecio(p.precio) }}</div>
                    <span class="ja-chip-alquiler">Alquiler {{ precioAlquiler(p) }}/día</span>
                  </div>
                </ion-card>
              }
            </div>
          }
          <ion-card class="reparamos ja-tarjeta">
            <div class="fila">
              <div class="circulo"><ja-icono nombre="build" /></div>
              <div>
                <div class="ja-titulo">Reparamos tu dispositivo</div>
                <div class="ja-cuerpo ja-t2">¿Pantalla rota o mando con drift? Pide presupuesto sin compromiso.</div>
              </div>
            </div>
            <ion-button fill="outline" color="secondary" routerLink="/reparaciones/nueva"
              >Solicitar reparación</ion-button
            >
          </ion-card>
          <div class="ja-titular-m">Todo el catálogo</div>
        </div>
      }

      <div class="lista">
        @if (cargando() && !productos().length) {
          <ja-estado tipo="cargando" />
        } @else if (error()) {
          <ja-estado
            tipo="error"
            titulo="No hemos podido cargar el catálogo"
            [texto]="error()"
            (reintentar)="cargar(1)"
          />
        } @else if (!productos().length) {
          <ja-estado tipo="vacio" titulo="No hay nada por aquí" texto="Prueba con otra búsqueda o quita los filtros." />
        } @else {
          <div class="ja-lista">
            @for (p of productos(); track p.id) {
              <ja-producto-tarjeta [producto]="p" />
            }
          </div>
        }
      </div>
      <ion-infinite-scroll [disabled]="!hayMas()" (ionInfinite)="masResultados($event)"
        ><ion-infinite-scroll-content
      /></ion-infinite-scroll>
    </ion-content>
  `,
})
export class InicioPage implements OnInit {
  private readonly catalogo = inject(CatalogoService);
  private readonly hojas = inject(ActionSheetController);
  private readonly ubicacion = inject(UbicacionService);
  private readonly agitar = inject(AgitarService);
  private readonly destruir = inject(DestroyRef);
  private readonly router = inject(Router);
  readonly voz = inject(VozService);

  readonly q = input<string>();
  readonly pestana = input<TipoProducto>();

  readonly tipo = signal<TipoProducto>('videojuego');
  readonly texto = signal('');
  private readonly filtros = signal<Record<TipoProducto, Filtro>>({
    videojuego: { tipo: 'videojuego', orden: 'nombre' },
    movil: { tipo: 'movil', orden: 'nombre' },
    consola: { tipo: 'consola', orden: 'nombre' },
  });
  readonly filtro = computed(() => this.filtros()[this.tipo()]);
  readonly conFiltros = computed(() => hayFiltros(this.filtro()));
  readonly mostrarCabecera = computed(() => !this.texto() && !this.conFiltros());

  readonly productos = signal<Producto[]>([]);
  readonly paraAlquilar = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly hayMas = signal(false);
  readonly total = signal(0);
  readonly formatoPrecio = precio;
  readonly buscadorOculto = signal(false);

  private readonly plataformas = signal<Referencia[]>([]);
  private readonly marcas = signal<Referencia[]>([]);
  private generos: string[] = [];
  readonly nombrePlataforma = computed(
    () => this.plataformas().find((r) => r.id === this.filtro().plataforma)?.nombre ?? 'Todas',
  );
  readonly nombreMarca = computed(() => this.marcas().find((r) => r.id === this.filtro().marca)?.nombre ?? 'Todas');
  readonly textoOrden = computed(() => ORDENES.find((o) => o.valor === this.filtro().orden)!.texto);

  private pagina = 1;
  private peticion?: Subscription;
  private scrollAnterior = 0;

  ngOnInit(): void {
    this.cargar(1);
    this.catalogo.plataformas().subscribe({ next: (l) => this.plataformas.set(l), error: () => undefined });
    this.catalogo.marcas().subscribe({ next: (l) => this.marcas.set(l), error: () => undefined });
    this.catalogo.generos().subscribe({ next: (l) => (this.generos = l), error: () => undefined });
    void this.ubicacion.pedirConAviso();
    void this.agitar.iniciar();
    this.agitar.agitado$.pipe(takeUntilDestroyed(this.destruir)).subscribe(() => {
      if (this.router.url.startsWith('/inicio')) {
        this.agitar.avisar();
        this.cargar(1);
      }
    });
  }

  ionViewWillEnter(): void {
    const q = this.q();
    if (q !== undefined && q !== this.texto()) {
      this.texto.set(q);
      this.cargar(1);
    }
    const pestana = this.pestana();
    if (pestana && pestana !== this.tipo()) {
      this.cambiarPestana(pestana);
    }
  }

  private cargarCarrusel(): void {
    this.catalogo
      .listar({ tipo: 'videojuego', soloAlquilables: true, orden: 'nombre' }, 1, 8)
      .subscribe({ next: (r) => this.paraAlquilar.set(r.items), error: () => undefined });
  }

  cargar(pagina: number, alTerminar?: () => void): void {
    if (pagina === 1 && !this.paraAlquilar().length) {
      this.cargarCarrusel();
    }
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.error.set('');
    this.peticion = this.catalogo.listar({ ...this.filtro(), texto: this.texto() }, pagina).subscribe({
      next: (r) => {
        this.pagina = pagina;
        this.productos.set(pagina === 1 ? r.items : [...this.productos(), ...r.items]);
        this.hayMas.set(r.page * POR_PAGINA < r.total);
        this.total.set(r.total);
        this.cargando.set(false);
        alTerminar?.();
      },
      error: (e: ApiError) => {
        this.cargando.set(false);
        this.error.set(e.mensaje);
        alTerminar?.();
      },
    });
  }

  buscar(valor: string): void {
    this.texto.set(valor);
    this.cargar(1);
  }

  cambiarPestana(tipo: TipoProducto): void {
    if (tipo !== this.tipo()) {
      this.tipo.set(tipo);
      this.productos.set([]);
      this.cargar(1);
    }
  }

  cambiar(cambios: Partial<Filtro>): void {
    this.filtros.update((f) => ({ ...f, [this.tipo()]: { ...f[this.tipo()], ...cambios } }));
    this.cargar(1);
  }

  quitarFiltros(): void {
    this.filtros.update((f) => ({ ...f, [this.tipo()]: { tipo: this.tipo(), orden: 'nombre' } }));
    this.cargar(1);
  }

  refrescar(e: Event): void {
    this.cargar(1, () => void (e.target as HTMLIonRefresherElement).complete());
  }

  masResultados(e: Event): void {
    this.cargar(this.pagina + 1, () => void (e.target as HTMLIonInfiniteScrollElement).complete());
  }

  alDesplazar(y: number): void {
    if (Math.abs(y - this.scrollAnterior) > 12) {
      this.buscadorOculto.set(y > this.scrollAnterior && y > 80);
      this.scrollAnterior = y;
    }
  }

  precioAlquiler(p: Producto): string {
    return precio(p.precioAlquiler);
  }

  elegirPlataforma(): void {
    void this.elegir(
      'Plataforma',
      'Todas',
      this.plataformas().map((r) => ({ texto: r.nombre, valor: r.id })),
      (v) => this.cambiar({ plataforma: v }),
    );
  }

  elegirGenero(): void {
    void this.elegir(
      'Género',
      'Todos',
      this.generos.map((g) => ({ texto: g, valor: g })),
      (v) => this.cambiar({ genero: v }),
    );
  }

  elegirPegi(): void {
    void this.elegir(
      'PEGI',
      'Todos',
      [3, 7, 12, 16, 18].map((n) => ({ texto: String(n), valor: n })),
      (v) => this.cambiar({ pegi: v }),
    );
  }

  elegirMarca(): void {
    void this.elegir(
      'Marca',
      'Todas',
      this.marcas().map((r) => ({ texto: r.nombre, valor: r.id })),
      (v) => this.cambiar({ marca: v }),
    );
  }

  elegirOrden(): void {
    void this.elegir(
      'Ordenar',
      null,
      ORDENES.map((o) => ({ texto: o.texto, valor: o.valor })),
      (v) => this.cambiar({ orden: v ?? 'nombre' }),
    );
  }

  private async elegir<T>(
    titulo: string,
    todas: string | null,
    opciones: { texto: string; valor: T }[],
    alElegir: (v: T | null) => void,
  ): Promise<void> {
    const botones = opciones.map((o) => ({ text: o.texto, handler: () => alElegir(o.valor) }));
    const hoja = await this.hojas.create({
      header: titulo,
      buttons: todas ? [{ text: todas, handler: () => alElegir(null) }, ...botones] : botones,
    });
    await hoja.present();
  }
}
