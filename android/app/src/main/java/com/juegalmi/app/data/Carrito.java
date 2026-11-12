package com.juegalmi.app.data;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.juegalmi.app.data.model.Peticiones;
import com.juegalmi.app.data.model.Producto;

import java.util.ArrayList;
import java.util.List;

/**
 * Carrito (PT-11). Vive en el móvil hasta que se confirma el pedido: la API solo recibe el pedido completo
 * (POST /api/pedidos). Se guarda en SharedPreferences para no perderlo al cerrar la app, y se expone como
 * LiveData para que la insignia del carrito y la pantalla se actualicen solas.
 *
 * Los precios aquí son orientativos: el precio y el stock de verdad los pone la API al confirmar (regla de oro 8).
 */
public final class Carrito {

    public static final String COMPRA = "compra";
    public static final String ALQUILER = "alquiler";

    private static final String PREFS = "carrito";
    private static final String CLAVE = "lineas";
    private static final String CLAVE_DUENO = "dueno";
    private static Carrito instancia;

    private final SharedPreferences prefs;
    private final Gson gson = new Gson();
    private final MutableLiveData<List<Linea>> lineas = new MutableLiveData<>(new ArrayList<>());

    /** Una línea: un producto que se compra (cantidad) o un videojuego que se alquila (días). */
    public static class Linea {
        public String tipo;
        public Producto producto;
        public int cantidad;
        public int dias;

        public double subtotal() {
            if (ALQUILER.equals(tipo)) {
                return producto.precioAlquiler == null ? 0 : producto.precioAlquiler * dias;
            }
            return producto.precio * cantidad;
        }
    }

    private Carrito(Context context) {
        prefs = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String json = prefs.getString(CLAVE, null);
        if (json != null) {
            List<Linea> guardadas = gson.fromJson(json, new TypeToken<List<Linea>>() { }.getType());
            lineas.setValue(guardadas);
        }
    }

    public static synchronized Carrito get(Context context) {
        if (instancia == null) {
            instancia = new Carrito(context);
        }
        return instancia;
    }

    public LiveData<List<Linea>> getLineas() {
        return lineas;
    }

    public List<Linea> lista() {
        return lineas.getValue() == null ? new ArrayList<>() : lineas.getValue();
    }

    /** Añade una compra; si el producto ya está, suma la cantidad (sin pasar del stock). */
    public void comprar(Producto p, int cantidad) {
        List<Linea> nueva = new ArrayList<>(lista());
        for (Linea l : nueva) {
            if (COMPRA.equals(l.tipo) && l.producto.id == p.id) {
                l.cantidad = Math.min(l.cantidad + cantidad, Math.max(p.stock, 1));
                guardar(nueva);
                return;
            }
        }
        Linea l = new Linea();
        l.tipo = COMPRA;
        l.producto = p;
        l.cantidad = cantidad;
        nueva.add(l);
        guardar(nueva);
    }

    /** Añade un alquiler (una copia, ADR-034). Si ya estaba ese juego, se cambian los días. */
    public void alquilar(Producto p, int dias) {
        List<Linea> nueva = new ArrayList<>(lista());
        for (Linea l : nueva) {
            if (ALQUILER.equals(l.tipo) && l.producto.id == p.id) {
                l.dias = dias;
                guardar(nueva);
                return;
            }
        }
        Linea l = new Linea();
        l.tipo = ALQUILER;
        l.producto = p;
        l.dias = dias;
        nueva.add(l);
        guardar(nueva);
    }

    public void cambiarCantidad(Linea linea, int cantidad) {
        linea.cantidad = cantidad;
        guardar(new ArrayList<>(lista()));
    }

    public void quitar(Linea linea) {
        List<Linea> nueva = new ArrayList<>(lista());
        nueva.remove(linea);
        guardar(nueva);
    }

    /** Para «Deshacer» tras quitar una línea. */
    public void reponer(Linea linea, int posicion) {
        List<Linea> nueva = new ArrayList<>(lista());
        nueva.add(Math.min(posicion, nueva.size()), linea);
        guardar(nueva);
    }

    public void vaciar() {
        guardar(new ArrayList<>());
    }

    /**
     * Al iniciar sesión: el carrito es de un cliente. Si el guardado era de otro (su sesión caducó sin
     * cerrarla, así que no se vació), se vacía para que nadie herede el carrito de otra persona.
     */
    public void deUsuario(int usuarioId) {
        if (prefs.getInt(CLAVE_DUENO, -1) != usuarioId) {
            vaciar();
        }
        prefs.edit().putInt(CLAVE_DUENO, usuarioId).apply();
    }

    /** Unidades en el carrito (la insignia de la barra superior). */
    public int unidades() {
        int n = 0;
        for (Linea l : lista()) {
            n += COMPRA.equals(l.tipo) ? l.cantidad : 1;
        }
        return n;
    }

    public double total() {
        double t = 0;
        for (Linea l : lista()) {
            t += l.subtotal();
        }
        return t;
    }

    /** Las líneas en el formato de POST /api/pedidos. */
    public List<Peticiones.Linea> paraLaApi() {
        List<Peticiones.Linea> r = new ArrayList<>();
        for (Linea l : lista()) {
            r.add(COMPRA.equals(l.tipo)
                    ? new Peticiones.Linea(l.producto.id, COMPRA, l.cantidad, null)
                    : new Peticiones.Linea(l.producto.id, ALQUILER, null, l.dias));
        }
        return r;
    }

    private void guardar(List<Linea> nueva) {
        lineas.setValue(nueva);
        prefs.edit().putString(CLAVE, gson.toJson(nueva)).apply();
    }
}
