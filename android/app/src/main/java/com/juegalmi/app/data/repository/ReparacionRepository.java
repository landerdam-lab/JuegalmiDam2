package com.juegalmi.app.data.repository;

import android.content.Context;

import androidx.annotation.Nullable;

import com.google.gson.reflect.TypeToken;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.RetrofitClient;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Pagina;
import com.juegalmi.app.data.model.Peticiones;
import com.juegalmi.app.data.model.Referencia;
import com.juegalmi.app.data.model.Reparacion;

import java.lang.reflect.Type;
import java.util.List;

/** Reparaciones del cliente (PT-17, PT-18). */
public class ReparacionRepository {

    private static final Type PAGINA = new TypeToken<Pagina<Reparacion>>() { }.getType();
    private static final Type LISTA_DEPARTAMENTOS = new TypeToken<List<Referencia>>() { }.getType();

    private final Context context;

    public ReparacionRepository(Context context) {
        this.context = context.getApplicationContext();
    }

    public void misReparaciones(Object etiqueta, Callback<Pagina<Reparacion>> callback) {
        VolleyClient.get(context).get("reparaciones?limit=50", PAGINA, etiqueta, callback);
    }

    /** Los 2 departamentos fijos (Telefonía y Consolas). */
    public void departamentos(Object etiqueta, Callback<List<Referencia>> callback) {
        VolleyClient.get(context).get("departamentos", LISTA_DEPARTAMENTOS, etiqueta, callback);
    }

    /**
     * POST /api/reparaciones (Retrofit). La foto ya tiene que estar subida (ImagenRepository).
     * Sin ubicación en las cabeceras la API responde 422 (ADR-035).
     */
    public void crear(int departamentoId, String dispositivo, String problema, @Nullable String foto,
                      Callback<Reparacion> callback) {
        RetrofitClient cliente = RetrofitClient.get(context);
        cliente.enviar(cliente.servicio().crearReparacion(
                new Peticiones.NuevaReparacion(departamentoId, dispositivo, problema, foto)), callback);
    }

    /** El cliente puede cancelar la suya si está recibida o en reparación. */
    public void cancelar(int id, Callback<Reparacion> callback) {
        RetrofitClient cliente = RetrofitClient.get(context);
        cliente.enviar(cliente.servicio().cambiarEstadoReparacion(id,
                new Peticiones.CambioEstado(Reparacion.CANCELADA)), callback);
    }
}
