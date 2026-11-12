package com.juegalmi.app.session;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.Nullable;

import com.google.gson.Gson;
import com.juegalmi.app.data.model.Usuario;

import java.time.OffsetDateTime;

public final class SessionManager {

    private static final String PREFS = "sesion";
    private static final String CLAVE_TOKEN = "token";
    private static final String CLAVE_EXPIRA = "expira";
    private static final String CLAVE_USUARIO = "usuario";

    private static SessionManager instancia;

    private final SharedPreferences prefs;
    private final Gson gson = new Gson();

    private SessionManager(Context context) {
        prefs = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static synchronized SessionManager get(Context context) {
        if (instancia == null) {
            instancia = new SessionManager(context);
        }
        return instancia;
    }

    public void guardar(String token, String expira, Usuario usuario) {
        prefs.edit()
                .putString(CLAVE_TOKEN, token)
                .putString(CLAVE_EXPIRA, expira)
                .putString(CLAVE_USUARIO, gson.toJson(usuario))
                .apply();
    }

    public void actualizarUsuario(Usuario usuario) {
        prefs.edit().putString(CLAVE_USUARIO, gson.toJson(usuario)).apply();
    }

    @Nullable
    public String getToken() {
        return prefs.getString(CLAVE_TOKEN, null);
    }

    @Nullable
    public Usuario getUsuario() {
        String json = prefs.getString(CLAVE_USUARIO, null);
        return json == null ? null : gson.fromJson(json, Usuario.class);
    }

    public boolean haySesion() {
        String token = getToken();
        String expira = prefs.getString(CLAVE_EXPIRA, null);
        if (token == null || expira == null) {
            return false;
        }
        try {
            return OffsetDateTime.parse(expira).isAfter(OffsetDateTime.now());
        } catch (RuntimeException e) {
            return false;
        }
    }

    public void cerrar() {
        prefs.edit().clear().apply();
    }
}
