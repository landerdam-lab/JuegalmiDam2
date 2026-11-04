import { Component, computed, inject, input, numberAttribute, resource } from '@angular/core';
import { Router } from '@angular/router';

import { coordenada, fechaHora } from '../core/formato';
import { Personas } from '../core/personas';
import { Ubicaciones } from '../core/ubicaciones';
import { EstadoVista } from '../shared/estado-vista';
import { Icono } from '../shared/icono';
import { type MarcaMapa, Mapa } from '../shared/mapa';
import { Paginador } from '../shared/paginador';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * PW-18 Registro de ubicaciones (RF-11). Las apps envían X-Latitud / X-Longitud en cada petición
 * (ADR-014) y la API guarda un registro por consulta. Aquí se ve en un mapa y en una tabla,
 * filtrando por cliente y por fechas: sirve para enseñar en la demo que se geolocaliza al usuario.
 */
@Component({
  selector: 'ja-ubicaciones-admin',
  imports: [EstadoVista, Icono, Mapa, Paginador],
  styles: `
    ja-mapa {
      --alto: 420px;
      margin-bottom: var(--ja-espacio-4);
    }
    .metodo {
      display: inline-block;
      min-width: 44px;
      font: var(--ja-tipo-codigo);
      color: var(--ja-marca);
    }
    .ruta {
      font: var(--ja-tipo-codigo);
      color: var(--ja-texto-2);
      word-break: break-all;
    }
    .resumen {
      display: flex;
      align-items: center;
      gap: var(--ja-espacio-2);
      margin-bottom: var(--ja-espacio-3);
      color: var(--ja-texto-2);
      font: var(--ja-tipo-etiqueta);
      --tam: var(--ja-tamano-icono-s);
    }
  `,
  template: `
    <header class="ja-admin-cabecera">
      <div>
        <h1>Registro de ubicaciones</h1>
        <p>Dónde estaba cada cliente cuando usó la app. Se guarda un punto en cada consulta.</p>
      </div>
    </header>

    <div class="ja-filtros">
      <div class="ja-campo ja-campo--ancho">
        <label for="u-cliente">Cliente</label>
        <select id="u-cliente" (change)="navegar({ usuario: valor($event) || null })">
          <option value="">Todos los clientes</option>
          @if (clientes.hasValue()) {
            @for (c of clientes.value().items; track c.id) {
              <option [value]="c.id" [selected]="usuario() === c.id">
                {{ c.nombre }} {{ c.apellidos }} ({{ c.email }})
              </option>
            }
          }
        </select>
      </div>
      <div class="ja-campo">
        <label for="u-desde">Desde</label>
        <input
          id="u-desde"
          type="date"
          [value]="desde()"
          (change)="navegar({ desde: valor($event) || null })"
        />
      </div>
      <div class="ja-campo">
        <label for="u-hasta">Hasta</label>
        <input
          id="u-hasta"
          type="date"
          [value]="hasta()"
          (change)="navegar({ hasta: valor($event) || null })"
        />
      </div>
    </div>

    @if (registros.hasValue()) {
      @if (registros.value().items.length) {
        <p class="resumen">
          <ja-icono nombre="pin_drop" />{{ registros.value().total }} registros · en el mapa, los
          {{ registros.value().items.length }} de esta página
        </p>
        <ja-mapa [marcas]="marcas()" etiqueta="Mapa con las ubicaciones registradas" />
        <div class="ja-tabla-caja">
          <table class="ja-tabla">
            <caption class="ja-oculto">
              Registros de ubicación
            </caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Usuario</th>
                <th scope="col">Consulta</th>
                <th scope="col">Coordenadas</th>
              </tr>
            </thead>
            <tbody>
              @for (r of registros.value().items; track r.id) {
                <tr>
                  <td class="codigo">{{ fechaHora(r.fecha) }}</td>
                  <td>
                    <div class="fuerte">{{ r.usuario.nombre }}</div>
                    <div class="ja-etiqueta-s ja-t2">{{ r.usuario.email }}</div>
                  </td>
                  <td>
                    <span class="metodo">{{ r.metodo }}</span>
                    <span class="ruta">{{ r.ruta }}</span>
                  </td>
                  <td>
                    <a
                      class="codigo"
                      [href]="
                        'https://www.openstreetmap.org/?mlat=' +
                        r.latitud +
                        '&mlon=' +
                        r.longitud +
                        '#map=17/' +
                        r.latitud +
                        '/' +
                        r.longitud
                      "
                      target="_blank"
                      rel="noopener"
                    >
                      {{ coordenada(r.latitud) }}, {{ coordenada(r.longitud) }}
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <ja-paginador
          [page]="registros.value().page"
          [limit]="registros.value().limit"
          [total]="registros.value().total"
          (cambiar)="navegar({ page: $event })"
        />
      } @else {
        <ja-estado-vista
          tipo="vacio"
          icono="pin_drop"
          titulo="No hay ubicaciones con esos filtros"
          texto="Se registran cuando un cliente usa la app con la ubicación activada."
        />
      }
    } @else if (registros.error()) {
      <ja-estado-vista tipo="error" (reintentar)="registros.reload()" />
    } @else {
      <ja-estado-vista tipo="cargando" />
    }
  `,
})
export class UbicacionesAdmin {
  private readonly ubicaciones = inject(Ubicaciones);
  private readonly personas = inject(Personas);
  private readonly router = inject(Router);

  readonly usuario = input(null, { transform: (v: unknown) => (v ? numberAttribute(v) : null) });
  readonly desde = input('', {
    transform: (v: unknown) => (typeof v === 'string' && FECHA.test(v) ? v : ''),
  });
  readonly hasta = input('', {
    transform: (v: unknown) => (typeof v === 'string' && FECHA.test(v) ? v : ''),
  });
  readonly page = input(1, { transform: (v: unknown) => numberAttribute(v, 1) });

  protected readonly fechaHora = fechaHora;
  protected readonly coordenada = coordenada;

  protected readonly clientes = resource({ loader: () => this.personas.clientes({ limit: 100 }) });
  protected readonly registros = resource({
    params: () => ({
      usuario: this.usuario(),
      desde: this.desde(),
      hasta: this.hasta(),
      page: this.page(),
    }),
    loader: ({ params }) => this.ubicaciones.listar({ ...params, limit: 50 }),
  });

  protected readonly marcas = computed<MarcaMapa[]>(() =>
    this.registros.hasValue()
      ? this.registros.value().items.map((r) => ({
          latitud: r.latitud,
          longitud: r.longitud,
          tipo: 'cliente',
          titulo: `${r.usuario.nombre} · ${fechaHora(r.fecha)}`,
        }))
      : [],
  );

  protected navegar(cambios: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      queryParams: { page: null, ...cambios },
      queryParamsHandling: 'merge',
    });
  }

  protected valor(e: Event): string {
    return (e.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
