import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { Proveedores } from './proveedores';

// El servicio de proveedores (ADR-042) tiene que llamar a las rutas y métodos que espera la API.
describe('servicio de proveedores', () => {
  let proveedores: Proveedores;
  let http: HttpTestingController;
  const url = (ruta: string) => `${environment.apiUrl}/${ruta}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    proveedores = TestBed.inject(Proveedores);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('da de alta con POST y edita con PUT', async () => {
    const datos = {
      nombre: 'A',
      cif: 'B12345678',
      telefono: '1',
      email: 'a@b.test',
      direccion: null,
    };

    const alta = proveedores.guardar(datos);
    const peticionAlta = http.expectOne(url('proveedores'));
    expect(peticionAlta.request.method).toBe('POST');
    peticionAlta.flush({ id: 7, ...datos });
    await alta;

    const edicion = proveedores.guardar(datos, 7);
    const peticionEdicion = http.expectOne(url('proveedores/7'));
    expect(peticionEdicion.request.method).toBe('PUT');
    peticionEdicion.flush({ id: 7, ...datos });
    await edicion;
  });

  it('asigna un proveedor a un producto con PUT y el precio de coste', async () => {
    const asignar = proveedores.asignar(3, 7, 54.39);
    const peticion = http.expectOne(url('productos/3/proveedores/7'));
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({ precioCoste: 54.39 });
    peticion.flush({ id: 1, proveedor: { id: 7, nombre: 'A' }, precioCoste: 54.39 });
    await asignar;
  });

  it('quita un proveedor de un producto con DELETE', async () => {
    const quitar = proveedores.quitar(3, 7);
    const peticion = http.expectOne(url('productos/3/proveedores/7'));
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });
    await quitar;
  });
});
