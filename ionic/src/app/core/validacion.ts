/** Validaciones para avisar ANTES de enviar. Quien decide de verdad es la API: si responde 422, se muestran sus mensajes. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO = /^\d{9}$/;
const DNI = /^(\d{8}|[XYZxyz]\d{7})[A-Za-z]$/;
export const PASSWORD_MINIMA = 8;

export const emailValido = (t: string): boolean => EMAIL.test(t);
export const telefonoValido = (t: string): boolean => TELEFONO.test(t);
export const dniValido = (t: string): boolean => DNI.test(t);
