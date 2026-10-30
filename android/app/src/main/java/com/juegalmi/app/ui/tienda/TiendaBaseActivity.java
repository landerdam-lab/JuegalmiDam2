package com.juegalmi.app.ui.tienda;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.snackbar.Snackbar;
import com.google.gson.Gson;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Tienda;
import com.juegalmi.app.data.repository.TiendaRepository;

/**
 * Base de Ubicación, Galería e Historia: reciben la tienda en el Intent (desde PT-24) o, si no viene,
 * la piden a la API. Cada pantalla solo implementa conTienda().
 */
public abstract class TiendaBaseActivity extends AppCompatActivity {

    protected abstract void conTienda(Tienda tienda);

    protected void cargarTienda() {
        String json = getIntent().getStringExtra(TiendaFragment.EXTRA_TIENDA);
        if (json != null) {
            conTienda(new Gson().fromJson(json, Tienda.class));
            return;
        }
        new TiendaRepository(this).tienda(this, new Callback<Tienda>() {
            @Override
            public void onExito(Tienda t) {
                conTienda(t);
            }

            @Override
            public void onError(ApiError error) {
                Snackbar.make(findViewById(android.R.id.content), error.mensaje, Snackbar.LENGTH_INDEFINITE)
                        .setAction(R.string.reintentar, v -> cargarTienda()).show();
            }
        });
    }

    @Override
    protected void onDestroy() {
        VolleyClient.get(this).cancelar(this);
        super.onDestroy();
    }
}
