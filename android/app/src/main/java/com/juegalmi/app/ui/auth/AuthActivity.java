package com.juegalmi.app.ui.auth;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.snackbar.Snackbar;
import com.juegalmi.app.R;

/**
 * Pantallas sin sesión: Login (PT-02) y Registro (PT-03), como dos fragments en el mismo contenedor.
 * Se llega aquí desde el splash si no hay sesión, al cerrar sesión o tras un 401.
 */
public class AuthActivity extends AppCompatActivity {

    /** true si venimos de un 401: se avisa de que la sesión ha caducado. */
    public static final String EXTRA_SESION_CADUCADA = "sesion_caducada";
    /** true si el splash no pudo comprobar la sesión por falta de red. */
    public static final String EXTRA_SIN_RED = "sin_red";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_auth);

        if (savedInstanceState == null) {
            getSupportFragmentManager().beginTransaction()
                    .replace(R.id.contenedorAuth, new LoginFragment())
                    .commit();

            int aviso = 0;
            if (getIntent().getBooleanExtra(EXTRA_SESION_CADUCADA, false)) {
                aviso = R.string.sesion_caducada;
            } else if (getIntent().getBooleanExtra(EXTRA_SIN_RED, false)) {
                aviso = R.string.error_sin_red;
            }
            if (aviso != 0) {
                Snackbar.make(findViewById(R.id.contenedorAuth), aviso, Snackbar.LENGTH_LONG).show();
            }
        }
    }

    /** Del login al registro. addToBackStack: el botón atrás vuelve al login. */
    void abrirRegistro() {
        getSupportFragmentManager().beginTransaction()
                .setCustomAnimations(android.R.anim.fade_in, android.R.anim.fade_out,
                        android.R.anim.fade_in, android.R.anim.fade_out)
                .replace(R.id.contenedorAuth, new RegistroFragment())
                .addToBackStack(null)
                .commit();
    }

    /** Del registro al login (con el email ya escrito si se acaba de crear la cuenta). */
    void volverAlLogin(String email) {
        getSupportFragmentManager().popBackStack();
        if (email != null) {
            getSupportFragmentManager().setFragmentResult(LoginFragment.RESULTADO_REGISTRO,
                    LoginFragment.resultadoRegistro(email));
        }
    }
}
