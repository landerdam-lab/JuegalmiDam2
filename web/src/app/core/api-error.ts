/**
 * Error de la API ya traducido para la vista: {"error": {"codigo", "mensaje", "campos"}}.
 * Sin respuesta del servidor (sin red, API apagada, CORS) es un ApiError con status 0,
 * para que las pantallas traten todos los fallos igual. Es la misma clase que en la app de Ionic.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly campos: Record<string, string> = {},
  ) {
    super(mensaje);
  }

  get mensaje(): string {
    return this.message;
  }

  static sinRed(): ApiError {
    return new ApiError(
      0,
      'SIN_RED',
      'No hay conexión con la tienda. Comprueba tu conexión y vuelve a intentarlo.',
    );
  }

  static desdeRespuesta(status: number, cuerpo: unknown): ApiError {
    const error = (
      cuerpo as { error?: { codigo?: string; mensaje?: string; campos?: Record<string, string> } }
    )?.error;
    if (!error?.codigo || !error.mensaje) {
      return new ApiError(
        status,
        'DESCONOCIDO',
        'Algo ha fallado. Vuelve a intentarlo dentro de un momento.',
      );
    }
    return new ApiError(status, error.codigo, error.mensaje, error.campos ?? {});
  }

  /** Convierte cualquier cosa capturada en un ApiError (por si llega un error de JavaScript). */
  static de(e: unknown): ApiError {
    return e instanceof ApiError
      ? e
      : new ApiError(-1, 'DESCONOCIDO', 'Algo ha fallado. Vuelve a intentarlo.');
  }
}
