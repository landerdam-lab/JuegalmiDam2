package com.juegalmi.app.data.api;

import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;

import com.juegalmi.app.session.SessionManager;
import com.juegalmi.app.ui.auth.AuthActivity;

/**
 * Regla de las apps: ante un 401 (token caducado o borrado) se cierra la sesión y se vuelve al login.
 * Lo llaman Volley y Retrofit; por eso se pasa al hilo principal antes de abrir la pantalla.
 */
public final class SesionCaducada {

    private SesionCaducada() {
    }

    public static void manejar(Context context) {
        Context app = context.getApplicationContext();
        new Handler(Looper.getMainLooper()).post(() -> {
            if (SessionManager.get(app).getToken() == null) {
                return; // ya se gestionó (llegan varios 401 a la vez)
            }
            SessionManager.get(app).cerrar();
            Intent intent = new Intent(app, AuthActivity.class)
                    .putExtra(AuthActivity.EXTRA_SESION_CADUCADA, true)
                    // Borra la pila: no se puede volver atrás a una pantalla que necesitaba sesión
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            app.startActivity(intent);
        });
    }
}
