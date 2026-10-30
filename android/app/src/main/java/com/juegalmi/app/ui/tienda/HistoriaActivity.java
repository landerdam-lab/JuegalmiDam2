package com.juegalmi.app.ui.tienda;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;

import com.bumptech.glide.Glide;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.gson.Gson;
import com.juegalmi.app.R;
import com.juegalmi.app.data.model.Tienda;
import com.juegalmi.app.util.Bordes;

/** PT-28 Historia (RF-08): foto de cabecera que se pliega al desplazar y el texto tienda.historia. */
public class HistoriaActivity extends TiendaBaseActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_historia);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        Bordes.aplicar(toolbar, true, false);
        Bordes.aplicar(findViewById(R.id.scroll), false, true);
        toolbar.setNavigationOnClickListener(v -> finish());
        cargarTienda();
    }

    @Override
    protected void conTienda(Tienda t) {
        ((TextView) findViewById(R.id.tvNombre)).setText(t.nombre);
        ((TextView) findViewById(R.id.tvHistoria)).setText(t.historia);
        ((TextView) findViewById(R.id.tvDireccion)).setText(t.direccion);
        if (!t.fotos.isEmpty()) {
            Glide.with(this).load(t.fotos.get(0).imagen).centerCrop().into((ImageView) findViewById(R.id.ivCabecera));
        }
        String json = new Gson().toJson(t);
        findViewById(R.id.btnGaleria).setOnClickListener(v -> startActivity(
                new Intent(this, GaleriaActivity.class).putExtra(TiendaFragment.EXTRA_TIENDA, json)));
        findViewById(R.id.btnLlegar).setOnClickListener(v -> startActivity(
                new Intent(this, UbicacionActivity.class).putExtra(TiendaFragment.EXTRA_TIENDA, json)));
    }
}
