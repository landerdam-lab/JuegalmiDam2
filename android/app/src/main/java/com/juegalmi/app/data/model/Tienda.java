package com.juegalmi.app.data.model;

import androidx.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;

/** La tienda física (sección «La tienda», PT-24…PT-28). */
public class Tienda {
    public int id;
    public String nombre;
    public String direccion;
    public double latitud;
    public double longitud;
    @Nullable public String historia;
    public List<Foto> fotos = new ArrayList<>();

    /** Foto de la galería (foto_tienda). */
    public static class Foto {
        public int id;
        public String imagen;
        @Nullable public String descripcion;
    }
}
