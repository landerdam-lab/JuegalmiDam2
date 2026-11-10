package com.juegalmi.app.ui.pedidos;

import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.annotation.StringRes;

import com.google.android.material.button.MaterialButtonToggleGroup;
import com.google.android.material.textfield.TextInputLayout;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.Direccion;
import com.juegalmi.app.data.model.Pedido;
import com.juegalmi.app.data.model.Peticiones;
import com.juegalmi.app.data.model.Tienda;
import com.juegalmi.app.data.repository.DireccionRepository;
import com.juegalmi.app.data.repository.TiendaRepository;
import com.juegalmi.app.ui.comun.EtiquetaMapa;
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
 * - elegir (PT-12 Confirmar pedido): recoger en la tienda → mapa interactivo de la tienda; envío a domicilio → el mapa
 *   empieza en la ubicación actual del cliente, y la dirección que escribe se marca en él (ADR-040). Tocar el mapa ajusta el punto.
 * - ver (PT-14 Detalle de pedido): muestra cómo se entrega y el mapa de la tienda o de la casa.
 */
public class EntregaVista {

    private static final String ESTADO_DOMICILIO = "entrega.domicilio";
    private static final String ESTADO_TOCADO = "entrega.tocado";
    private static final String ESTADO_BUSCADA = "entrega.buscada";
    private static final String ESTADO_LATITUD = "entrega.latitud";
    private static final String ESTADO_LONGITUD = "entrega.longitud";

    private final Context context;
    private final View raiz;
    private final MapView mapa;
    private final TextView tvTexto;
    private final TextView tvPunto;
    private final TextInputLayout tilDireccion;
    private final Object etiqueta;

