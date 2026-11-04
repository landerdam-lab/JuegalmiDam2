package com.juegalmi.app.ui.comun;

import android.widget.TextView;

import com.juegalmi.app.R;

import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;
import org.osmdroid.views.overlay.infowindow.InfoWindow;

/** Etiqueta sobre un marcador con los colores de la app: la burbuja de OSMDroid no sigue el diseño y no cabe en un mapa pequeño. */
public class EtiquetaMapa extends InfoWindow {

    public EtiquetaMapa(MapView mapa) {
        super(R.layout.etiqueta_mapa, mapa);
    }

    @Override
    public void onOpen(Object elemento) {
        ((TextView) mView).setText(((Marker) elemento).getTitle());
    }

    @Override
    public void onClose() {
        // No hay nada que liberar
    }
}
