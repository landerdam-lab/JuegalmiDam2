package com.juegalmi.app.data.repository;

import android.content.Context;

import com.android.volley.Request;
import com.juegalmi.app.R;
import com.juegalmi.app.data.Carrito;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.RetrofitClient;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.LoginRespuesta;
import com.juegalmi.app.data.model.Peticiones;
import com.juegalmi.app.data.model.RegistroPeticion;
import com.juegalmi.app.data.model.Usuario;
import com.juegalmi.app.session.SessionManager;

import java.util.HashMap;
import java.util.Map;

/**
 * Login, registro, sesión y perfil. La vista solo habla con este repositorio: no sabe si por debajo
 * va Volley (login, /me) o Retrofit (registro), ni dónde se guarda el token.
 */
public class AuthRepository {

    private final Context context;
    private final SessionManager sesion;

    public AuthRepository(Context context) {
        this.context = context.getApplicationContext();
        this.sesion = SessionManager.get(context);
    }

    /**
     * POST /api/login (Volley). Si va bien, guarda la sesión.
     * Las apps son solo para clientes (ADR-024): a un técnico o admin no se le guarda la sesión.
     */
    public void login(String email, String password, Object etiqueta, Callback<Usuario> callback) {
        Map<String, String> cuerpo = new HashMap<>();
        cuerpo.put("email", email);
        cuerpo.put("password", password);

        VolleyClient.get(context).post("login", cuerpo, LoginRespuesta.class, false, etiqueta,
                new Callback<LoginRespuesta>() {
                    @Override
                    public void onExito(LoginRespuesta r) {
                        if (r.usuario == null || !r.usuario.esCliente()) {
                            // Cierra en la API el token que se acaba de crear y no lo guarda
                            sesion.guardar(r.token, r.expira, r.usuario);
                            logout(etiqueta);
                            callback.onError(new ApiError(403, "SOLO_CLIENTES",
                                    context.getString(R.string.login_solo_clientes), null));
                            return;
                        }
                        sesion.guardar(r.token, r.expira, r.usuario);
                        Carrito.get(context).deUsuario(r.usuario.id);
                        callback.onExito(r.usuario);
                    }

                    @Override
                    public void onError(ApiError error) {
                        callback.onError(error);
                    }
                });
    }

    /** POST /api/registro (Retrofit). Crea siempre un cliente; después hay que iniciar sesión. */
    public void registro(RegistroPeticion peticion, Callback<Usuario> callback) {
        RetrofitClient cliente = RetrofitClient.get(context);
        cliente.enviar(cliente.servicio().registro(peticion), callback);
    }

    /** GET /api/me: comprueba que el token sigue valiendo (splash) y refresca los datos del usuario. */
    public void comprobarSesion(Object etiqueta, Callback<Usuario> callback) {
        VolleyClient.get(context).get("me", Usuario.class, etiqueta, new Callback<Usuario>() {
            @Override
            public void onExito(Usuario usuario) {
                sesion.actualizarUsuario(usuario);
                callback.onExito(usuario);
            }

            @Override
            public void onError(ApiError error) {
                callback.onError(error);
            }
        });
    }

    /** PUT /api/me (Retrofit): nombre, apellidos, teléfono o foto. El email y el DNI solo los cambia el admin. */
    public void actualizarPerfil(Peticiones.Perfil cambios, Callback<Usuario> callback) {
        RetrofitClient cliente = RetrofitClient.get(context);
        cliente.enviar(cliente.servicio().actualizarPerfil(cambios), new Callback<Usuario>() {
            @Override
            public void onExito(Usuario usuario) {
                sesion.actualizarUsuario(usuario);
                callback.onExito(usuario);
            }

            @Override
            public void onError(ApiError error) {
                callback.onError(error);
            }
        });
    }

    /** POST /api/logout: borra el token en la API. La sesión local se borra aunque falle la red. */
    public void logout(Object etiqueta) {
        VolleyClient.get(context).enviarSinRespuesta(Request.Method.POST, "logout", etiqueta);
        sesion.cerrar();
    }

    public boolean haySesion() {
        return sesion.haySesion();
    }

    public Usuario getUsuario() {
        return sesion.getUsuario();
    }
}
