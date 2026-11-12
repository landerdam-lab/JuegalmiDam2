package com.juegalmi.app.data.api;

import android.content.Context;

import com.juegalmi.app.session.SessionManager;
import com.juegalmi.app.util.UbicacionHelper;

import java.util.HashMap;
import java.util.Map;

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
            cabeceras.put("X-Latitud", String.format(java.util.Locale.ROOT, "%.7f", ubicacion.getLatitud()));
            cabeceras.put("X-Longitud", String.format(java.util.Locale.ROOT, "%.7f", ubicacion.getLongitud()));
        }
        return cabeceras;
    }
}
