package com.juegalmi.app.util;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.appcompat.app.AppCompatDelegate;

/** Preferencias de la app que elige el usuario en Perfil (PT-21): tema y «agitar para refrescar». */
public final class Preferencias {

    private static final String PREFS = "preferencias";
    private static final String TEMA = "tema";
    private static final String AGITAR = "agitar";

    private Preferencias() {
    }

    private static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM (por defecto), MODE_NIGHT_NO o MODE_NIGHT_YES */
    public static int tema(Context c) {
        return prefs(c).getInt(TEMA, AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
    }

    /** Guarda el tema y lo aplica: Android recrea las pantallas con los colores de values-night o values. */
    public static void cambiarTema(Context c, int modo) {
        prefs(c).edit().putInt(TEMA, modo).apply();
        AppCompatDelegate.setDefaultNightMode(modo);
    }

    public static boolean agitar(Context c) {
        return prefs(c).getBoolean(AGITAR, true);
    }

    public static void cambiarAgitar(Context c, boolean activo) {
        prefs(c).edit().putBoolean(AGITAR, activo).apply();
    }
}
