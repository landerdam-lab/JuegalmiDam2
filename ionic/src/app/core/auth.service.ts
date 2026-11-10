import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, of, switchMap, tap, throwError } from 'rxjs';

import { ApiError } from './api-error';
import { ApiService } from './api.service';
import { CarritoService } from './carrito.service';
import type { LoginRespuesta, Usuario } from './modelos';
import { SesionService } from './sesion.service';

export interface DatosRegistro {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  telefono: string;
  dni: string;
}

/** Login, registro, sesión y perfil. Las páginas solo hablan con este servicio. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly sesion = inject(SesionService);
  private readonly carrito = inject(CarritoService);

  /**
   * POST /login. Las apps son solo para clientes (ADR-024): a un técnico o admin no se le guarda
   * la sesión: se cierra en la API el token que se acaba de crear y se le avisa.
   */
  login(email: string, password: string): Observable<Usuario> {
    return this.api.post<LoginRespuesta>('login', { email, password }).pipe(
      switchMap((r) => {
        this.sesion.guardar(r.token, r.expira, r.usuario);
        if (r.usuario.tipo === 'cliente') {
          this.carrito.deUsuario(r.usuario.id);
          return of(r.usuario);
        }
        this.logout();
        return throwError(
          () =>
            new ApiError(
              403,
              'SOLO_CLIENTES',
              'Esta app es para clientes. La gestión de la tienda se hace desde la web.',
            ),
        );
      }),
    );
  }

  /** POST /registro: crea siempre un cliente; después hay que iniciar sesión. */
  registro(datos: DatosRegistro): Observable<Usuario> {
    return this.api.post<Usuario>('registro', datos);
  }

  /** GET /me: comprueba que el token sigue valiendo (splash) y refresca los datos del usuario. */
  comprobarSesion(): Observable<Usuario> {
    return this.api.get<Usuario>('me').pipe(tap((u) => this.sesion.actualizarUsuario(u)));
  }

  /** PUT /me: nombre, apellidos, teléfono o foto. El email y el DNI solo los cambia el admin. */
  actualizarPerfil(cambios: Partial<Pick<Usuario, 'nombre' | 'apellidos' | 'telefono' | 'foto'>>): Observable<Usuario> {
    return this.api.put<Usuario>('me', cambios).pipe(tap((u) => this.sesion.actualizarUsuario(u)));
  }

  /** POST /logout: borra el token en la API. La sesión local se borra aunque falle la red. */
  logout(): void {
    const peticion = this.api.post<void>('logout').pipe(map(() => undefined));
    // El interceptor lee el token al suscribirse: primero se envía, luego se borra
    peticion.subscribe({ error: () => undefined });
    this.sesion.cerrar();
    this.carrito.vaciar();
  }
}
