package com.juegalmi.app.ui.pedidos;

import android.content.Context;
import android.view.View;
import android.widget.TextView;

import androidx.annotation.Nullable;

import com.google.android.material.button.MaterialButtonToggleGroup;
import com.google.android.material.textfield.TextInputLayout;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.Pedido;
import com.juegalmi.app.data.model.Peticiones;
import com.juegalmi.app.data.model.Tienda;
import com.juegalmi.app.data.repository.TiendaRepository;
import com.juegalmi.app.ui.comun.Mapa;
import com.juegalmi.app.ui.comun.Pastilla;
import com.juegalmi.app.util.UbicacionHelper;

import org.osmdroid.events.MapEventsReceiver;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.MapEventsOverlay;
import org.osmdroid.views.overlay.Marker;

import java.util.Locale;

/**
 * La caja «Entrega» (layout caja_entrega, ADR-038) en dos modos:
 * - elegir (PT-12 Confirmar pedido): recoger en la tienda → mapa interactivo de la tienda; envío a domicilio → el cliente
 *   escribe la dirección y toca el mapa para marcar su casa (empieza en su ubicación del GPS).
 * - ver (PT-14 Detalle de pedido): muestra cómo se entrega y el mapa de la tienda o de la casa.
 */
public class EntregaVista {

    private final Context context;
    private final View raiz;
    private final MapView mapa;
    private final TextView tvTexto;
    private final TextView tvPunto;
    private final TextInputLayout tilDireccion;
    private final Object etiqueta;

    @Nullable private Tienda tienda;
    @Nullable private Marker marcador;
    @Nullable private GeoPoint casa;
    private boolean domicilio = false;
    private boolean soloVer = false;
    @Nullable private Pedido pedidoVisto;

    public EntregaVista(View raiz, Object etiqueta) {
        this.context = raiz.getContext();
        this.raiz = raiz;
        this.etiqueta = etiqueta;
        mapa = raiz.findViewById(R.id.mapaEntrega);
        tvTexto = raiz.findViewById(R.id.tvEntregaTexto);
        tvPunto = raiz.findViewById(R.id.tvPunto);
        tilDireccion = raiz.findViewById(R.id.tilDireccion);
        // Interactivo siempre (mover y hacer zoom), también el de la tienda. Tocar solo mueve el marcador
        // cuando es a domicilio (ver singleTapConfirmedHelper): el de la tienda es un punto fijo.
        Mapa.preparar(mapa, true);

        // La tienda hace falta en los dos modos (recogida, o centro del mapa si no hay GPS)
        new TiendaRepository(context).tienda(etiqueta, new Callback<Tienda>() {
            @Override
            public void onExito(Tienda t) {
                tienda = t;
                if (soloVer && pedidoVisto != null) {
                    ver(pedidoVisto);
                } else {
                    pintar();
                }
            }

            @Override
            public void onError(ApiError error) {
                tvTexto.setText(error.mensaje);
            }
        });
    }

    // ---------------------------------------------------------------- Modo elegir (PT-12)

    public void elegir() {
        MaterialButtonToggleGroup grupo = raiz.findViewById(R.id.grupoEntrega);
        grupo.check(R.id.opTienda);
        grupo.addOnButtonCheckedListener((g, id, marcado) -> {
            if (marcado) {
                domicilio = id == R.id.opDomicilio;
                pintar();
            }
        });
        // Tocar el mapa (solo a domicilio) mueve el marcador de la casa a ese punto
        mapa.getOverlays().add(new MapEventsOverlay(new MapEventsReceiver() {
            @Override
            public boolean singleTapConfirmedHelper(GeoPoint punto) {
                if (!domicilio) return false;
                ponerCasa(punto);
                return true;
            }

            @Override
            public boolean longPressHelper(GeoPoint punto) {
                return singleTapConfirmedHelper(punto);
            }
        }));
    }

