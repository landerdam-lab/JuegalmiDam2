package com.juegalmi.app.data.model;

import androidx.annotation.Nullable;

/** Versión corta de un producto que la API pone dentro de pedidos y alquileres. */
public class ProductoCorto {
    public int id;
    public String tipo;
    public String nombre;
    @Nullable public String imagen;
    /** Solo en los alquileres (videojuego) */
    @Nullable public Referencia plataforma;
}
