package com.juegalmi.app.ui.comun;

import android.annotation.SuppressLint;

import androidx.core.content.ContextCompat;

import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.CustomZoomButtonsController;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;

/**
 * Mapas pequeños dentro de una pantalla con scroll (OSMDroid, ADR-037): el de la tienda o el de la casa
 * del cliente en Confirmar pedido (PT-12) y en el detalle del pedido (PT-14).
 */
public final class Mapa {

    public static final double ZOOM_CALLE = 16.0;

    private Mapa() {
    }

    /**
     * @param interactivo true: se puede mover y hacer zoom (para marcar la casa); false: solo se mira,
     *                    y el dedo desplaza la pantalla en vez del mapa
     */
    @SuppressLint("ClickableViewAccessibility")
    public static void preparar(MapView mapa, boolean interactivo) {
        mapa.setTileSource(TileSourceFactory.MAPNIK);
        mapa.getZoomController().setVisibility(CustomZoomButtonsController.Visibility.NEVER);
        mapa.setMultiTouchControls(interactivo);
        mapa.getController().setZoom(ZOOM_CALLE);
        if (interactivo) {
            // Dentro de un NestedScrollView: mientras el dedo está en el mapa, la pantalla no se desplaza
            mapa.setOnTouchListener((v, e) -> {
                v.getParent().requestDisallowInterceptTouchEvent(true);
                return false;
            });
        } else {
            mapa.setOnTouchListener((v, e) -> true);
        }
    }

    /** Pone (o mueve) un marcador y centra el mapa en él. */
    public static Marker marcar(MapView mapa, Marker actual, GeoPoint punto, int icono, String titulo) {
        Marker m = actual;
        if (m == null) {
            m = new Marker(mapa);
            m.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
            m.setIcon(ContextCompat.getDrawable(mapa.getContext(), icono));
            m.setTitle(titulo);
            mapa.getOverlays().add(m);
        }
        m.setPosition(punto);
        mapa.getController().animateTo(punto);
        mapa.invalidate();
        return m;
    }
}
