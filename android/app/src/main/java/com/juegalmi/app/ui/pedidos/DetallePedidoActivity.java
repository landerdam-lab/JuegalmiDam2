package com.juegalmi.app.ui.pedidos;

import android.content.res.ColorStateList;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.snackbar.Snackbar;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Alquiler;
import com.juegalmi.app.data.model.Pedido;
import com.juegalmi.app.data.repository.PedidoRepository;
import com.juegalmi.app.ui.comun.BarraVida;
import com.juegalmi.app.ui.comun.EstadoVista;
import com.juegalmi.app.ui.comun.FilaResumen;
import com.juegalmi.app.ui.comun.Pastilla;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.Fechas;
import com.juegalmi.app.util.Formato;

/**
 * PT-14 Detalle de pedido: estado con barra de vida etiquetada, compras, alquileres y resumen.
 * «Cancelar» solo si está pendiente (la API devuelve el stock y libera las copias, ADR-035).
 */
public class DetallePedidoActivity extends AppCompatActivity {

    public static final String EXTRA_ID = "id";

    private PedidoRepository repositorio;
    private EstadoVista estado;
    private int id;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_detalle_pedido);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        Bordes.aplicar(toolbar, true, false);
        Bordes.aplicar(findViewById(R.id.scroll), false, true);
        toolbar.setNavigationOnClickListener(v -> finish());

        id = getIntent().getIntExtra(EXTRA_ID, 0);
        repositorio = new PedidoRepository(this);
        estado = new EstadoVista(findViewById(android.R.id.content));
        cargar();
    }

    private void cargar() {
        estado.ocultar();
        findViewById(R.id.progreso).setVisibility(View.VISIBLE);
        repositorio.pedido(id, this, new Callback<Pedido>() {
            @Override
            public void onExito(Pedido p) {
                findViewById(R.id.progreso).setVisibility(View.GONE);
                findViewById(R.id.scroll).setVisibility(View.VISIBLE);
                pintar(p);
            }

            @Override
            public void onError(ApiError error) {
                findViewById(R.id.progreso).setVisibility(View.GONE);
                estado.error(R.string.pedidos_error, error, () -> cargar());
            }
        });
    }

    private void pintar(Pedido p) {
        ((MaterialToolbar) findViewById(R.id.toolbar)).setTitle(getString(R.string.detalle_pedido_titulo, p.referencia()));

        int color = Pastilla.colorPedido(p.estado);
        Pastilla.pintar(findViewById(R.id.tvEstado), color, Pastilla.texto(this, p.estado));
        ((TextView) findViewById(R.id.tvEstadoTitulo)).setText(textoEstado(p.estado));
        ((BarraVida) findViewById(R.id.barra)).mostrar(3, PedidoAdapter.paso(p.estado), color);
        ((MaterialCardView) findViewById(R.id.cajaEstado)).setCardBackgroundColor(
                ColorStateList.valueOf(ContextCompat.getColor(this, Pedido.PREPARADO.equals(p.estado)
                        ? R.color.ja_info_suave : R.color.ja_superficie)));

        ViewGroup lineas = findViewById(R.id.lineas);
        lineas.removeAllViews();
        for (Pedido.Compra c : p.compras) {
            FilaResumen.anadir(lineas, c.producto.nombre,
                    getString(R.string.detalle_pedido_compra, c.cantidad, Formato.precio(c.precioUnitario)),
                    Formato.precio(c.subtotal), c.producto.imagen);
        }
        for (Alquiler a : p.alquileres) {
            FilaResumen.anadir(lineas, a.videojuego.nombre,
                    getString(R.string.detalle_pedido_alquiler, Fechas.corta(a.fechaInicio), Fechas.corta(a.fechaFin),
                            Pastilla.texto(this, a.estado)),
                    Formato.precio(a.subtotal), a.videojuego.imagen);
        }

        ViewGroup resumen = findViewById(R.id.resumen);
        resumen.removeAllViews();
        FilaResumen.anadir(resumen, getString(R.string.ticket_fecha), "", Fechas.fechaHora(p.fecha), null);
        FilaResumen.anadir(resumen, getString(R.string.ticket_metodo), "", MetodosPago.texto(this, p.metodoPago), null);
        FilaResumen.anadir(resumen, getString(R.string.carrito_recogida_corta), "", getString(R.string.gratis), null);
        FilaResumen.anadir(resumen, getString(R.string.total), "", Formato.precio(p.total), null);

        boolean cancelable = Pedido.PENDIENTE.equals(p.estado);
        View cancelar = findViewById(R.id.btnCancelar);
        cancelar.setEnabled(cancelable);
        cancelar.setAlpha(cancelable ? 1f : 0.4f);
        ((TextView) findViewById(R.id.tvMotivo)).setText(cancelable ? getString(R.string.detalle_pedido_cancelable)
                : getString(R.string.detalle_pedido_no_cancelable, Pastilla.texto(this, p.estado).toLowerCase()));
        cancelar.setOnClickListener(v -> confirmarCancelacion(p));
    }

    private int textoEstado(String estado) {
        switch (estado) {
            case Pedido.PENDIENTE: return R.string.pedido_texto_pendiente;
            case Pedido.PREPARADO: return R.string.pedido_texto_preparado;
            case Pedido.ENTREGADO: return R.string.pedido_texto_entregado;
            default: return R.string.pedido_texto_cancelado;
        }
    }

    /** Diálogo destructivo antes de cancelar (DESIGN.md §9). */
    private void confirmarCancelacion(Pedido p) {
        new MaterialAlertDialogBuilder(this, R.style.ThemeOverlay_JuegAlmi_Dialogo)
                .setTitle(getString(R.string.cancelar_pedido_titulo, p.referencia()))
                .setMessage(R.string.cancelar_pedido_texto)
                .setNegativeButton(R.string.volver, null)
                .setPositiveButton(R.string.detalle_pedido_cancelar, (d, w) ->
                        repositorio.cancelar(p.id, new Callback<Pedido>() {
                            @Override
                            public void onExito(Pedido cancelado) {
                                if (!isFinishing()) {
                                    pintar(cancelado);
                                    Snackbar.make(findViewById(R.id.scroll), R.string.pedido_cancelado_ok, Snackbar.LENGTH_LONG).show();
                                }
                            }

                            @Override
                            public void onError(ApiError error) {
                                if (!isFinishing()) {
                                    Snackbar.make(findViewById(R.id.scroll), error.mensaje, Snackbar.LENGTH_LONG).show();
                                }
                            }
                        }))
                .show();
    }

    @Override
    protected void onDestroy() {
        VolleyClient.get(this).cancelar(this);
        super.onDestroy();
    }
}
