import {
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  resource,
  signal,
  untracked,
} from '@angular/core';
import { applyWhen, form, FormField, FormRoot, min, required } from '@angular/forms/signals';
import { Router } from '@angular/router';

import { ApiError } from '../core/api-error';
import { Avisos } from '../core/avisos';
import { Catalogo, type DatosProducto } from '../core/catalogo';
import { precio, subtituloProducto, TIPOS } from '../core/formato';
import type { Producto, TipoProducto } from '../core/modelos';
import { Dialogos } from '../shared/dialogos';
import { ErrorCampo } from '../shared/error-campo';
import { EstadoVista } from '../shared/estado-vista';
import { Hoja } from '../shared/hoja';
import { Icono } from '../shared/icono';
import { Imagen } from '../shared/imagen';
import { Paginador } from '../shared/paginador';
import { Pastilla } from '../shared/pastilla';
import { SubirImagen } from '../shared/subir-imagen';
import { Vida } from '../shared/vida';
import { estaEnUso, mensajeError } from './errores';
import { ProveedoresProducto } from './proveedores-producto';

const POR_PAGINA = 15;
const TIPOS_VALIDOS: TipoProducto[] = ['videojuego', 'movil', 'consola'];

/** Modelo del formulario: todos los campos de los tres subtipos (cada tipo usa los suyos). */
interface ModeloProducto {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  marcaId: string;
  activo: boolean;
  // Videojuego
  plataformaId: string;
  genero: string;
  pegi: string;
  precioAlquiler: number;
  copiasAlquiler: number;
  // Móvil
  formato: string;
  pantallaPulgadas: number;
  ramGb: number;
  // Móvil y consola
  almacenamientoGb: number;
  // Consola
  modelo: string;
}

const VACIO: ModeloProducto = {
  nombre: '',
  descripcion: '',
  precio: 0,
  stock: 0,
  marcaId: '',
  activo: true,
  plataformaId: '',
  genero: '',
  pegi: '12',
  precioAlquiler: 0,
  copiasAlquiler: 0,
  formato: 'movil',
  pantallaPulgadas: 6.1,
  ramGb: 8,
  almacenamientoGb: 128,
  modelo: '',
};

/**
 * PW-11 Productos (RF-16, RF-09): tabla por tipo con buscador y activos/retirados; alta y edición
 * en una hoja lateral; retirar = baja lógica (ADR-018); borrar solo si nunca se vendió ni alquiló.
 * La URL guarda la pestaña y los filtros (?tipo=consola&retirados=1&page=2).
 */
@Component({
  selector: 'ja-productos',
  imports: [
    FormField,
    FormRoot,
    ErrorCampo,
    EstadoVista,
    Hoja,
    Icono,
    Imagen,
    Paginador,
    Pastilla,
    ProveedoresProducto,
    SubirImagen,
    Vida,
  ],
  styleUrl: './productos.scss',
  templateUrl: './productos.html',
})
export class Productos {
  private readonly catalogo = inject(Catalogo);
  private readonly router = inject(Router);
  private readonly avisos = inject(Avisos);
  private readonly dialogos = inject(Dialogos);

