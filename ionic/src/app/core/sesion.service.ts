import { Injectable, computed, signal } from '@angular/core';

import type { Usuario } from './modelos';

const CLAVE = 'sesion';

interface DatosSesion {
  token: string;
  expira: string;
  usuario: Usuario;
}

/**
 * Guarda la sesión en Local Storage: el token, cuándo caduca y el usuario.
 * Es el ÚNICO sitio que conoce el token: el interceptor se lo pide aquí, y al cerrar sesión
 * o recibir un 401 se borra todo de golpe con cerrar().
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly datos = signal<DatosSesion | null>(this.leer());

  readonly usuario = computed(() => this.datos()?.usuario ?? null);

  get token(): string | null {
    return this.datos()?.token ?? null;
  }

  /** Hay sesión si hay token y aún no ha caducado (el token dura 2 h, ADR-035). */
  haySesion(): boolean {
    const d = this.datos();
    return !!d && new Date(d.expira).getTime() > Date.now();
  }

  guardar(token: string, expira: string, usuario: Usuario): void {
    this.escribir({ token, expira, usuario });
  }

  actualizarUsuario(usuario: Usuario): void {
    const d = this.datos();
    if (d) {
      this.escribir({ ...d, usuario });
    }
  }

  cerrar(): void {
    localStorage.removeItem(CLAVE);
    this.datos.set(null);
  }

  private escribir(d: DatosSesion): void {
    localStorage.setItem(CLAVE, JSON.stringify(d));
    this.datos.set(d);
  }

  private leer(): DatosSesion | null {
    try {
      return JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    } catch {
      return null;
    }
  }
}
