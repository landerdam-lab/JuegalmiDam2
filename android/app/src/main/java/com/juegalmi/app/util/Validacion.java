package com.juegalmi.app.util;

import android.util.Patterns;

import java.util.regex.Pattern;

/**
 * Validaciones de formulario en la app, para avisar ANTES de enviar.
 * Quien decide de verdad es la API (regla de oro 8): si responde 422, se muestran sus mensajes.
 */
public final class Validacion {

    private static final Pattern TELEFONO = Pattern.compile("^\\d{9}$");
    /** DNI (8 cifras + letra) o NIE (X, Y o Z + 7 cifras + letra), como acepta la API */
    private static final Pattern DNI = Pattern.compile("^(\\d{8}|[XYZxyz]\\d{7})[A-Za-z]$");
    public static final int PASSWORD_MINIMA = 8;

    private Validacion() {
    }

    public static boolean email(String texto) {
        return Patterns.EMAIL_ADDRESS.matcher(texto).matches();
    }

    public static boolean telefono(String texto) {
        return TELEFONO.matcher(texto).matches();
    }

    public static boolean dni(String texto) {
        return DNI.matcher(texto).matches();
    }
}
