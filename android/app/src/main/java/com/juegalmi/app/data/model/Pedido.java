package com.juegalmi.app.data.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Pedido tal como lo devuelve la API (GET/POST /api/pedidos). Un pedido tiene compras (cualquier producto,
 * con cantidad) y alquileres (solo videojuegos, con días): modelo v6, ADR-034.
 */
public class Pedido {
    public static final String PENDIENTE = "pendiente";
    public static final String PREPARADO = "preparado";
    public static final String ENTREGADO = "entregado";
    public static final String CANCELADO = "cancelado";
    /** pedido.entrega (ADR-038) */
    public static final String TIENDA = "tienda";
    public static final String DOMICILIO = "domicilio";

    public int id;
    /** ISO 8601 */
    public String fecha;
    /** pendiente → preparado → entregado, o cancelado (ADR-015) */
    public String estado;
    /** tarjeta, bizum, paypal o en_tienda */
    public String metodoPago;
    /** tienda (recogida) o domicilio (envío gratis). Con domicilio llegan la dirección y el punto del mapa */
    public String entrega = TIENDA;
    @androidx.annotation.Nullable public String direccionEntrega;
    @androidx.annotation.Nullable public Double latitudEntrega;
    @androidx.annotation.Nullable public Double longitudEntrega;
    public List<Compra> compras = new ArrayList<>();
    public List<Alquiler> alquileres = new ArrayList<>();
    public double total;

    /** Referencia visible: #PED-0042 */
    public String referencia() {
        return String.format(java.util.Locale.ROOT, "#PED-%04d", id);
    }

    public boolean aDomicilio() {
        return DOMICILIO.equals(entrega);
    }

    public int numeroArticulos() {
        int n = alquileres.size();
        for (Compra c : compras) {
            n += c.cantidad;
        }
        return n;
    }

    /** Una línea de compra del pedido. */
    public static class Compra {
        public int id;
        public ProductoCorto producto;
        public int cantidad;
        public double precioUnitario;
        public double subtotal;
    }
}