    private void pintar() {
        tilDireccion.setVisibility(domicilio ? View.VISIBLE : View.GONE);
        if (!domicilio) {
            tvTexto.setVisibility(View.VISIBLE);
            tvPunto.setText(R.string.entrega_tienda_gratis);
            if (tienda != null) {
                tvTexto.setText(context.getString(R.string.entrega_tienda_texto, tienda.nombre, tienda.direccion));
                marcador = Mapa.marcar(mapa, marcador, new GeoPoint(tienda.latitud, tienda.longitud),
                        R.drawable.marcador_tienda, tienda.nombre);
                marcador.setIcon(context.getDrawable(R.drawable.marcador_tienda));
            }
            return;
        }
        tvTexto.setVisibility(View.GONE);
        if (casa == null) {
            // Primer punto: la ubicación del móvil; si no hay, la tienda (el cliente lo moverá)
            UbicacionHelper u = UbicacionHelper.get(context);
            if (u.hayUbicacion()) {
                casa = new GeoPoint(u.getLatitud(), u.getLongitud());
            } else if (tienda != null) {
                casa = new GeoPoint(tienda.latitud, tienda.longitud);
            }
        }
        if (casa != null) {
            ponerCasa(casa);
        }
    }

    private void ponerCasa(GeoPoint punto) {
        casa = punto;
        marcador = Mapa.marcar(mapa, marcador, punto, R.drawable.marcador_casa, context.getString(R.string.entrega_tu_casa));
        marcador.setIcon(context.getDrawable(R.drawable.marcador_casa));
        tvPunto.setText(context.getString(R.string.entrega_punto,
                String.format(Locale.ROOT, "%.5f, %.5f", punto.getLatitude(), punto.getLongitude())));
    }

    /** Lo que se envía a la API, o null si falta algo (y se marca el error en pantalla). */
    @Nullable
    public Peticiones.Entrega entrega() {
        if (!domicilio) {
            return Peticiones.Entrega.enTienda();
        }
        String direccion = tilDireccion.getEditText() == null ? ""
                : tilDireccion.getEditText().getText().toString().trim();
        tilDireccion.setError(direccion.length() < 5 ? context.getString(R.string.entrega_falta_direccion) : null);
        if (casa == null) {
            tvPunto.setText(R.string.entrega_falta_punto);
        }
        if (tilDireccion.getError() != null || casa == null) {
            return null;
        }
        return Peticiones.Entrega.aDomicilio(direccion, casa.getLatitude(), casa.getLongitude());
    }

    /** Errores 422 de la API sobre la entrega, en su sitio. */
    public void errores(ApiError error) {
        if (error.campo("direccionEntrega") != null) tilDireccion.setError(error.campo("direccionEntrega"));
        if (error.campo("ubicacionEntrega") != null) tvPunto.setText(error.campo("ubicacionEntrega"));
    }

    public boolean aDomicilio() {
        return domicilio;
    }

    // ---------------------------------------------------------------- Modo ver (PT-14)

    public void ver(Pedido p) {
        soloVer = true;
        pedidoVisto = p;
        raiz.findViewById(R.id.grupoEntrega).setVisibility(View.GONE);
        ((TextView) raiz.findViewById(R.id.tvEntregaTitulo)).setText(R.string.ticket_entrega);
        TextView modo = raiz.findViewById(R.id.tvEntregaModo);
        modo.setVisibility(View.VISIBLE);
        Pastilla.pintar(modo, R.color.ja_marca, context.getString(p.aDomicilio() ? R.string.entrega_domicilio : R.string.entrega_tienda));
        tvTexto.setVisibility(View.VISIBLE);
        if (p.aDomicilio() && p.latitudEntrega != null && p.longitudEntrega != null) {
            tvTexto.setText(p.direccionEntrega);
            marcador = Mapa.marcar(mapa, marcador, new GeoPoint(p.latitudEntrega, p.longitudEntrega),
                    R.drawable.marcador_casa, context.getString(R.string.entrega_tu_casa));
            tvPunto.setText(R.string.entrega_domicilio_gratis);
        } else if (tienda != null) {
            tvTexto.setText(context.getString(R.string.entrega_tienda_texto, tienda.nombre, tienda.direccion));
            marcador = Mapa.marcar(mapa, marcador, new GeoPoint(tienda.latitud, tienda.longitud),
                    R.drawable.marcador_tienda, tienda.nombre);
            tvPunto.setText(R.string.entrega_tienda_gratis);
        }
    }

    // OSMDroid pausa las descargas de teselas cuando la pantalla no se ve
    public void onResume() {
        mapa.onResume();
    }

    public void onPause() {
        mapa.onPause();
    }
}
