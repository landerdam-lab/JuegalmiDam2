package com.juegalmi.app.ui.pedidos;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.google.android.material.snackbar.Snackbar;
import com.google.gson.Gson;
import com.juegalmi.app.R;
import com.juegalmi.app.data.model.Pedido;
import com.juegalmi.app.ui.comun.BarraVida;
import com.juegalmi.app.ui.comun.FilaResumen;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.Fechas;
import com.juegalmi.app.util.Formato;

public class PedidoRealizadoActivity extends AppCompatActivity {

    public static final String EXTRA_PEDIDO = "pedido";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_pedido_realizado);
        Bordes.aplicar(findViewById(R.id.raiz), true, true);

        Pedido pedido = new Gson().fromJson(getIntent().getStringExtra(EXTRA_PEDIDO), Pedido.class);

        ((BarraVida) findViewById(R.id.barra)).mostrar(5, 5, R.color.ja_exito);
        if (pedido.aDomicilio()) {
            ((android.widget.TextView) findViewById(R.id.tvRealizadoTexto)).setText(R.string.realizado_texto_domicilio);
        }
        ViewGroup ticket = findViewById(R.id.ticket);
        FilaResumen.anadir(ticket, getString(R.string.ticket_referencia), "", pedido.referencia(), null);
        FilaResumen.anadir(ticket, getString(R.string.ticket_fecha), "", Fechas.fechaHora(pedido.fecha), null);
        FilaResumen.anadir(ticket, getString(R.string.ticket_cantidad), "",
                getResources().getQuantityString(R.plurals.articulos, pedido.numeroArticulos(), pedido.numeroArticulos()), null);
        FilaResumen.anadir(ticket, getString(R.string.ticket_metodo), "", MetodosPago.texto(this, pedido.metodoPago), null);
        FilaResumen.anadir(ticket, getString(R.string.ticket_entrega), "",
                getString(pedido.aDomicilio() ? R.string.entrega_domicilio : R.string.entrega_tienda), null);
        FilaResumen.anadir(ticket, getString(R.string.ticket_total), "", Formato.precio(pedido.total), null);

        View exito = findViewById(R.id.ivExito);
        exito.setTranslationY(getResources().getDimension(R.dimen.ja_espacio_6));
        exito.setAlpha(0f);
        exito.animate().translationY(0).alpha(1f)
                .setDuration(getResources().getInteger(R.integer.ja_duracion_lenta))
                .setInterpolator(android.view.animation.AnimationUtils.loadInterpolator(this, R.interpolator.ja_insertar))
                .start();

        findViewById(R.id.btnVerPedido).setOnClickListener(v -> {
            startActivity(new Intent(this, DetallePedidoActivity.class)
                    .putExtra(DetallePedidoActivity.EXTRA_ID, pedido.id));
            finish();
        });
        findViewById(R.id.btnSeguir).setOnClickListener(v -> finish());
        findViewById(R.id.btnCerrar).setOnClickListener(v -> finish());

        Snackbar.make(findViewById(R.id.raiz), R.string.realizado_ubicacion, Snackbar.LENGTH_LONG).show();
    }
}
