package com.juegalmi.app.util;

import android.util.Patterns;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Validaciones de formulario en la app, para avisar ANTES de enviar.
 * Quien decide de verdad es la API (regla de oro 8): si responde 422, se muestran sus mensajes.
 */
public final class Validacion {

    private static final Pattern TELEFONO = Pattern.compile("^\\d{9}$");
    /** DNI (8 cifras + letra) o NIE (X, Y o Z + 7 cifras + letra), como acepta la API */
    private static final Pattern DNI = Pattern.compile("^(\\d{8}|[XYZxyz]\\d{7})[A-Za-z]$");
    private static final String LETRAS_DNI = "TRWAGMYFPDXBNJZSQVHLCKE";
    public static final int PASSWORD_MINIMA = 8;

    private Validacion() {
    }

    public static boolean email(String texto) {
        return Patterns.EMAIL_ADDRESS.matcher(texto).matches();
    }

    public static boolean telefono(String texto) {
        return TELEFONO.matcher(texto).matches();
    }

    /** Formato y letra de control: la letra es LETRAS_DNI[número % 23]; en el NIE, X, Y y Z valen 0, 1 y 2. */
    public static boolean dni(String texto) {
        if (!DNI.matcher(texto).matches()) {
            return false;
        }
        String t = texto.toUpperCase(Locale.ROOT);
        String cifras = t.substring(0, 8).replace('X', '0').replace('Y', '1').replace('Z', '2');
        return LETRAS_DNI.charAt(Integer.parseInt(cifras) % 23) == t.charAt(8);
    }
}
