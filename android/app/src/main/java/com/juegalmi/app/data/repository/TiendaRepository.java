package com.juegalmi.app.data.repository;

import android.content.Context;

import com.google.gson.reflect.TypeToken;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Servicio;
import com.juegalmi.app.data.model.Tienda;

import java.lang.reflect.Type;
import java.util.List;

/** Sección «La tienda» (PT-24…PT-28). Solo lecturas, con Volley. */
public class TiendaRepository {

    private static final Type LISTA_TIENDAS = new TypeToken<List<Tienda>>() { }.getType();
    private static final Type LISTA_SERVICIOS = new TypeToken<List<Servicio>>() { }.getType();

    private final Context context;

    public TiendaRepository(Context context) {
        this.context = context.getApplicationContext();
    }

    /**
     * La tienda de la demo (hay una sola). GET /api/tiendas da la lista (sin fotos) y, con el id de la primera,
     * GET /api/tiendas/{id} trae la historia, las coordenadas y las fotos de la galería.
     */
    public void tienda(Object etiqueta, Callback<Tienda> callback) {
        VolleyClient.get(context).get("tiendas", LISTA_TIENDAS, etiqueta, new Callback<List<Tienda>>() {
            @Override
            public void onExito(List<Tienda> tiendas) {
                if (tiendas == null || tiendas.isEmpty()) {
                    callback.onError(new ApiError(404, "SIN_TIENDA", "", null));
                } else {
                    VolleyClient.get(context).get("tiendas/" + tiendas.get(0).id, Tienda.class, etiqueta, callback);
                }
            }

            @Override
            public void onError(ApiError error) {
                callback.onError(error);
            }
        });
    }

    /** GET /api/servicios?linea=videojuegos|consolas|telefonia (una pestaña de PT-25). */
    public void servicios(String linea, Object etiqueta, Callback<List<Servicio>> callback) {
        VolleyClient.get(context).get("servicios?linea=" + linea, LISTA_SERVICIOS, etiqueta, callback);
    }
}
