import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from './api.service';
import type { Alquiler, Entrega, LineaPeticion, Pagina, Pedido } from './modelos';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly api = inject(ApiService);

  listar(estado: string | null, pagina: number): Observable<Pagina<Pedido>> {
    return this.api.get<Pagina<Pedido>>('pedidos', { estado, page: pagina, limit: 20 });
  }

  detalle(id: number): Observable<Pedido> {
    return this.api.get<Pedido>(`pedidos/${id}`);
  }

  crear(lineas: LineaPeticion[], metodoPago: string, entrega: Entrega): Observable<Pedido> {
    return this.api.post<Pedido>('pedidos', { lineas, metodoPago, ...entrega });
  }

  cancelar(id: number): Observable<Pedido> {
    return this.api.put<Pedido>(`pedidos/${id}`, { estado: 'cancelado' });
  }

  alquileres(estado: string, pagina: number): Observable<Pagina<Alquiler>> {
    return this.api.get<Pagina<Alquiler>>('alquileres', { estado, page: pagina, limit: 20 });
  }
}
