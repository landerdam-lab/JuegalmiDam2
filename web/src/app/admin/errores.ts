import { ApiError } from '../core/api-error';

/**
 * Mensaje para el usuario a partir de un error de la API. Si la API explica qué campo falla
 * (422 con "campos"), se juntan esos mensajes: dicen cómo corregirlo.
 */
export function mensajeError(e: unknown): string {
  const err = ApiError.de(e);
  const campos = Object.values(err.campos);
  return campos.length ? `${err.mensaje} ${campos.join(' ')}` : err.mensaje;
}

/** true si el error es un 409 EN_USO (no se puede borrar porque tiene datos relacionados). */
export function estaEnUso(e: unknown): boolean {
  return e instanceof ApiError && e.status === 409;
}
