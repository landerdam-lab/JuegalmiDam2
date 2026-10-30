package com.juegalmi.app.data.model;

import androidx.annotation.Nullable;

/** Servicio de la tienda (PT-25). linea ∈ videojuegos, consolas, telefonia (ADR-030). */
public class Servicio {
    public int id;
    public String linea;
    public String nombre;
    @Nullable public String descripcion;
    /** null = «Consultar» */
    @Nullable public Double precioOrientativo;
}
