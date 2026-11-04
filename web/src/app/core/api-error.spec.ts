import { ApiError } from './api-error';

// El formato de error de la API es {"error": {"codigo", "mensaje", "campos"}} (05-API/Formato JSON y errores)
describe('ApiError', () => {
  it('lee el código, el mensaje y los campos de un 422', () => {
    const e = ApiError.desdeRespuesta(422, {
      error: {
        codigo: 'VALIDACION',
        mensaje: 'Hay datos no válidos.',
        campos: { nombre: 'Escribe el nombre.' },
      },
    });
    expect(e.status).toBe(422);
    expect(e.codigo).toBe('VALIDACION');
    expect(e.mensaje).toBe('Hay datos no válidos.');
    expect(e.campos['nombre']).toBe('Escribe el nombre.');
  });

  it('da un mensaje genérico si la respuesta no tiene el formato de la API', () => {
    const e = ApiError.desdeRespuesta(500, '<html>Error</html>');
    expect(e.codigo).toBe('DESCONOCIDO');
    expect(e.mensaje).toContain('Algo ha fallado');
  });

  it('trata la falta de conexión como status 0', () => {
    expect(ApiError.sinRed().status).toBe(0);
  });

  it('convierte cualquier error en un ApiError', () => {
    const original = ApiError.sinRed();
    expect(ApiError.de(original)).toBe(original);
    expect(ApiError.de(new TypeError('x'))).toBeInstanceOf(ApiError);
  });
});
