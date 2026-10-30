package com.juegalmi.app.util;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/**
 * Validaciones del registro y del perfil (PT-03, PT-21). Se ejecutan en el PC, sin emulador:
 * ./gradlew testDebugUnitTest
 * El email no se prueba aquí: usa android.util.Patterns, que solo existe en un dispositivo.
 */
public class ValidacionTest {

    @Test
    public void dniValido() {
        assertTrue(Validacion.dni("12345678Z"));
        assertTrue(Validacion.dni("12345678z"));
    }

    @Test
    public void nieValido() {
        assertTrue(Validacion.dni("X1234567L"));
        assertTrue(Validacion.dni("Y1234567X"));
        assertTrue(Validacion.dni("z1234567r"));
    }

    @Test
    public void dniIncorrecto() {
        assertFalse(Validacion.dni(""));
        assertFalse(Validacion.dni("1234567Z"));     // 7 cifras
        assertFalse(Validacion.dni("123456789"));    // sin letra
        assertFalse(Validacion.dni("A1234567L"));    // el NIE solo empieza por X, Y o Z
        assertFalse(Validacion.dni("12345678 Z"));   // con espacio
    }

    @Test
    public void telefonoDeNueveCifras() {
        assertTrue(Validacion.telefono("600123456"));
        assertFalse(Validacion.telefono("60012345"));
        assertFalse(Validacion.telefono("6001234567"));
        assertFalse(Validacion.telefono("600 12 34 56"));
        assertFalse(Validacion.telefono("+34600123456"));
    }
}
