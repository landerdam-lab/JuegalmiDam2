package com.juegalmi.app;

import android.app.Application;

import androidx.appcompat.app.AppCompatDelegate;

import com.juegalmi.app.util.Preferencias;

import org.osmdroid.config.Configuration;

/**
 * Se crea una vez al abrir la app, antes que cualquier pantalla.
 * - Aplica el tema elegido en Perfil (claro, oscuro o el del sistema).
 * - Configura OSMDroid: los servidores de OpenStreetMap exigen identificar la app (user agent).
 */
public class JuegAlmiApp extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        AppCompatDelegate.setDefaultNightMode(Preferencias.tema(this));
        Configuration.getInstance().setUserAgentValue(getPackageName());
    }
}
