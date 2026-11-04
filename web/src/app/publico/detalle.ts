import {
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  resource,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { environment } from '../../environments/environment';
import { Catalogo } from '../core/catalogo';
import { decimal, precio, subtituloProducto, TIPOS } from '../core/formato';
import type { Producto } from '../core/modelos';
import { EstadoVista } from '../shared/estado-vista';
import { Icono } from '../shared/icono';
import { Imagen } from '../shared/imagen';
import { TarjetaProducto } from '../shared/tarjeta-producto';

interface Caracteristica {
  nombre: string;
  valor: string;
}

/**
 * PW-03 Detalle de producto (público). Ficha con los campos comunes y los del subtipo
 * (GET /productos/{id}). En lugar de «Comprar», un aviso de que se compra o alquila en la app.
 * Abajo, otros productos del mismo tipo.
 */
@Component({
  selector: 'ja-detalle',
  imports: [RouterLink, EstadoVista, Icono, Imagen, TarjetaProducto],
  styleUrl: './detalle.scss',
  templateUrl: './detalle.html',
})
export class Detalle {
  private readonly catalogo = inject(Catalogo);
  private readonly titulo = inject(Title);

  readonly id = input.required({ transform: numberAttribute });

  protected readonly tipos = TIPOS;
  protected readonly precio = precio;
  protected readonly apkUrl = environment.apkUrl;

  protected readonly producto = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params }) => this.catalogo.producto(params.id),
  });

  /** Otros 4 del mismo tipo (sin el que se está viendo). */
  protected readonly relacionados = resource({
    params: () =>
      this.producto.hasValue()
        ? { tipo: this.producto.value().tipo, id: this.producto.value().id }
        : undefined,
    loader: async ({ params }) => {
      const pagina = await this.catalogo.listar(params.tipo, { limit: 5 });
      return pagina.items.filter((p) => p.id !== params.id).slice(0, 4);
    },
  });

  protected readonly subtitulo = computed(() =>
    this.producto.hasValue() ? subtituloProducto(this.producto.value()) : '',
  );

  protected readonly caracteristicas = computed<Caracteristica[]>(() => {
    if (!this.producto.hasValue()) {
      return [];
    }
    const p: Producto = this.producto.value();
    const lista: (Caracteristica | null)[] = [
      p.marca ? { nombre: 'Marca', valor: p.marca.nombre } : null,
      p.plataforma ? { nombre: 'Plataforma', valor: p.plataforma.nombre } : null,
      p.genero ? { nombre: 'Género', valor: p.genero } : null,
      p.pegi ? { nombre: 'Edad recomendada', valor: `PEGI ${p.pegi}` } : null,
      p.formato ? { nombre: 'Formato', valor: p.formato === 'tablet' ? 'Tablet' : 'Móvil' } : null,
      p.pantallaPulgadas
        ? { nombre: 'Pantalla', valor: `${decimal(p.pantallaPulgadas)} pulgadas` }
        : null,
      p.ramGb ? { nombre: 'Memoria RAM', valor: `${p.ramGb} GB` } : null,
      p.almacenamientoGb ? { nombre: 'Almacenamiento', valor: `${p.almacenamientoGb} GB` } : null,
      p.modelo ? { nombre: 'Modelo', valor: p.modelo } : null,
    ];
    return lista.filter((c): c is Caracteristica => c !== null);
  });

  constructor() {
    // El título de la pestaña del navegador es el nombre del producto
    effect(() => {
      if (this.producto.hasValue()) {
        this.titulo.setTitle(`${this.producto.value().nombre} · Almi Companion`);
      }
    });
  }
}
