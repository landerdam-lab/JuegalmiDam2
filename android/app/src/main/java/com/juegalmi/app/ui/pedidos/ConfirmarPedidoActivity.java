package com.juegalmi.app.ui.pedidos;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.checkbox.MaterialCheckBox;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.snackbar.Snackbar;
import com.google.gson.Gson;
import com.juegalmi.app.R;
import com.juegalmi.app.data.Carrito;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.Pedido;
import com.juegalmi.app.data.repository.PedidoRepository;
import com.juegalmi.app.ui.comun.BarraVida;
import com.juegalmi.app.ui.comun.FilaResumen;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.Formato;
import com.juegalmi.app.util.UbicacionHelper;

import java.util.Locale;

/**
 * PT-12 Confirmar pedido: resumen del carrito, ubicación y POST /api/pedidos (Retrofit).
 * Sin ubicación no se puede confirmar (P-28 → la API respondería 422): se pide el permiso y se explica por qué.
 */
public class ConfirmarPedidoActivity extends AppCompatActivity {

    public static final String EXTRA_METODO = "metodo";

    private Carrito carrito;
    private UbicacionHelper ubicacion;
    private TextView tvUbicacion;
    private Button btnPermiso;
    private Button btnConfirmar;
    private MaterialCheckBox cbAcepto;
    private View progreso;
    private final Handler principal = new Handler(Looper.getMainLooper());

    private final ActivityResultLauncher<String> permiso = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(), concedido -> {
                if (concedido) {
                    ubicacion.actualizar();
                    // La ubicación llega de forma asíncrona: se vuelve a mirar en un momento
                    principal.postDelayed(this::pintarUbicacion, 1500);
                }
                pintarUbicacion();
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_confirmar_pedido);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        Bordes.aplicar(toolbar, true, false);
        Bordes.aplicar(findViewById(R.id.pie), false, true);
        toolbar.setNavigationOnClickListener(v -> finish());

        carrito = Carrito.get(this);
        ubicacion = UbicacionHelper.get(this);
        ubicacion.actualizar();

        ((BarraVida) findViewById(R.id.barraPasos)).mostrar(3, 2, R.color.ja_marca);

        ViewGroup lineas = findViewById(R.id.lineas);
        for (Carrito.Linea l : carrito.lista()) {
            String detalle = Carrito.ALQUILER.equals(l.tipo)
                    ? getString(R.string.resumen_alquiler, getResources().getQuantityString(R.plurals.dias, l.dias, l.dias))
                    : getString(R.string.resumen_cantidad, l.cantidad);
            FilaResumen.anadir(lineas, l.producto.nombre, detalle, Formato.precio(l.subtotal()), l.producto.imagen);
        }
        ((TextView) findViewById(R.id.tvTotal)).setText(Formato.precio(carrito.total()));

        String metodo = getIntent().getStringExtra(EXTRA_METODO);
        ((TextView) findViewById(R.id.tvMetodo)).setText(getString(R.string.confirmar_metodo, textoMetodo(metodo)));

        tvUbicacion = findViewById(R.id.tvUbicacion);
        btnPermiso = findViewById(R.id.btnPermiso);
        btnPermiso.setOnClickListener(v -> permiso.launch(Manifest.permission.ACCESS_COARSE_LOCATION));
        cbAcepto = findViewById(R.id.cbAcepto);
        progreso = findViewById(R.id.progreso);
        btnConfirmar = findViewById(R.id.btnConfirmar);
        btnConfirmar.setText(getString(R.string.confirmar_boton, Formato.precio(carrito.total())));
        btnConfirmar.setOnClickListener(v -> confirmar(metodo));
        principal.postDelayed(this::pintarUbicacion, 800);
        pintarUbicacion();
    }

    private void pintarUbicacion() {
        if (ubicacion.hayUbicacion()) {
            tvUbicacion.setText(getString(R.string.confirmar_ubicacion_ok,
                    String.format(Locale.ROOT, "%.4f, %.4f", ubicacion.getLatitud(), ubicacion.getLongitud())));
            tvUbicacion.setTextColor(ContextCompat.getColor(this, R.color.ja_exito));
            btnPermiso.setVisibility(View.GONE);
        } else if (!ubicacion.tienePermiso()) {
            tvUbicacion.setText(R.string.confirmar_ubicacion_sin_permiso);
            tvUbicacion.setTextColor(ContextCompat.getColor(this, R.color.ja_error));
            btnPermiso.setVisibility(View.VISIBLE);
        } else {
            tvUbicacion.setText(R.string.confirmar_ubicacion_buscando);
            tvUbicacion.setTextColor(ContextCompat.getColor(this, R.color.ja_info));
            btnPermiso.setVisibility(View.GONE);
        }
    }

    private void confirmar(String metodo) {
        if (!cbAcepto.isChecked()) {
            Snackbar.make(btnConfirmar, R.string.confirmar_falta_aceptar, Snackbar.LENGTH_LONG).show();
            return;
        }
        if (!ubicacion.hayUbicacion()) {
            pintarUbicacion();
            Snackbar.make(btnConfirmar, R.string.confirmar_falta_ubicacion, Snackbar.LENGTH_LONG).show();
            return;
        }
        cargando(true);
        new PedidoRepository(this).crear(carrito.paraLaApi(), metodo, new Callback<Pedido>() {
            @Override
            public void onExito(Pedido pedido) {
                carrito.vaciar();
                startActivity(new Intent(ConfirmarPedidoActivity.this, PedidoRealizadoActivity.class)
                        .putExtra(PedidoRealizadoActivity.EXTRA_PEDIDO, new Gson().toJson(pedido)));
                finish();
            }

            @Override
            public void onError(ApiError error) {
                if (isFinishing()) {
                    return;
                }
                cargando(false);
                // 409 STOCK_INSUFICIENTE / SIN_COPIAS: el mensaje de la API dice qué producto falla
                new MaterialAlertDialogBuilder(ConfirmarPedidoActivity.this, R.style.ThemeOverlay_JuegAlmi_Dialogo)
                        .setTitle(error.status == 409 ? R.string.confirmar_error_stock : R.string.confirmar_error)
                        .setMessage(error.campos.isEmpty() ? error.mensaje
                                : error.mensaje + "\n\n" + String.join("\n", error.campos.values()))
                        .setPositiveButton(android.R.string.ok, null)
                        .show();
            }
        });
    }

    private void cargando(boolean si) {
        btnConfirmar.setEnabled(!si);
        btnConfirmar.setText(si ? "" : getString(R.string.confirmar_boton, Formato.precio(carrito.total())));
        progreso.setVisibility(si ? View.VISIBLE : View.GONE);
    }

    String textoMetodo(String metodo) {
        return MetodosPago.texto(this, metodo);
    }

    @Override
    protected void onDestroy() {
        principal.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
