package com.juegalmi.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import com.google.android.material.button.MaterialButton;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.juegalmi.app.MainActivity;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Usuario;
import com.juegalmi.app.data.repository.AuthRepository;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.Validacion;

/** PT-02 Login: email + contraseña → POST /api/login → MainActivity. */
public class LoginFragment extends Fragment {

    static final String RESULTADO_REGISTRO = "registro";
    private static final String CLAVE_EMAIL = "email";

    private AuthRepository repositorio;
    private TextInputLayout tilEmail;
    private TextInputLayout tilPassword;
    private TextInputEditText etEmail;
    private TextInputEditText etPassword;
    private MaterialButton btnEntrar;
    private CircularProgressIndicator progreso;

    static Bundle resultadoRegistro(String email) {
        Bundle b = new Bundle();
        b.putString(CLAVE_EMAIL, email);
        return b;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_login, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View vista, @Nullable Bundle savedInstanceState) {
        repositorio = new AuthRepository(requireContext());
        Bordes.aplicar(vista.findViewById(R.id.raiz), true, true);

        tilEmail = vista.findViewById(R.id.tilEmail);
        tilPassword = vista.findViewById(R.id.tilPassword);
        etEmail = vista.findViewById(R.id.etEmail);
        etPassword = vista.findViewById(R.id.etPassword);
        btnEntrar = vista.findViewById(R.id.btnEntrar);
        progreso = vista.findViewById(R.id.progreso);

        btnEntrar.setOnClickListener(v -> entrar());
        etPassword.setOnEditorActionListener((v, accion, evento) -> {
            if (accion == EditorInfo.IME_ACTION_DONE) {
                entrar();
                return true;
            }
            return false;
        });
        vista.findViewById(R.id.btnIrRegistro).setOnClickListener(v ->
                ((AuthActivity) requireActivity()).abrirRegistro());

        // Al volver del registro: el email ya escrito y un aviso de que la cuenta está creada
        getParentFragmentManager().setFragmentResultListener(RESULTADO_REGISTRO, getViewLifecycleOwner(),
                (clave, datos) -> {
                    etEmail.setText(datos.getString(CLAVE_EMAIL));
                    etPassword.requestFocus();
                    Snackbar.make(vista, R.string.registro_hecho, Snackbar.LENGTH_LONG).show();
                });
    }

    private void entrar() {
        String email = texto(etEmail);
        String password = texto(etPassword);

        // Validación local: error debajo del campo y cómo corregirlo (rúbrica Interfaces)
        tilEmail.setError(Validacion.email(email) ? null : getString(R.string.error_email));
        tilPassword.setError(password.isEmpty() ? getString(R.string.error_password_vacia) : null);
        if (tilEmail.getError() != null || tilPassword.getError() != null) {
            return;
        }

        cargando(true);
        repositorio.login(email, password, this, new Callback<Usuario>() {
            @Override
            public void onExito(Usuario usuario) {
                Intent intent = new Intent(requireContext(), MainActivity.class)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
            }

            @Override
            public void onError(ApiError error) {
                cargando(false);
                if (error.status == 401) {
                    // CREDENCIALES_INCORRECTAS o CUENTA_DESACTIVADA: el mensaje de la API ya lo explica
                    tilPassword.setError(error.mensaje);
                } else {
                    Snackbar.make(requireView(), error.mensaje, Snackbar.LENGTH_LONG).show();
                }
            }
        });
    }

    private void cargando(boolean si) {
        btnEntrar.setEnabled(!si);
        btnEntrar.setText(si ? "" : getString(R.string.login_entrar));
        btnEntrar.setIconResource(si ? 0 : R.drawable.ic_arrow_forward);
        progreso.setVisibility(si ? View.VISIBLE : View.GONE);
    }

    private static String texto(TextInputEditText campo) {
        return campo.getText() == null ? "" : campo.getText().toString().trim();
    }

    @Override
    public void onDestroyView() {
        // Si el usuario sale antes de que responda la API, la respuesta no llega a una vista que ya no existe
        VolleyClient.get(requireContext()).cancelar(this);
        super.onDestroyView();
    }
}
