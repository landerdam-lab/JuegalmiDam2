package com.juegalmi.app.data.model;

import androidx.annotation.Nullable;

/** Alquiler de un videojuego (GET /api/alquileres o dentro de un pedido). */
public class Alquiler {
    public static final String ACTIVO = "activo";
    public static final String RETRASADO = "retrasado";
    public static final String DEVUELTO = "devuelto";
    public static final String CANCELADO = "cancelado";

    public int id;
    public ProductoCorto videojuego;
    public double precioDia;
    public int dias;
    public double subtotal;
    /** AAAA-MM-DD */
    public String fechaInicio;
    public String fechaFin;
    @Nullable public String fechaDevolucion;
    /** activo, retrasado, devuelto o cancelado: lo calcula la API (no se guarda, A-01) */
    public String estado;
    public int pedidoId;
}
