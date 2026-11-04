import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type UrlTree } from '@angular/router';

import { adminGuard, invitadoGuard, sesionGuard } from './guardas';
import type { Usuario } from './modelos';
import { Sesion } from './sesion';

const DENTRO_DE_UNA_HORA = new Date(Date.now() + 3600_000).toISOString();

function usuario(cambios: Partial<Usuario>): Usuario {
  return {
    id: 1,
    tipo: 'trabajador',
    nombre: 'Miren',
    apellidos: 'Agirre',
    email: 'admin@juegalmi.test',
    telefono: null,
    activo: true,
    dni: null,
    foto: null,
    puesto: 'admin',
    departamentoId: null,
    departamento: null,
    ...cambios,
  };
}

/** Ejecuta una guarda dentro del inyector de Angular (las guardas usan inject()). */
function ejecutar(guarda: typeof sesionGuard, url = '/admin'): boolean | UrlTree {
  return TestBed.runInInjectionContext(() => guarda({} as never, { url } as never)) as
    boolean | UrlTree;
}

// Las guardas del backoffice: solo comodidad (la API vuelve a comprobar el rol), pero tienen que llevar a cada uno a su sitio.
describe('guardas del backoffice', () => {
  let sesion: Sesion;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    sesion = TestBed.inject(Sesion);
    router = TestBed.inject(Router);
  });

  it('sin sesión, /admin lleva al acceso y recuerda adónde se quería ir', () => {
    const r = ejecutar(sesionGuard, '/admin/productos') as UrlTree;
    expect(router.serializeUrl(r)).toBe('/acceso?volver=%2Fadmin%2Fproductos');
  });

  it('deja pasar al admin a todo el backoffice', () => {
    sesion.guardar('token', DENTRO_DE_UNA_HORA, usuario({ puesto: 'admin' }));
    expect(ejecutar(sesionGuard)).toBe(true);
    expect(ejecutar(adminGuard)).toBe(true);
  });

  it('manda al técnico a sus reparaciones si intenta entrar en la gestión', () => {
    sesion.guardar('token', DENTRO_DE_UNA_HORA, usuario({ puesto: 'tecnico', departamentoId: 2 }));
    expect(ejecutar(sesionGuard)).toBe(true);
    expect(router.serializeUrl(ejecutar(adminGuard) as UrlTree)).toBe('/admin/reparaciones');
  });

  it('no deja entrar con un token caducado', () => {
    sesion.guardar('token', new Date(Date.now() - 1000).toISOString(), usuario({}));
    expect(ejecutar(sesionGuard)).not.toBe(true);
    expect(sesion.token).toBeNull();
  });

  it('con la sesión abierta, /acceso lleva directamente al backoffice', () => {
    sesion.guardar('token', DENTRO_DE_UNA_HORA, usuario({ puesto: 'admin' }));
    expect(router.serializeUrl(ejecutar(invitadoGuard) as UrlTree)).toBe('/admin');
  });
});
