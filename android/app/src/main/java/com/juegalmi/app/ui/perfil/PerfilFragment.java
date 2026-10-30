package com.juegalmi.app.ui.perfil;

import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.fragment.app.Fragment;

import com.bumptech.glide.Glide;
import com.google.android.material.button.MaterialButtonToggleGroup;
import com.google.android.material.materialswitch.MaterialSwitch;
import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.textfield.TextInputLayout;
import com.juegalmi.app.MainActivity;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.Peticiones;
import com.juegalmi.app.data.model.Usuario;
import com.juegalmi.app.data.repository.AuthRepository;
import com.juegalmi.app.data.repository.ImagenRepository;
import com.juegalmi.app.ui.comun.Pastilla;
import com.juegalmi.app.util.Camara;
import com.juegalmi.app.util.Preferencias;
import com.juegalmi.app.util.Validacion;

/**
 * PT-21 Perfil: datos del cliente (PUT /api/me), foto con la cámara (RF-14, POST /api/imagenes),
 * tema claro/oscuro y «agitar para refrescar».
 */
public class PerfilFragment extends Fragment {

    private AuthRepository auth;
    private TextInputLayout tilNombre;
    private TextInputLayout tilApellidos;
    private TextInputLayout tilTelefono;
    private com.google.android.material.imageview.ShapeableImageView avatar;
    private Button btnGuardar;
    private View progreso;
    private Uri fotoPendiente;

    private final ActivityResultLauncher<Uri> camara = registerForActivityResult(
            new ActivityResultContracts.TakePicture(), hecha -> {
                if (hecha) {
                    subirFoto(fotoPendiente);
                }
            });

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_perfil, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        auth = new AuthRepository(requireContext());
        tilNombre = v.findViewById(R.id.tilNombre);
        tilApellidos = v.findViewById(R.id.tilApellidos);
        tilTelefono = v.findViewById(R.id.tilTelefono);
        avatar = v.findViewById(R.id.ivAvatar);
        btnGuardar = v.findViewById(R.id.btnGuardar);
        progreso = v.findViewById(R.id.progreso);
        pintar(auth.getUsuario());

        v.findViewById(R.id.btnCamara).setOnClickListener(b -> {
            fotoPendiente = Camara.nuevaFoto(requireContext());
            camara.launch(fotoPendiente);
        });
        btnGuardar.setOnClickListener(b -> guardar());
        v.findViewById(R.id.btnCerrarSesion).setOnClickListener(b ->
                ((MainActivity) requireActivity()).confirmarCierreSesion());

        // Tema: se guarda y se aplica al momento (la pantalla se recrea con los otros colores)
        MaterialButtonToggleGroup tema = v.findViewById(R.id.grupoTema);
        int modo = Preferencias.tema(requireContext());
        tema.check(modo == AppCompatDelegate.MODE_NIGHT_NO ? R.id.temaClaro
                : modo == AppCompatDelegate.MODE_NIGHT_YES ? R.id.temaOscuro : R.id.temaSistema);
        tema.addOnButtonCheckedListener((g, id, marcado) -> {
            if (!marcado) return;
            int nuevo = id == R.id.temaClaro ? AppCompatDelegate.MODE_NIGHT_NO
                    : id == R.id.temaOscuro ? AppCompatDelegate.MODE_NIGHT_YES
                    : AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM;
            if (nuevo != Preferencias.tema(requireContext())) {
                Preferencias.cambiarTema(requireContext(), nuevo);
            }
        });

        MaterialSwitch agitar = v.findViewById(R.id.swAgitar);
        agitar.setChecked(Preferencias.agitar(requireContext()));
        agitar.setOnCheckedChangeListener((s, activo) -> Preferencias.cambiarAgitar(requireContext(), activo));
    }

    private void pintar(Usuario u) {
        if (u == null) return;
        View v = requireView();
        ((TextView) v.findViewById(R.id.tvNombre)).setText(u.nombreCompleto());
        Pastilla.pintar(v.findViewById(R.id.tvRol), R.color.ja_marca, getString(R.string.rol_cliente));
        texto(tilNombre, u.nombre);
        texto(tilApellidos, u.apellidos);
        texto(v.findViewById(R.id.tilEmail), u.email);
        texto(tilTelefono, u.telefono);
        texto(v.findViewById(R.id.tilDni), u.dni);
        if (u.foto != null) {
            avatar.setContentPadding(0, 0, 0, 0);
            avatar.setImageTintList(null);
            Glide.with(this).load(u.foto).placeholder(R.drawable.ic_person).centerCrop().into(avatar);
        }
    }

    private void guardar() {
        String telefono = leer(tilTelefono);
        tilNombre.setError(leer(tilNombre).isEmpty() ? getString(R.string.error_obligatorio) : null);
        tilTelefono.setError(Validacion.telefono(telefono) ? null : getString(R.string.error_telefono));
        if (tilNombre.getError() != null || tilTelefono.getError() != null) return;

        Peticiones.Perfil cambios = new Peticiones.Perfil();
        cambios.nombre = leer(tilNombre);
        cambios.apellidos = leer(tilApellidos);
        cambios.telefono = telefono;
        enviar(cambios, R.string.perfil_guardado);
    }

    /** 1.º sube la foto (reducida en segundo plano) y 2.º guarda su URL en el perfil. */
    private void subirFoto(Uri foto) {
        cargando(true);
        new ImagenRepository(requireContext()).subir(foto, ImagenRepository.USUARIOS, new Callback<String>() {
            @Override
            public void onExito(String url) {
                Peticiones.Perfil cambios = new Peticiones.Perfil();
                cambios.foto = url;
                enviar(cambios, R.string.perfil_foto_guardada);
            }

            @Override
            public void onError(ApiError error) {
                if (!isAdded()) return;
                cargando(false);
                Snackbar.make(requireView(), error.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void enviar(Peticiones.Perfil cambios, int mensajeOk) {
        cargando(true);
        auth.actualizarPerfil(cambios, new Callback<Usuario>() {
            @Override
            public void onExito(Usuario u) {
                if (!isAdded()) return;
                cargando(false);
                pintar(u);
                ((MainActivity) requireActivity()).pintarCabecera(u);
                Snackbar.make(requireView(), mensajeOk, Snackbar.LENGTH_SHORT).show();
            }

            @Override
            public void onError(ApiError error) {
                if (!isAdded()) return;
                cargando(false);
                if (error.campo("telefono") != null) tilTelefono.setError(error.campo("telefono"));
                if (error.campo("nombre") != null) tilNombre.setError(error.campo("nombre"));
                Snackbar.make(requireView(), error.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void cargando(boolean si) {
        btnGuardar.setEnabled(!si);
        btnGuardar.setText(si ? "" : getString(R.string.perfil_guardar));
        progreso.setVisibility(si ? View.VISIBLE : View.GONE);
    }

    private static void texto(TextInputLayout til, String valor) {
        if (til.getEditText() != null) til.getEditText().setText(valor);
    }

    private static String leer(TextInputLayout til) {
        return til.getEditText() == null ? "" : til.getEditText().getText().toString().trim();
    }
}
