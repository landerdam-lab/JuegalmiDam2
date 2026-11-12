/** Validaciones para avisar ANTES de enviar. Quien decide de verdad es la API: si responde 422, se muestran sus mensajes. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO = /^\d{9}$/;
const DNI = /^(\d{8}|[XYZxyz]\d{7})[A-Za-z]$/;
const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';
export const PASSWORD_MINIMA = 8;

export const emailValido = (t: string): boolean => EMAIL.test(t);
export const telefonoValido = (t: string): boolean => TELEFONO.test(t);
/** Formato y letra de control: la letra es LETRAS_DNI[número % 23]; en el NIE, X, Y y Z valen 0, 1 y 2. */
export function dniValido(texto: string): boolean {
  if (!DNI.test(texto)) {
    return false;
  }
  const t = texto.toUpperCase();
  const cifras = t.slice(0, 8).replace('X', '0').replace('Y', '1').replace('Z', '2');
  return LETRAS_DNI[Number(cifras) % 23] === t[8];
}
