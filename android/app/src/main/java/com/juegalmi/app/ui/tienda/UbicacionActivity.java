package com.juegalmi.app.ui.tienda;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.location.Location;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.core.content.ContextCompat;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.snackbar.Snackbar;
import com.juegalmi.app.R;
import com.juegalmi.app.data.model.Tienda;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.Formato;
import com.juegalmi.app.util.UbicacionHelper;

import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;

import java.util.Locale;

/**
 * PT-26 Ubicación de la tienda (RF-08): mapa de OpenStreetMap con OSMDroid (sin clave de API, ADR-037),
 * marcador de la tienda, la posición del cliente si dio permiso, la distancia y «Cómo llegar».
 * OSMDroid descarga las teselas en sus propios hilos y las guarda en caché.
 */
public class UbicacionActivity extends TiendaBaseActivity {

    private static final double ZOOM = 16.0;

    private MapView mapa;
    private Tienda tienda;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_ubicacion);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        Bordes.aplicar(toolbar, true, false);
        Bordes.aplicar(findViewById(R.id.hojaContenido), false, true);
        toolbar.setNavigationOnClickListener(v -> finish());

        mapa = findViewById(R.id.mapa);
        mapa.setTileSource(TileSourceFactory.MAPNIK);
        mapa.setMultiTouchControls(true);
        mapa.getController().setZoom(ZOOM);

        findViewById(R.id.btnMiUbicacion).setOnClickListener(v -> {
            if (tienda != null) mapa.getController().animateTo(new GeoPoint(tienda.latitud, tienda.longitud));
        });
        cargarTienda();
    }

    @Override
    protected void conTienda(Tienda t) {
        tienda = t;
        GeoPoint punto = new GeoPoint(t.latitud, t.longitud);
        mapa.getController().setCenter(punto);

        Marker marcador = new Marker(mapa);
        marcador.setPosition(punto);
        marcador.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
        marcador.setIcon(ContextCompat.getDrawable(this, R.drawable.marcador_tienda));
        marcador.setTitle(t.nombre);
        mapa.getOverlays().add(marcador);

        ((TextView) findViewById(R.id.tvNombre)).setText(t.nombre);
        ((TextView) findViewById(R.id.tvDireccion)).setText(t.direccion);
        ((TextView) findViewById(R.id.tvCoordenadas)).setText(
                String.format(Locale.ROOT, "%.4f, %.4f", t.latitud, t.longitud));

        // Si el cliente dio permiso de ubicación: su punto en el mapa y la distancia a la tienda
        UbicacionHelper yo = UbicacionHelper.get(this);
        if (yo.hayUbicacion()) {
            GeoPoint mio = new GeoPoint(yo.getLatitud(), yo.getLongitud());
            Marker cliente = new Marker(mapa);
            cliente.setPosition(mio);
            cliente.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_CENTER);
            cliente.setIcon(ContextCompat.getDrawable(this, R.drawable.marcador_cliente));
            cliente.setTitle(getString(R.string.ubicacion_tu));
            mapa.getOverlays().add(cliente);

            float[] metros = new float[1];
            Location.distanceBetween(yo.getLatitud(), yo.getLongitud(), t.latitud, t.longitud, metros);
            TextView distancia = findViewById(R.id.tvDistancia);
            distancia.setVisibility(View.VISIBLE);
            distancia.setText(metros[0] < 1000
                    ? getString(R.string.ubicacion_estas_m, Math.round(metros[0]))
                    : getString(R.string.ubicacion_estas_km, Formato.decimal(metros[0] / 1000f)));
        }
        mapa.invalidate();

        // «Cómo llegar»: la app de mapas del móvil con la ruta hasta la tienda (Intent geo: estándar de Android)
        findViewById(R.id.btnComoLlegar).setOnClickListener(v -> {
            Uri destino = Uri.parse(String.format(Locale.ROOT, "geo:0,0?q=%f,%f(%s)",
                    t.latitud, t.longitud, Uri.encode(t.nombre)));
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, destino));
            } catch (ActivityNotFoundException e) {
                Snackbar.make(v, R.string.ubicacion_sin_app_mapas, Snackbar.LENGTH_LONG).show();
            }
        });
    }

    // OSMDroid necesita saber cuándo la pantalla está activa para pausar las descargas
    @Override
    protected void onResume() {
        super.onResume();
        mapa.onResume();
    }

    @Override
    protected void onPause() {
        mapa.onPause();
        super.onPause();
    }
}
