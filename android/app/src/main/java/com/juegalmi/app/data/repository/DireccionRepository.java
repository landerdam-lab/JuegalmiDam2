package com.juegalmi.app.data.repository;

import android.content.Context;
import android.net.Uri;

import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Direccion;

/** Busca en el mapa la dirección de entrega (lectura con Volley). La búsqueda real la hace la API (ADR-040). */
public class DireccionRepository {

    private final Context context;

    public DireccionRepository(Context context) {
        this.context = context.getApplicationContext();
    }

    /** GET /api/direcciones?texto= */
    public void buscar(String texto, Object etiqueta, Callback<Direccion> callback) {
        VolleyClient.get(context).get("direcciones?texto=" + Uri.encode(texto), Direccion.class, etiqueta, callback);
    }
}
