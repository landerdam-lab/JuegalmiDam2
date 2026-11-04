import { Service, inject } from '@angular/core';

import { Api } from './api';
import { ApiError } from './api-error';
import type { LoginRespuesta, Usuario } from './modelos';
import { Sesion } from './sesion';

/** Login, sesión y perfil del backoffice (PW-05). Las pantallas solo hablan con este servicio. */
@Service()
export class Auth {
  private readonly api = inject(Api);
  private readonly sesion = inject(Sesion);

  /**
   * POST /login. El backoffice es solo para trabajadores (admin y técnicos, ADR-032):
   * si entra un cliente, se cierra en la API el token que se acaba de crear y se le avisa.
   * Es el caso contrario al de las apps, que solo admiten clientes (ADR-024).
   */
  async login(email: string, password: string): Promise<Usuario> {
    const r = await this.api.post<LoginRespuesta>('login', { email, password });
    this.sesion.guardar(r.token, r.expira, r.usuario);
    if (r.usuario.tipo === 'trabajador') {
      return r.usuario;
    }
    await this.logout();
    throw new ApiError(
      403,
      'SOLO_TRABAJADORES',
      'Esta zona es para el personal de la tienda. Si eres cliente, entra desde la app Almi Companion.',
    );
  }

  /** GET /me: refresca los datos del usuario (nombre, puesto, departamento). */
  async comprobarSesion(): Promise<Usuario> {
    const u = await this.api.get<Usuario>('me');
    this.sesion.actualizarUsuario(u);
    return u;
  }

  /** PUT /me: nombre, apellidos, teléfono o contraseña. El email lo cambia otro admin. */
  async actualizarPerfil(cambios: {
    nombre?: string;
    apellidos?: string;
    telefono?: string;
    password?: string;
  }): Promise<Usuario> {
    const u = await this.api.put<Usuario>('me', cambios);
    this.sesion.actualizarUsuario(u);
    return u;
  }

  /** POST /logout: borra el token en la API. La sesión local se borra aunque falle la red. */
  async logout(): Promise<void> {
    try {
      await this.api.post<void>('logout');
    } catch {
      // Sin red o token ya caducado: da igual, la sesión local se borra igualmente
    } finally {
      this.sesion.cerrar();
    }
  }
}
