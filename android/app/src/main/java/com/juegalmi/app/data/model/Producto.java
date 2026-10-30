package com.juegalmi.app.data.model;

import androidx.annotation.Nullable;

/**
 * Producto del catálogo. La API usa herencia (videojuego, movil, consola), pero en la app basta una
 * sola clase: los campos del subtipo que no correspondan llegan a null. Así un mismo adaptador
 * sirve para las tres pestañas.
 */
public class Producto {
    /** Discriminador: "videojuego", "movil" o "consola" (producto.tipo) */
    public static final String VIDEOJUEGO = "videojuego";
    public static final String MOVIL = "movil";
    public static final String CONSOLA = "consola";

    public int id;
    public String tipo;
    public String nombre;
    public String descripcion;
    public double precio;
    public boolean disponible;
    @Nullable public String imagen;
    @Nullable public Referencia marca;
    /** Con token siempre viene (ADR-028). */
    public int stock;

    // Videojuego
    @Nullable public Referencia plataforma;
    @Nullable public String genero;
    @Nullable public Integer pegi;
    @Nullable public Double precioAlquiler;
    public boolean alquilable;
    @Nullable public Integer copiasAlquiler;
    @Nullable public Integer copiasDisponibles;

    // Móvil / tablet
    /** "movil" o "tablet" (movil.formato, ADR-012) */
    @Nullable public String formato;
    @Nullable public Double pantallaPulgadas;
    @Nullable public Integer ramGb;

    // Móvil y consola
    @Nullable public Integer almacenamientoGb;

    // Consola
    @Nullable public String modelo;

    public boolean esVideojuego() {
        return VIDEOJUEGO.equals(tipo);
    }

    /** Ruta de la API para este tipo: /videojuegos, /moviles, /consolas. */
    public static String recurso(String tipo) {
        switch (tipo) {
            case VIDEOJUEGO: return "videojuegos";
            case MOVIL: return "moviles";
            default: return "consolas";
        }
    }
}
