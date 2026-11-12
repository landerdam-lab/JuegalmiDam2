import { describe, expect, it } from 'vitest';

import { esAgitacion } from './agitar.service';
import { diasHasta, fecha } from './formato';
import { dniValido, emailValido, telefonoValido } from './validacion';

describe('validaciones de formulario', () => {
  it('email, teléfono y DNI/NIE', () => {
    expect(emailValido('laura@correo.es')).toBe(true);
    expect(emailValido('laura@correo')).toBe(false);
    expect(telefonoValido('612345678')).toBe(true);
    expect(telefonoValido('61234')).toBe(false);
    expect(dniValido('12345678Z')).toBe(true);
    expect(dniValido('X1234567L')).toBe(true);
    expect(dniValido('1234567Z')).toBe(false);
    expect(dniValido('12345678A')).toBe(false); // la letra no es la que toca (sería la Z)
    expect(dniValido('X1234567Z')).toBe(false); // NIE con la letra mal (sería la L)
  });
});

describe('fechas y sensores', () => {
  it('formatea sin cambiar de zona y cuenta los días', () => {
    expect(fecha('2026-11-03T23:30:00+01:00')).toBe('03/11/2026');
    expect(diasHasta('2026-11-05', new Date(2026, 10, 3))).toBe(2);
    expect(diasHasta('2026-11-01', new Date(2026, 10, 3))).toBe(-2);
  });

  it('solo un golpe fuerte cuenta como agitar', () => {
    expect(esAgitacion(0, 0, 9.81)).toBe(false);
    expect(esAgitacion(20, 15, 9)).toBe(true);
    expect(esAgitacion(12, 10, 9.81)).toBe(false); // ~1,9 g: un movimiento normal no refresca
    expect(esAgitacion(15, 10, 9.81)).toBe(true); // ~2,1 g: una sacudida sí
  });
});
