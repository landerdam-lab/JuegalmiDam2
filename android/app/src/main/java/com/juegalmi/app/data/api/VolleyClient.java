package com.juegalmi.app.data.api;

import android.content.Context;

import androidx.annotation.Nullable;

import com.android.volley.DefaultRetryPolicy;
import com.android.volley.NetworkResponse;
import com.android.volley.ParseError;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.toolbox.HttpHeaderParser;
import com.android.volley.toolbox.Volley;
import com.google.gson.Gson;
import com.juegalmi.app.R;

import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Cliente de Volley (librería obligatoria del enunciado). Se usa para las LECTURAS y el login.
 *
 * Por qué no bloquea la interfaz: Volley tiene sus propios hilos de red. La petición se hace en ellos,
 * el JSON se convierte en objetos (Gson) también en ellos, en parseNetworkResponse, y solo el
 * resultado final vuelve al hilo principal (Callback).
 */
public final class VolleyClient {

    private static VolleyClient instancia;

    private final Context context;
    private final RequestQueue cola;
    private final String urlBase;
    private final Gson gson = new Gson();

    private VolleyClient(Context context) {
        this.context = context.getApplicationContext();
        this.cola = Volley.newRequestQueue(this.context);
        // La URL base está en un solo sitio: res/values/api.xml
        this.urlBase = this.context.getString(R.string.api_url_base);
    }

    public static synchronized VolleyClient get(Context context) {
        if (instancia == null) {
            instancia = new VolleyClient(context);
        }
        return instancia;
    }

    /** GET de la API. Ruta sin barra inicial: "videojuegos?page=1". */
    public <T> void get(String ruta, Type tipo, Object etiqueta, Callback<T> callback) {
        enviar(Request.Method.GET, ruta, null, tipo, true, etiqueta, callback);
    }

    /**
     * POST con cuerpo JSON.
     * @param cerrarSiNoAutorizado false en el login, donde un 401 significa «contraseña incorrecta»
     */
    public <T> void post(String ruta, @Nullable Object cuerpo, Type tipo, boolean cerrarSiNoAutorizado,
                         Object etiqueta, Callback<T> callback) {
        enviar(Request.Method.POST, ruta, cuerpo, tipo, cerrarSiNoAutorizado, etiqueta, callback);
    }

    /** Petición cuya respuesta no interesa (p. ej. POST /api/logout). */
    public void enviarSinRespuesta(int metodo, String ruta, Object etiqueta) {
        enviar(metodo, ruta, null, Object.class, false, etiqueta, new Callback<Object>() {
            @Override
            public void onExito(Object resultado) {
            }

            @Override
            public void onError(ApiError error) {
            }
        });
    }

    /** Cancela las peticiones de una pantalla (se llama al destruir su vista). */
    public void cancelar(Object etiqueta) {
        cola.cancelAll(etiqueta);
    }

    private <T> void enviar(int metodo, String ruta, @Nullable Object cuerpo, Type tipo,
                            boolean cerrarSiNoAutorizado, Object etiqueta, Callback<T> callback) {
        PeticionGson<T> peticion = new PeticionGson<>(metodo, urlBase + ruta,
                cuerpo == null ? null : gson.toJson(cuerpo), tipo, callback::onExito,
                error -> {
                    if (error.networkResponse == null) {
                        callback.onError(ApiError.sinRed(context));
                        return;
                    }
                    int status = error.networkResponse.statusCode;
                    if (status == 401 && cerrarSiNoAutorizado) {
                        SesionCaducada.manejar(context);
                    }
                    String cuerpoError = new String(error.networkResponse.data, StandardCharsets.UTF_8);
                    callback.onError(ApiError.desdeRespuesta(context, status, cuerpoError));
                });
        // 10 s y un reintento: suficiente en la red del aula sin dejar al usuario esperando
        peticion.setRetryPolicy(new DefaultRetryPolicy(10_000, 1, 1f));
        peticion.setTag(etiqueta);
        cola.add(peticion);
    }

    /** Petición de Volley que envía y recibe JSON y lo convierte con Gson en un hilo de red. */
    private final class PeticionGson<T> extends Request<T> {
        @Nullable private final String cuerpo;
        private final Type tipo;
        private final Response.Listener<T> listener;
        private final Map<String, String> cabeceras;

        PeticionGson(int metodo, String url, @Nullable String cuerpo, Type tipo,
                     Response.Listener<T> listener, Response.ErrorListener errorListener) {
            super(metodo, url, errorListener);
            this.cuerpo = cuerpo;
            this.tipo = tipo;
            this.listener = listener;
            // Se leen al crear la petición: si después se cierra la sesión (logout), esta aún lleva su token
            this.cabeceras = CabecerasApi.crear(context);
        }

        @Override
        public Map<String, String> getHeaders() {
            return cabeceras;
        }

        @Override
        public String getBodyContentType() {
            return "application/json; charset=utf-8";
        }

        @Override
        public byte[] getBody() {
            return cuerpo == null ? null : cuerpo.getBytes(StandardCharsets.UTF_8);
        }

        /** Se ejecuta en un hilo de Volley, no en el principal. */
        @Override
        protected Response<T> parseNetworkResponse(NetworkResponse respuesta) {
            try {
                String json = new String(respuesta.data, StandardCharsets.UTF_8);
                T resultado = json.isEmpty() ? null : gson.fromJson(json, tipo);
                return Response.success(resultado, HttpHeaderParser.parseCacheHeaders(respuesta));
            } catch (RuntimeException e) {
                return Response.error(new ParseError(e));
            }
        }

        @Override
        protected void deliverResponse(T respuesta) {
            listener.onResponse(respuesta);
        }
    }
}
