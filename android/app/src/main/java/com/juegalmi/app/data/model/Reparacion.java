package com.juegalmi.app.data.model;

import androidx.annotation.Nullable;

/** Solicitud de reparación (GET/POST /api/reparaciones). */
public class Reparacion {
    public static final String RECIBIDA = "recibida";
    public static final String EN_REPARACION = "en_reparacion";
    public static final String LISTA = "lista";
    public static final String ENTREGADA = "entregada";
    public static final String CANCELADA = "cancelada";

    public int id;
    public String dispositivo;
    public String problema;
    public String estado;
    public String fechaEntrada;
    @Nullable public String fechaSalida;
    @Nullable public Double presupuesto;
    @Nullable public String foto;
    @Nullable public Referencia departamento;

    public String referencia() {
        return String.format(java.util.Locale.ROOT, "#REP-%04d", id);
    }

    /** Recibida y en reparación siguen abiertas; el resto ya están cerradas. */
    public boolean activa() {
        return RECIBIDA.equals(estado) || EN_REPARACION.equals(estado) || LISTA.equals(estado);
    }
}
