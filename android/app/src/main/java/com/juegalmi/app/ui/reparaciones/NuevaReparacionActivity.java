package com.juegalmi.app.ui.reparaciones;

import android.Manifest;
import android.net.Uri;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.core.os.BundleCompat;

import com.bumptech.glide.Glide;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.textfield.TextInputLayout;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Referencia;
import com.juegalmi.app.data.model.Reparacion;
import com.juegalmi.app.data.repository.ImagenRepository;
import com.juegalmi.app.data.repository.ReparacionRepository;
import com.juegalmi.app.ui.comun.BarraVida;
import com.juegalmi.app.ui.comun.Pastilla;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.Camara;
import com.juegalmi.app.util.UbicacionHelper;

import java.util.ArrayList;
import java.util.List;

/**
 * PT-17 Solicitar reparación: departamento, dispositivo, problema, foto con la cámara (RF-14) y ubicación (RF-11).
 * Primero sube la foto (POST /api/imagenes) y luego crea la reparación (POST /api/reparaciones), las dos con Retrofit.
 */
public class NuevaReparacionActivity extends AppCompatActivity {

    private static final int PASOS = 5;
    private static final String ESTADO_DEPARTAMENTO = "departamento";
    private static final String ESTADO_FOTO = "foto";
    private static final String ESTADO_FOTO_PENDIENTE = "fotoPendiente";

    private ReparacionRepository repositorio;
    private UbicacionHelper ubicacion;
    private final List<MaterialCardView> tarjetas = new ArrayList<>();
    private final List<Referencia> departamentos = new ArrayList<>();
    private Referencia elegido;
    /** Id del departamento elegido antes de girar; se vuelve a marcar cuando llegan los departamentos. */
    private int departamentoGuardado = -1;
    private Uri fotoPendiente;
    private Uri foto;
    private TextInputLayout tilDispositivo;
    private TextInputLayout tilProblema;
    private com.google.android.material.button.MaterialButton btnEnviar;
    private View progreso;

    /** La app de cámara devuelve true si se hizo la foto y se guardó en la Uri que le dimos. */
    private final ActivityResultLauncher<Uri> camara = registerForActivityResult(
            new ActivityResultContracts.TakePicture(), hecha -> {
                if (hecha) {
                    mostrarFoto(fotoPendiente);
                    pintarPasos();
                }
            });

    private void mostrarFoto(Uri uri) {
        foto = uri;
        ImageView iv = findViewById(R.id.ivFoto);
        iv.setVisibility(View.VISIBLE);
        Glide.with(this).load(foto).centerCrop().into(iv);
        ((TextView) findViewById(R.id.tvFoto)).setText(R.string.reparacion_foto_lista);
    }

    /**
     * Lo que se perdería al girar el móvil, o si Android cierra la app mientras está abierta la cámara:
     * el departamento elegido, la foto hecha y la Uri donde la cámara va a guardar la siguiente.
     */
    @Override
    protected void onSaveInstanceState(@NonNull Bundle estado) {
        super.onSaveInstanceState(estado);
        estado.putInt(ESTADO_DEPARTAMENTO, elegido != null ? elegido.id : departamentoGuardado);
        estado.putParcelable(ESTADO_FOTO, foto);
        estado.putParcelable(ESTADO_FOTO_PENDIENTE, fotoPendiente);
    }

    private final ActivityResultLauncher<String> permisoUbicacion = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(), concedido -> {
                ubicacion.actualizar();
                findViewById(R.id.tvUbicacion).postDelayed(this::pintarUbicacion, 1500);
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_nueva_reparacion);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        Bordes.aplicar(toolbar, true, false);
        Bordes.aplicar(findViewById(R.id.pie), false, true);
        toolbar.setNavigationOnClickListener(v -> finish());

        repositorio = new ReparacionRepository(this);
        ubicacion = UbicacionHelper.get(this);
        ubicacion.actualizar();
        tilDispositivo = findViewById(R.id.tilDispositivo);
        tilProblema = findViewById(R.id.tilProblema);
        btnEnviar = findViewById(R.id.btnEnviar);
        progreso = findViewById(R.id.progreso);

