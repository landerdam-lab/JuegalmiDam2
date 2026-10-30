package com.juegalmi.app.data.repository;

import android.content.Context;
import android.net.Uri;

import androidx.annotation.Nullable;

import com.google.gson.reflect.TypeToken;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Pagina;
import com.juegalmi.app.data.model.Producto;
import com.juegalmi.app.data.model.Referencia;

import java.lang.reflect.Type;
import java.util.List;

/** Catálogo (lecturas con Volley): GET /api/videojuegos, /moviles, /consolas y su detalle. */
public class ProductoRepository {

    /** Productos por página: pocos para que la primera carga sea rápida (RNF-03). */
    public static final int POR_PAGINA = 20;

    // Gson necesita el tipo completo (Pagina<Producto>) porque Java borra los genéricos al compilar
    private static final Type TIPO_PAGINA = new TypeToken<Pagina<Producto>>() { }.getType();
    private static final Type TIPO_REFERENCIAS = new TypeToken<List<Referencia>>() { }.getType();
    private static final Type TIPO_TEXTOS = new TypeToken<List<String>>() { }.getType();

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
        /** Solo videojuegos: ?plataforma={id}, ?genero=, ?pegi= */
        @Nullable public Integer plataformaId;
        @Nullable public String genero;
        @Nullable public Integer pegi;
        /** Todos: ?marca={id} */
        @Nullable public Integer marcaId;
        /** ?orden=nombre | precio_asc | precio_desc (lo ordena la API) */
        public String orden = ORDEN_NOMBRE;

        /** ¿Hay algún filtro puesto (además de la búsqueda y la pestaña)? Para el chip «Quitar filtros». */
        public boolean hayFiltros() {
            return soloAlquilables || plataformaId != null || genero != null || pegi != null || marcaId != null
                    || !ORDEN_NOMBRE.equals(orden);
        }

        public void quitarFiltros() {
            soloAlquilables = false;
            plataformaId = null;
            genero = null;
            pegi = null;
            marcaId = null;
            orden = ORDEN_NOMBRE;
        }
    }

    public static final String ORDEN_NOMBRE = "nombre";
    public static final String ORDEN_PRECIO_ASC = "precio_asc";
    public static final String ORDEN_PRECIO_DESC = "precio_desc";

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
        if (filtro.plataformaId != null) {
            ruta.appendQueryParameter("plataforma", String.valueOf(filtro.plataformaId));
        }
        if (filtro.genero != null) {
            ruta.appendQueryParameter("genero", filtro.genero);
        }
        if (filtro.pegi != null) {
            ruta.appendQueryParameter("pegi", String.valueOf(filtro.pegi));
        }
        if (filtro.marcaId != null) {
            ruta.appendQueryParameter("marca", String.valueOf(filtro.marcaId));
        }
        ruta.appendQueryParameter("orden", filtro.orden);
        VolleyClient.get(context).get(ruta.build().toString(), TIPO_PAGINA, etiqueta, callback);
    }

    /** Opciones de los filtros: listas cortas, sin paginar (GET /api/plataformas, /marcas, /generos). */
    public void plataformas(Object etiqueta, Callback<List<Referencia>> callback) {
        VolleyClient.get(context).get("plataformas", TIPO_REFERENCIAS, etiqueta, callback);
    }

    public void marcas(Object etiqueta, Callback<List<Referencia>> callback) {
        VolleyClient.get(context).get("marcas", TIPO_REFERENCIAS, etiqueta, callback);
    }

    public void generos(Object etiqueta, Callback<List<String>> callback) {
        VolleyClient.get(context).get("generos", TIPO_TEXTOS, etiqueta, callback);
    }

    public void detalle(String tipo, int id, Object etiqueta, Callback<Producto> callback) {
        VolleyClient.get(context).get(Producto.recurso(tipo) + "/" + id, Producto.class, etiqueta, callback);
    }
}
