package com.juegalmi.app.data.repository;

import android.content.Context;
import android.net.Uri;

import androidx.annotation.Nullable;

import com.google.gson.reflect.TypeToken;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Pagina;
import com.juegalmi.app.data.model.Producto;

import java.lang.reflect.Type;

/** Catálogo (lecturas con Volley): GET /api/videojuegos, /moviles, /consolas y su detalle. */
public class ProductoRepository {

    /** Productos por página: pocos para que la primera carga sea rápida (RNF-03). */
    public static final int POR_PAGINA = 20;

    // Gson necesita el tipo completo (Pagina<Producto>) porque Java borra los genéricos al compilar
    private static final Type TIPO_PAGINA = new TypeToken<Pagina<Producto>>() { }.getType();

    private final Context context;

    public ProductoRepository(Context context) {
        this.context = context.getApplicationContext();
    }

    /** Filtros que admite el catálogo. Los null no se envían. */
    public static class Filtro {
        public String tipo = Producto.VIDEOJUEGO;
        @Nullable public String texto;
        /** Solo videojuegos: ?alquilable=1 */
        public boolean soloAlquilables;
        /** Solo móviles: ?formato=movil|tablet */
        @Nullable public String formato;
    }

    public void listar(Filtro filtro, int pagina, Object etiqueta, Callback<Pagina<Producto>> callback) {
        // Uri.Builder codifica bien los espacios y las tildes del texto buscado
        Uri.Builder ruta = new Uri.Builder().path(Producto.recurso(filtro.tipo))
                .appendQueryParameter("page", String.valueOf(pagina))
                .appendQueryParameter("limit", String.valueOf(POR_PAGINA));
        if (filtro.texto != null && !filtro.texto.isEmpty()) {
            ruta.appendQueryParameter("q", filtro.texto);
        }
        if (filtro.soloAlquilables) {
            ruta.appendQueryParameter("alquilable", "1");
        }
        if (filtro.formato != null) {
            ruta.appendQueryParameter("formato", filtro.formato);
        }
        VolleyClient.get(context).get(ruta.build().toString(), TIPO_PAGINA, etiqueta, callback);
    }

    public void detalle(String tipo, int id, Object etiqueta, Callback<Producto> callback) {
        VolleyClient.get(context).get(Producto.recurso(tipo) + "/" + id, Producto.class, etiqueta, callback);
    }
}
