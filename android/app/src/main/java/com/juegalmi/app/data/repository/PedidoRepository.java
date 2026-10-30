package com.juegalmi.app.data.repository;

import android.content.Context;

import com.google.gson.reflect.TypeToken;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.RetrofitClient;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Alquiler;
import com.juegalmi.app.data.model.Pagina;
import com.juegalmi.app.data.model.Pedido;
import com.juegalmi.app.data.model.Peticiones;

import java.lang.reflect.Type;
import java.util.List;

/**
 * Pedidos y alquileres del cliente. Lecturas con Volley; escrituras (crear y cancelar) con Retrofit.
 * La API solo devuelve los pedidos del usuario del token.
 */
public class PedidoRepository {

    private static final Type PAGINA_PEDIDOS = new TypeToken<Pagina<Pedido>>() { }.getType();
    private static final Type PAGINA_ALQUILERES = new TypeToken<Pagina<Alquiler>>() { }.getType();
    /** Un cliente tiene pocos pedidos: con 50 por página basta una sola petición */
    private static final int LIMITE = 50;

    private final Context context;

    public PedidoRepository(Context context) {
        this.context = context.getApplicationContext();
    }

    public void misPedidos(Object etiqueta, Callback<Pagina<Pedido>> callback) {
        VolleyClient.get(context).get("pedidos?limit=" + LIMITE, PAGINA_PEDIDOS, etiqueta, callback);
    }

    public void pedido(int id, Object etiqueta, Callback<Pedido> callback) {
        VolleyClient.get(context).get("pedidos/" + id, Pedido.class, etiqueta, callback);
    }

    /** POST /api/pedidos. La API comprueba stock y copias, pone los precios (409 si no hay) y valida la entrega (422). */
    public void crear(List<Peticiones.Linea> lineas, String metodoPago, Peticiones.Entrega entrega,
                      Callback<Pedido> callback) {
        RetrofitClient cliente = RetrofitClient.get(context);
        cliente.enviar(cliente.servicio().crearPedido(new Peticiones.NuevoPedido(lineas, metodoPago, entrega)),
                callback);
    }

    public void cancelar(int id, Callback<Pedido> callback) {
        RetrofitClient cliente = RetrofitClient.get(context);
        cliente.enviar(cliente.servicio().cambiarEstadoPedido(id, new Peticiones.CambioEstado(Pedido.CANCELADO)),
                callback);
    }

    /** GET /api/alquileres?estado=activo|retrasado|devuelto */
    public void misAlquileres(String estado, Object etiqueta, Callback<Pagina<Alquiler>> callback) {
        VolleyClient.get(context).get("alquileres?limit=" + LIMITE + "&estado=" + estado, PAGINA_ALQUILERES,
                etiqueta, callback);
    }
}
