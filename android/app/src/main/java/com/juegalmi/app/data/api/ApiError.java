package com.juegalmi.app.data.api;

import android.content.Context;

import androidx.annotation.Nullable;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.juegalmi.app.R;

import java.util.HashMap;
import java.util.Map;

/**
 * Error de la API ya traducido para la vista. La API siempre responde así (05-API/Formato JSON y errores):
 * {"error": {"codigo": "VALIDACION", "mensaje": "…", "campos": {"email": "…"}}}
 *
 * Los errores de red (sin conexión, tiempo agotado) se convierten en un ApiError con status 0,
 * para que la vista trate todos los fallos igual.
 */
public class ApiError {

    public final int status;
    public final String codigo;
    public final String mensaje;
    /** Errores por campo (422): clave = nombre del campo en el JSON */
    public final Map<String, String> campos;

    public ApiError(int status, String codigo, String mensaje, @Nullable Map<String, String> campos) {
        this.status = status;
        this.codigo = codigo;
        this.mensaje = mensaje;
        this.campos = campos != null ? campos : new HashMap<>();
    }

    public boolean esSinRed() {
        return status == 0;
    }

    @Nullable
    public String campo(String nombre) {
        return campos.get(nombre);
    }

    /** Sin respuesta del servidor (sin red, servidor apagado, tiempo agotado). */
    public static ApiError sinRed(Context context) {
        return new ApiError(0, "SIN_RED", context.getString(R.string.error_sin_red), null);
    }

    /** Lee el cuerpo de error de la API; si no es el formato esperado, usa un mensaje genérico. */
    public static ApiError desdeRespuesta(Context context, int status, @Nullable String cuerpo) {
        try {
            JsonObject error = JsonParser.parseString(cuerpo).getAsJsonObject().getAsJsonObject("error");
            Map<String, String> campos = new HashMap<>();
            if (error.has("campos") && error.get("campos").isJsonObject()) {
                for (Map.Entry<String, com.google.gson.JsonElement> e : error.getAsJsonObject("campos").entrySet()) {
                    campos.put(e.getKey(), e.getValue().getAsString());
                }
            }
            return new ApiError(status, error.get("codigo").getAsString(), error.get("mensaje").getAsString(), campos);
        } catch (RuntimeException e) {
            return new ApiError(status, "DESCONOCIDO", context.getString(R.string.error_generico), null);
        }
    }

    /** Usado solo para depurar en Logcat. */
    @Override
    public String toString() {
        return new Gson().toJson(this);
    }
}