  // ── URL ──
  readonly tipo = input<TipoProducto, unknown>('videojuego', {
    transform: (v) =>
      TIPOS_VALIDOS.includes(v as TipoProducto) ? (v as TipoProducto) : 'videojuego',
  });
  readonly q = input('', { transform: (v: unknown) => (typeof v === 'string' ? v : '') });
  readonly retirados = input(false, { transform: (v: unknown) => v === '1' });
  readonly page = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });
  /** ?editar=ID abre la ficha de ese producto (enlace desde el Resumen). */
  readonly editar = input(null, { transform: (v: unknown) => (v ? numberAttribute(v) : null) });

  protected readonly tipos = TIPOS;
  protected readonly listaTipos = TIPOS_VALIDOS;
  protected readonly precio = precio;
  protected readonly subtitulo = subtituloProducto;
  protected readonly edadesPegi = ['3', '7', '12', '16', '18'];

  protected readonly productos = resource({
    params: () => ({
      tipo: this.tipo(),
      q: this.q(),
      activo: (this.retirados() ? 0 : 1) as 0 | 1,
      page: this.page(),
    }),
    loader: ({ params }) =>
      this.catalogo.listar(params.tipo, {
        q: params.q,
        activo: params.activo,
        page: params.page,
        limit: POR_PAGINA,
      }),
  });
  protected readonly marcas = resource({ loader: () => this.catalogo.marcas() });
  protected readonly plataformas = resource({ loader: () => this.catalogo.plataformas() });

  // ── Hoja de alta / edición ──
  protected readonly hojaAbierta = signal(false);
  /** null = alta nueva; si no, el producto que se edita. */
  protected readonly editando = signal<Producto | null>(null);
  protected readonly tipoForm = signal<TipoProducto>('videojuego');
  protected readonly imagen = signal<string | null>(null);
  protected readonly errorForm = signal('');

  private readonly modelo = signal<ModeloProducto>({ ...VACIO });

  protected readonly formulario = form(
    this.modelo,
    (c) => {
      required(c.nombre, { message: 'Escribe el nombre del producto.' });
      required(c.marcaId, { message: 'Elige la marca.' });
      min(c.precio, 0, { message: 'El precio no puede ser negativo.' });
      min(c.stock, 0, { message: 'El stock no puede ser negativo.' });
      applyWhen(
        c,
        () => this.tipoForm() === 'videojuego',
        (v) => {
          required(v.plataformaId, { message: 'Elige la plataforma.' });
          required(v.genero, { message: 'Escribe el género (por ejemplo, Aventura).' });
          min(v.precioAlquiler, 0, { message: 'El precio de alquiler no puede ser negativo.' });
          min(v.copiasAlquiler, 0, { message: 'Las copias no pueden ser negativas.' });
        },
      );
      applyWhen(
        c,
        () => this.tipoForm() === 'movil',
        (m) => {
          min(m.pantallaPulgadas, 1, { message: 'Indica las pulgadas de la pantalla.' });
          min(m.ramGb, 1, { message: 'Indica la memoria RAM en GB.' });
        },
      );
      applyWhen(
        c,
        () => this.tipoForm() !== 'videojuego',
        (d) => {
          min(d.almacenamientoGb, 1, { message: 'Indica el almacenamiento en GB.' });
        },
      );
      applyWhen(
        c,
        () => this.tipoForm() === 'consola',
        (k) => {
          required(k.modelo, { message: 'Escribe el modelo de la consola.' });
        },
      );
    },
    {
      submission: {
        action: async (f) => {
          this.errorForm.set('');
          const datos = this.datosParaApi(f().value());
          const editando = this.editando();
          try {
            if (editando) {
              // PUT parcial: solo lo que se ha cambiado en el formulario. Si se enviara todo, un valor
              // que la API ha cambiado mientras tanto (el stock al cancelar un pedido) se pisaría (A-46).
              const cambios = this.soloCambios(datos, this.originales);
              if (Object.keys(cambios).length) {
                await this.catalogo.actualizarProducto(this.tipoForm(), editando.id, cambios);
              }
              this.avisos.exito(`«${datos['nombre']}» guardado.`);
            } else {
              await this.catalogo.crearProducto(this.tipoForm(), datos);
              this.avisos.exito(`«${datos['nombre']}» añadido al catálogo.`);
            }
            this.cerrarHoja();
            this.productos.reload();
            return undefined;
          } catch (e) {
            const err = ApiError.de(e);
            this.errorForm.set(mensajeError(e));
            // Los errores de un campo (422) se ponen debajo de ese campo
            return Object.entries(err.campos)
              .filter(([campo]) => campo in VACIO)
              .map(([campo, mensaje]) => ({
                kind: 'servidor',
                message: mensaje,
                fieldTree: f[campo as keyof ModeloProducto],
              }));
          }
        },
      },
    },
  );

  constructor() {
    // Enlace ?editar=ID: se pide el producto y se abre su ficha
    effect(() => {
      const id = this.editar();
      if (id) {
        untracked(() => void this.abrirPorId(id));
      }
    });
  }

  // ── Filtros (en la URL) ──

  private temporizador?: ReturnType<typeof setTimeout>;

  protected navegar(cambios: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      queryParams: { ...cambios },
      queryParamsHandling: 'merge',
      replaceUrl: 'q' in cambios,
    });
  }

  protected cambiarTipo(tipo: TipoProducto): void {
    void this.router.navigate([], {
      queryParams: { tipo, retirados: this.retirados() ? 1 : null },
    });
  }

  protected buscar(texto: string): void {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(
      () => this.navegar({ q: texto.trim() || null, page: null }),
      300,
    );
  }

  protected valor(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  // ── Hoja ──

  protected nuevo(): void {
    this.editando.set(null);
    this.tipoForm.set(this.tipo());
    this.imagen.set(null);
    this.modelo.set({ ...VACIO });
    this.formulario().reset();
    this.errorForm.set('');
    this.hojaAbierta.set(true);
  }

  protected abrirEdicion(p: Producto): void {
    this.editando.set(p);
    this.tipoForm.set(p.tipo);
    this.imagen.set(p.imagen);
    this.modelo.set({
      ...VACIO,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: p.precio,
      stock: p.stock ?? 0,
      marcaId: p.marca ? String(p.marca.id) : '',
      activo: p.activo,
      plataformaId: p.plataforma ? String(p.plataforma.id) : '',
      genero: p.genero ?? '',
      pegi: p.pegi ? String(p.pegi) : '12',
      precioAlquiler: p.precioAlquiler ?? 0,
      copiasAlquiler: p.copiasAlquiler ?? 0,
      formato: p.formato ?? 'movil',
      pantallaPulgadas: p.pantallaPulgadas ?? 0,
      ramGb: p.ramGb ?? 0,
      almacenamientoGb: p.almacenamientoGb ?? 0,
      modelo: p.modelo ?? '',
    });
    // Lo que había al abrir: al guardar solo se envía lo que sea distinto de esto
    this.originales = this.datosParaApi(this.modelo());
    this.formulario().reset();
    this.errorForm.set('');
    this.hojaAbierta.set(true);
  }

  /** Datos del producto tal y como estaban al abrir la hoja de edición. */
  private originales: DatosProducto = {};

  /** Los campos de «datos» que han cambiado respecto a «antes». */
  private soloCambios(datos: DatosProducto, antes: DatosProducto): DatosProducto {
    return Object.fromEntries(
      Object.entries(datos).filter(([campo, valor]) => antes[campo] !== valor),
    );
  }

  protected cerrarHoja(): void {
    this.hojaAbierta.set(false);
    if (this.editar()) {
      this.navegar({ editar: null });
    }
  }

  private async abrirPorId(id: number): Promise<void> {
    try {
      this.abrirEdicion(await this.catalogo.producto(id));
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }

  /** Solo se envían los campos del tipo que se guarda, con los nombres y tipos que espera la API. */
  private datosParaApi(m: ModeloProducto): DatosProducto {
    const datos: DatosProducto = {
      nombre: m.nombre.trim(),
      descripcion: m.descripcion.trim() || null,
      precio: m.precio,
      stock: m.stock,
      imagen: this.imagen(),
      marcaId: Number(m.marcaId),
      activo: m.activo,
    };
    if (this.tipoForm() === 'videojuego') {
      Object.assign(datos, {
        plataformaId: Number(m.plataformaId),
        genero: m.genero.trim(),
        pegi: Number(m.pegi),
        precioAlquiler: m.precioAlquiler,
        copiasAlquiler: m.copiasAlquiler,
      });
    } else if (this.tipoForm() === 'movil') {
      Object.assign(datos, {
        formato: m.formato,
        pantallaPulgadas: m.pantallaPulgadas,
        ramGb: m.ramGb,
        almacenamientoGb: m.almacenamientoGb,
      });
    } else {
      Object.assign(datos, { modelo: m.modelo.trim(), almacenamientoGb: m.almacenamientoGb });
    }
    return datos;
  }

  // ── Acciones de la tabla ──

  /** Retirar del catálogo (activo = false) o volver a ponerlo a la venta. */
  protected async cambiarActivo(p: Producto): Promise<void> {
    try {
      await this.catalogo.actualizarProducto(p.tipo, p.id, { activo: !p.activo });
      this.avisos.exito(
        p.activo
          ? `«${p.nombre}» retirado del catálogo.`
          : `«${p.nombre}» vuelve a estar a la venta.`,
      );
      this.productos.reload();
    } catch (e) {
      this.avisos.error(mensajeError(e));
    }
  }

  protected async borrar(p: Producto): Promise<void> {
    const si = await this.dialogos.confirmar({
      titulo: `¿Borrar «${p.nombre}»?`,
      texto:
        'Se borra del todo y no se puede deshacer. Si se ha vendido o alquilado alguna vez, la API no lo permitirá y podrás retirarlo en su lugar.',
      aceptar: 'Borrar',
      peligro: true,
    });
    if (!si) {
      return;
    }
    try {
      await this.catalogo.borrarProducto(p.tipo, p.id);
      this.avisos.exito(`«${p.nombre}» borrado.`);
      this.productos.reload();
    } catch (e) {
      if (estaEnUso(e) && p.activo) {
        const retirar = await this.dialogos.confirmar({
          titulo: 'No se puede borrar',
          texto: `«${p.nombre}» tiene ventas o alquileres. ¿Quieres retirarlo del catálogo? Seguirá en los pedidos antiguos.`,
          aceptar: 'Retirar del catálogo',
        });
        if (retirar) {
          await this.cambiarActivo(p);
        }
      } else {
        this.avisos.error(mensajeError(e));
      }
    }
  }

  /** Segmentos llenos de la barra de copias (5 segmentos, DESIGN.md §1). */
  protected copias(p: Producto): number {
    const total = p.copiasAlquiler ?? 0;
    return total ? Math.round(((p.copiasDisponibles ?? 0) / total) * 5) : 0;
  }

  protected readonly tituloHoja = computed(() => {
    const nuevo: Record<TipoProducto, string> = {
      videojuego: 'Nuevo videojuego',
      movil: 'Nuevo móvil o tablet',
      consola: 'Nueva consola',
    };
    return this.editando() ? `Editar: ${this.editando()?.nombre}` : nuevo[this.tipoForm()];
  });
}
