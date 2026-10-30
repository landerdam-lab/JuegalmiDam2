package com.juegalmi.app.data.api;

import android.content.Context;

import com.juegalmi.app.session.SessionManager;
import com.juegalmi.app.util.UbicacionHelper;

import java.util.HashMap;
import java.util.Map;

/**
 * Cabeceras que llevan TODAS las peticiones, en un único sitio para Volley y para Retrofit:
 * - Authorization: Bearer <token>, si hay sesión (rúbrica: todo con token salvo login y registro).
 * - X-Latitud / X-Longitud: la última ubicación conocida (ADR-014). La API la guarda en registro_ubicacion.
 */
public final class CabecerasApi {

    private CabecerasApi() {
    }

    public static Map<String, String> crear(Context context) {
        Map<String, String> cabeceras = new HashMap<>();
        cabeceras.put("Accept", "application/json");

        String token = SessionManager.get(context).getToken();
        if (token != null) {
            cabeceras.put("Authorization", "Bearer " + token);
        }

        UbicacionHelper ubicacion = UbicacionHelper.get(context);
        if (ubicacion.hayUbicacion()) {
            // Locale.ROOT: siempre con punto decimal ("43.2630126"), aunque el móvil esté en español
            cabeceras.put("X-Latitud", String.format(java.util.Locale.ROOT, "%.7f", ubicacion.getLatitud()));
            cabeceras.put("X-Longitud", String.format(java.util.Locale.ROOT, "%.7f", ubicacion.getLongitud()));
        }
        return cabeceras;
    }
}