    @Nullable private Tienda tienda;
    @Nullable private Marker marcador;
    /** Siempre la misma: si se creara una por apertura, las anteriores seguirían en el mapa. */
    @Nullable private EtiquetaMapa etiquetaMapa;
    @Nullable private GeoPoint casa;
    /** El cliente ha elegido el punto a mano: lo que diga la búsqueda al confirmar ya no lo mueve. */
    private boolean tocado = false;
    /** Última dirección marcada con la búsqueda: si cambia, hay que volver a buscarla. */
    private String buscada = "";
    private boolean buscando = false;
    @StringRes private int falta = R.string.entrega_falta_datos;
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
        // La lupa del campo o la tecla «buscar» del teclado marcan en el mapa lo que ha escrito
        tilDireccion.setEndIconOnClickListener(v -> buscar());
        if (tilDireccion.getEditText() != null) {
            tilDireccion.getEditText().setOnEditorActionListener((v, accion, evento) -> {
                if (accion != EditorInfo.IME_ACTION_SEARCH) return false;
                buscar();
                return true;
            });
        }
        // Tocar el mapa (solo a domicilio) mueve el marcador de la casa a ese punto
        mapa.getOverlays().add(new MapEventsOverlay(new MapEventsReceiver() {
            @Override
            public boolean singleTapConfirmedHelper(GeoPoint punto) {
                if (!domicilio) return false;
                tocado = true;
                ponerCasa(punto);
                mostrarEtiqueta();
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
                marcador.setTitle(tienda.nombre);
                marcador.closeInfoWindow();
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
        // La ubicación guardada puede ser antigua o no haber llegado: se pide la actual y, si el
        // cliente aún no ha marcado nada, el punto pasa a ser esa
        UbicacionHelper u = UbicacionHelper.get(context);
        u.actualizar(() -> {
            if (domicilio && !tocado && buscada.isEmpty() && u.hayUbicacion()) {
                ponerCasa(new GeoPoint(u.getLatitud(), u.getLongitud()));
            }
        });
    }

    /** Marca en el mapa la dirección escrita. Si no se encuentra, el marcador se queda donde estaba. */
    private void buscar() {
        String texto = textoDireccion();
        if (texto.length() < 5) {
            tilDireccion.setError(context.getString(R.string.entrega_falta_direccion));
            return;
        }
        if (buscando) return;
        buscando = true;
        tilDireccion.setError(null);
        tvPunto.setText(R.string.entrega_buscando);
        ocultarTeclado();
        new DireccionRepository(context).buscar(texto, etiqueta, new Callback<Direccion>() {
            @Override
            public void onExito(Direccion d) {
                buscando = false;
                buscada = texto;
                tocado = false;
                ponerCasa(new GeoPoint(d.latitud, d.longitud));
                mostrarEtiqueta();
                tvPunto.setText(context.getString(R.string.entrega_encontrada, d.direccion));
            }

            @Override
            public void onError(ApiError error) {
                buscando = false;
                tvPunto.setText(error.mensaje);
            }
        });
    }

    /** Sobre el marcador, lo que ha escrito el cliente. */
    private void mostrarEtiqueta() {
        if (!textoDireccion().isEmpty()) {
            abrirEtiqueta();
        }
    }

    private void abrirEtiqueta() {
        if (marcador == null) return;
        if (etiquetaMapa == null) etiquetaMapa = new EtiquetaMapa(mapa);
        marcador.setInfoWindow(etiquetaMapa);
        marcador.showInfoWindow();
    }

    private String textoDireccion() {
        return tilDireccion.getEditText() == null ? "" : tilDireccion.getEditText().getText().toString().trim();
    }

    private void ocultarTeclado() {
        InputMethodManager teclado = context.getSystemService(InputMethodManager.class);
        if (teclado != null) teclado.hideSoftInputFromWindow(raiz.getWindowToken(), 0);
    }

    private void ponerCasa(GeoPoint punto) {
        casa = punto;
        marcador = Mapa.marcar(mapa, marcador, punto, R.drawable.marcador_casa, context.getString(R.string.entrega_tu_casa));
        marcador.setIcon(context.getDrawable(R.drawable.marcador_casa));
        // Al tocar el marcador se ve lo que ha escrito el cliente
        String texto = textoDireccion();
        marcador.setTitle(texto.isEmpty() ? context.getString(R.string.entrega_tu_casa) : texto);
        tvPunto.setText(context.getString(R.string.entrega_punto,
                String.format(Locale.ROOT, "%.5f, %.5f", punto.getLatitude(), punto.getLongitude())));
    }

    /** Lo que se envía a la API, o null si falta algo (y se marca el error en pantalla). */
    @Nullable
    public Peticiones.Entrega entrega() {
        if (!domicilio) {
            return Peticiones.Entrega.enTienda();
        }
        falta = R.string.entrega_falta_datos;
        String direccion = textoDireccion();
        tilDireccion.setError(direccion.length() < 5 ? context.getString(R.string.entrega_falta_direccion) : null);
        if (tilDireccion.getError() != null) {
            return null;
        }
        // Sin esto, el pedido saldría con el punto del GPS aunque la dirección escrita sea otra
        if (!tocado && !direccion.equals(buscada)) {
            falta = R.string.entrega_revisa_punto;
            buscar();
            return null;
        }
        if (casa == null) {
            tvPunto.setText(R.string.entrega_falta_punto);
            return null;
        }
        return Peticiones.Entrega.aDomicilio(direccion, casa.getLatitude(), casa.getLongitude());
    }

    /** Para onSaveInstanceState de la pantalla: al girar el móvil no se pierde la entrega elegida. */
    public void guardar(Bundle estado) {
        estado.putBoolean(ESTADO_DOMICILIO, domicilio);
        estado.putBoolean(ESTADO_TOCADO, tocado);
        estado.putString(ESTADO_BUSCADA, buscada);
        if (casa != null) {
            estado.putDouble(ESTADO_LATITUD, casa.getLatitude());
            estado.putDouble(ESTADO_LONGITUD, casa.getLongitude());
        }
    }

    /** Después de elegir(): recupera lo guardado (null la primera vez que se abre la pantalla). */
    public void restaurar(@Nullable Bundle estado) {
        if (estado == null) {
            return;
        }
        tocado = estado.getBoolean(ESTADO_TOCADO);
        buscada = estado.getString(ESTADO_BUSCADA, "");
        if (estado.containsKey(ESTADO_LATITUD)) {
            casa = new GeoPoint(estado.getDouble(ESTADO_LATITUD), estado.getDouble(ESTADO_LONGITUD));
        }
        if (estado.getBoolean(ESTADO_DOMICILIO)) {
            // Marcar el botón avisa al listener de elegir(): pone domicilio = true y repinta con el punto guardado
            ((MaterialButtonToggleGroup) raiz.findViewById(R.id.grupoEntrega)).check(R.id.opDomicilio);
        }
    }

    /** Errores 422 de la API sobre la entrega, en su sitio. */
    public void errores(ApiError error) {
        if (error.campo("direccionEntrega") != null) tilDireccion.setError(error.campo("direccionEntrega"));
        if (error.campo("ubicacionEntrega") != null) tvPunto.setText(error.campo("ubicacionEntrega"));
    }

    /** Qué decirle al cliente cuando entrega() devuelve null. */
    @StringRes
    public int mensajeFalta() {
        return falta;
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
                    R.drawable.marcador_casa, p.direccionEntrega);
            marcador.setTitle(p.direccionEntrega);
            abrirEtiqueta();
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