        // Al girar el móvil la pantalla se crea de nuevo: se recupera lo que no es texto (el texto lo guarda Android)
        if (savedInstanceState != null) {
            departamentoGuardado = savedInstanceState.getInt(ESTADO_DEPARTAMENTO, -1);
            fotoPendiente = BundleCompat.getParcelable(savedInstanceState, ESTADO_FOTO_PENDIENTE, Uri.class);
            Uri guardada = BundleCompat.getParcelable(savedInstanceState, ESTADO_FOTO, Uri.class);
            if (guardada != null) {
                mostrarFoto(guardada);
            }
        }

        TextWatcher alEscribir = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int a, int b, int c) {
            }

            @Override
            public void onTextChanged(CharSequence s, int a, int b, int c) {
            }

            @Override
            public void afterTextChanged(Editable s) {
                pintarPasos();
            }
        };
        tilDispositivo.getEditText().addTextChangedListener(alEscribir);
        tilProblema.getEditText().addTextChangedListener(alEscribir);

        findViewById(R.id.btnFoto).setOnClickListener(v -> {
            fotoPendiente = Camara.nuevaFoto(this);
            camara.launch(fotoPendiente);
        });
        findViewById(R.id.tvUbicacion).setOnClickListener(v -> {
            if (!ubicacion.tienePermiso()) {
                permisoUbicacion.launch(Manifest.permission.ACCESS_COARSE_LOCATION);
            }
        });
        btnEnviar.setOnClickListener(v -> enviar());

        cargarDepartamentos();
        pintarUbicacion();
        findViewById(R.id.tvUbicacion).postDelayed(this::pintarUbicacion, 1000);
        pintarPasos();
    }

    private void cargarDepartamentos() {
        repositorio.departamentos(this, new Callback<List<Referencia>>() {
            @Override
            public void onExito(List<Referencia> lista) {
                departamentos.clear();
                departamentos.addAll(lista);
                LinearLayout contenedor = findViewById(R.id.departamentos);
                contenedor.removeAllViews();
                tarjetas.clear();
                int hueco = getResources().getDimensionPixelSize(R.dimen.ja_espacio_3);
                for (int i = 0; i < lista.size(); i++) {
                    Referencia d = lista.get(i);
                    MaterialCardView tarjeta = (MaterialCardView) LayoutInflater.from(NuevaReparacionActivity.this)
                            .inflate(R.layout.item_departamento, contenedor, false);
                    boolean telefonia = d.nombre.toLowerCase().startsWith("tel");
                    ((ImageView) tarjeta.findViewById(R.id.ivIcono)).setImageResource(
                            telefonia ? R.drawable.ic_phone_android : R.drawable.ic_sports_esports);
                    ((TextView) tarjeta.findViewById(R.id.tvNombre)).setText(d.nombre);
                    ((TextView) tarjeta.findViewById(R.id.tvDescripcion)).setText(
                            telefonia ? R.string.departamento_telefonia : R.string.departamento_consolas);
                    if (i > 0) {
                        ((ViewGroup.MarginLayoutParams) tarjeta.getLayoutParams()).setMarginStart(hueco);
                    }
                    tarjeta.setOnClickListener(v -> elegir(d, tarjeta));
                    tarjetas.add(tarjeta);
                    contenedor.addView(tarjeta);
                    if (d.id == departamentoGuardado) {
                        elegir(d, tarjeta); // el que estaba elegido antes de girar
                    }
                }
            }

            @Override
            public void onError(ApiError error) {
                Snackbar.make(btnEnviar, error.mensaje, Snackbar.LENGTH_INDEFINITE)
                        .setAction(R.string.reintentar, v -> cargarDepartamentos()).show();
            }
        });
    }

    /** Tarjeta elegida: borde grueso violeta y fondo marca-suave (DESIGN.md §9, selección). */
    private void elegir(Referencia d, MaterialCardView tarjeta) {
        elegido = d;
        for (MaterialCardView t : tarjetas) {
            boolean si = t == tarjeta;
            t.setChecked(si);
            t.setStrokeColor(ContextCompat.getColor(this, si ? R.color.ja_marca : R.color.ja_borde));
            t.setStrokeWidth(getResources().getDimensionPixelSize(si ? R.dimen.ja_borde_grueso : R.dimen.ja_borde_fino));
            t.setCardBackgroundColor(ContextCompat.getColor(this, si ? R.color.ja_marca_suave : R.color.ja_superficie));
        }
        pintarPasos();
    }

    private void pintarUbicacion() {
        TextView tv = findViewById(R.id.tvUbicacion);
        if (ubicacion.hayUbicacion()) {
            Pastilla.pintar(tv, R.color.ja_exito, getString(R.string.ubicacion_obtenida));
        } else if (!ubicacion.tienePermiso()) {
            Pastilla.pintar(tv, R.color.ja_error, getString(R.string.ubicacion_dar_permiso));
        } else {
            Pastilla.pintar(tv, R.color.ja_info, getString(R.string.ubicacion_buscando));
        }
        pintarPasos();
    }

    /** Barra de 5: departamento, dispositivo, problema, foto y ubicación. */
    private void pintarPasos() {
        int hechos = 0;
        if (elegido != null) hechos++;
        if (!texto(tilDispositivo).isEmpty()) hechos++;
        if (!texto(tilProblema).isEmpty()) hechos++;
        if (foto != null) hechos++;
        if (ubicacion.hayUbicacion()) hechos++;
        ((BarraVida) findViewById(R.id.barraPasos)).mostrar(PASOS, hechos, R.color.ja_marca);
        ((TextView) findViewById(R.id.tvPaso)).setText(getString(R.string.reparacion_progreso, hechos, PASOS));
    }

    private void enviar() {
        boolean ok = true;
        if (elegido == null) {
            Snackbar.make(btnEnviar, R.string.reparacion_elige_departamento, Snackbar.LENGTH_LONG).show();
            ok = false;
        }
        tilDispositivo.setError(texto(tilDispositivo).isEmpty() ? getString(R.string.reparacion_falta_dispositivo) : null);
        tilProblema.setError(texto(tilProblema).isEmpty() ? getString(R.string.reparacion_falta_problema) : null);
        if (!ok || tilDispositivo.getError() != null || tilProblema.getError() != null) {
            return;
        }
        if (!ubicacion.hayUbicacion()) {
            pintarUbicacion();
            Snackbar.make(btnEnviar, R.string.confirmar_falta_ubicacion, Snackbar.LENGTH_LONG)
                    .setAction(R.string.ubicacion_dar_permiso,
                            v -> permisoUbicacion.launch(Manifest.permission.ACCESS_COARSE_LOCATION)).show();
            return;
        }
        cargando(true);
        if (foto == null) {
            crear(null);
            return;
        }
        // 1.º la foto (se reduce y comprime en segundo plano) y 2.º la reparación con su URL
        new ImagenRepository(this).subir(foto, ImagenRepository.REPARACIONES, new Callback<String>() {
            @Override
            public void onExito(String url) {
                crear(url);
            }

            @Override
            public void onError(ApiError error) {
                cargando(false);
                Snackbar.make(btnEnviar, error.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void crear(String urlFoto) {
        repositorio.crear(elegido.id, texto(tilDispositivo), texto(tilProblema), urlFoto, new Callback<Reparacion>() {
            @Override
            public void onExito(Reparacion r) {
                new MaterialAlertDialogBuilder(NuevaReparacionActivity.this, R.style.ThemeOverlay_JuegAlmi_Dialogo)
                        .setTitle(getString(R.string.reparacion_creada_titulo, r.referencia()))
                        .setMessage(R.string.reparacion_creada_texto)
                        .setCancelable(false)
                        .setPositiveButton(android.R.string.ok, (d, w) -> finish())
                        .show();
            }

            @Override
            public void onError(ApiError error) {
                cargando(false);
                if (error.campo("dispositivo") != null) tilDispositivo.setError(error.campo("dispositivo"));
                if (error.campo("problema") != null) tilProblema.setError(error.campo("problema"));
                Snackbar.make(btnEnviar, error.mensaje, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    private void cargando(boolean si) {
        btnEnviar.setEnabled(!si);
        btnEnviar.setText(si ? "" : getString(R.string.reparacion_enviar));
        btnEnviar.setIconResource(si ? 0 : R.drawable.ic_arrow_forward);
        progreso.setVisibility(si ? View.VISIBLE : View.GONE);
    }

    private static String texto(TextInputLayout til) {
        return til.getEditText() == null ? "" : til.getEditText().getText().toString().trim();
    }

    @Override
    protected void onDestroy() {
        VolleyClient.get(this).cancelar(this);
        super.onDestroy();
    }
}
