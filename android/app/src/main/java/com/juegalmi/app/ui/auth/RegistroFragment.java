package com.juegalmi.app.ui.auth;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.RegistroPeticion;
import com.juegalmi.app.data.model.Usuario;
import com.juegalmi.app.data.repository.AuthRepository;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.Validacion;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class RegistroFragment extends Fragment {

    private final Map<String, TextInputLayout> campos = new HashMap<>();
    private Button btnCrear;
    private CircularProgressIndicator progreso;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_registro, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View vista, @Nullable Bundle savedInstanceState) {
        Bordes.aplicar(vista.findViewById(R.id.toolbar), true, false);
        Bordes.aplicar(vista.findViewById(R.id.pie), false, true);

        MaterialToolbar toolbar = vista.findViewById(R.id.toolbar);
        toolbar.setNavigationOnClickListener(v -> ((AuthActivity) requireActivity()).volverAlLogin(null));
        vista.findViewById(R.id.btnIrLogin).setOnClickListener(v ->
                ((AuthActivity) requireActivity()).volverAlLogin(null));

        campos.put("nombre", vista.findViewById(R.id.tilNombre));
        campos.put("apellidos", vista.findViewById(R.id.tilApellidos));
        campos.put("email", vista.findViewById(R.id.tilEmail));
        campos.put("password", vista.findViewById(R.id.tilPassword));
        campos.put("telefono", vista.findViewById(R.id.tilTelefono));
        campos.put("dni", vista.findViewById(R.id.tilDni));

        btnCrear = vista.findViewById(R.id.btnCrear);
        progreso = vista.findViewById(R.id.progreso);
        btnCrear.setOnClickListener(v -> crear());
    }

    private void crear() {
        String nombre = texto("nombre");
        String apellidos = texto("apellidos");
        String email = texto("email");
        String password = texto("password");
        String telefono = texto("telefono");
        String dni = texto("dni").toUpperCase(Locale.ROOT);

        boolean ok = comprobar("nombre", !nombre.isEmpty(), R.string.error_obligatorio);
        ok &= comprobar("apellidos", !apellidos.isEmpty(), R.string.error_obligatorio);
        ok &= comprobar("email", Validacion.email(email), R.string.error_email);
        ok &= comprobar("password", password.length() >= Validacion.PASSWORD_MINIMA, R.string.error_password_corta);
        ok &= comprobar("telefono", Validacion.telefono(telefono), R.string.error_telefono);
        ok &= comprobar("dni", Validacion.dni(dni), R.string.error_dni);
        if (!ok) {
            return;
        }

        cargando(true);
        RegistroPeticion peticion = new RegistroPeticion(nombre, apellidos, email, password, telefono, dni);
        new AuthRepository(requireContext()).registro(peticion, new Callback<Usuario>() {
            @Override
            public void onExito(Usuario usuario) {
                if (isAdded()) {
                    ((AuthActivity) requireActivity()).volverAlLogin(email);
                }
            }

            @Override
            public void onError(ApiError error) {
                if (!isAdded()) {
                    return;
                }
                cargando(false);
                boolean pintado = false;
                for (Map.Entry<String, String> e : error.campos.entrySet()) {
                    TextInputLayout til = campos.get(e.getKey());
                    if (til != null) {
                        til.setError(e.getValue());
                        pintado = true;
                    }
                }
                if ("DNI_REPETIDO".equals(error.codigo)) {
                    campos.get("dni").setError(error.mensaje);
                } else if (error.status == 409) {
                    campos.get("email").setError(error.mensaje);
                } else if (!pintado) {
                    Snackbar.make(requireView(), error.mensaje, Snackbar.LENGTH_LONG).show();
                }
            }
        });
    }

    private boolean comprobar(String campo, boolean valido, int mensaje) {
        campos.get(campo).setError(valido ? null : getString(mensaje));
        return valido;
    }

    private String texto(String campo) {
        TextInputEditText et = (TextInputEditText) campos.get(campo).getEditText();
        return et == null || et.getText() == null ? "" : et.getText().toString().trim();
    }

    private void cargando(boolean si) {
        btnCrear.setEnabled(!si);
        btnCrear.setText(si ? "" : getString(R.string.registro_crear));
        progreso.setVisibility(si ? View.VISIBLE : View.GONE);
    }
}
