import { Service, computed, signal } from '@angular/core';

import type { Usuario } from './modelos';

const CLAVE = 'almi-sesion';

interface DatosSesion {
  token: string;
  expira: string;
  usuario: Usuario;
}

/**
 * Guarda la sesión del backoffice en sessionStorage (se borra al cerrar el navegador:
 * es un ordenador de la tienda, Web - vision general, regla 3).
 * Es el ÚNICO sitio que conoce el token: el interceptor se lo pide aquí, y al cerrar sesión
 * o recibir un 401 se borra todo de golpe con cerrar().
 */
@Service()
export class Sesion {
  private readonly datos = signal<DatosSesion | null>(this.leer());

  readonly usuario = computed(() => this.datos()?.usuario ?? null);
  readonly esAdmin = computed(() => this.usuario()?.puesto === 'admin');
  readonly esTecnico = computed(() => this.usuario()?.puesto === 'tecnico');

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
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      // Navegador sin almacenamiento (modo privado estricto): basta con olvidarla en memoria
    }
    this.datos.set(null);
  }

  private escribir(d: DatosSesion): void {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(d));
    } catch {
      // Sin almacenamiento la sesión dura lo que la pestaña
    }
    this.datos.set(d);
  }

  private leer(): DatosSesion | null {
    try {
      return JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
    } catch {
      return null;
    }
  }
}
