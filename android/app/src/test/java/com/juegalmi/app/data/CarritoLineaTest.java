package com.juegalmi.app.data;

import static org.junit.Assert.assertEquals;

import com.juegalmi.app.data.model.Producto;

import org.junit.Test;

/**
 * Subtotal de las líneas del carrito (PT-11, PT-15): compra = precio × cantidad; alquiler = precio por día × días.
 * Es orientativo: el precio de verdad lo calcula la API al confirmar el pedido (regla de oro 8).
 */
public class CarritoLineaTest {

    private static final double DELTA = 0.001;

    private static Producto juego() {
        Producto p = new Producto();
        p.precio = 69.99;
        p.precioAlquiler = 2.50;
        return p;
    }

    private static Carrito.Linea linea(String tipo, Producto p, int cantidad, int dias) {
        Carrito.Linea l = new Carrito.Linea();
        l.tipo = tipo;
        l.producto = p;
        l.cantidad = cantidad;
        l.dias = dias;
        return l;
    }

    @Test
    public void compraMultiplicaPorLaCantidad() {
        assertEquals(139.98, linea(Carrito.COMPRA, juego(), 2, 0).subtotal(), DELTA);
    }

    @Test
    public void alquilerMultiplicaPorLosDias() {
        assertEquals(17.50, linea(Carrito.ALQUILER, juego(), 1, 7).subtotal(), DELTA);
        assertEquals(35.00, linea(Carrito.ALQUILER, juego(), 1, 14).subtotal(), DELTA);
    }

    @Test
    public void alquilerSinPrecioNoSuma() {
        Producto consola = juego();
        consola.precioAlquiler = null; // solo se alquilan videojuegos (ADR-029)
        assertEquals(0, linea(Carrito.ALQUILER, consola, 1, 7).subtotal(), DELTA);
    }

    @Test
    public void totalDeUnPedidoMixto() {
        double total = linea(Carrito.COMPRA, juego(), 1, 0).subtotal()
                + linea(Carrito.ALQUILER, juego(), 1, 3).subtotal();
        assertEquals(77.49, total, DELTA);
    }
}
