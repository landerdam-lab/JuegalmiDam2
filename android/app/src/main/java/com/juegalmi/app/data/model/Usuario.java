package com.juegalmi.app.data.model;

/**
 * Usuario tal como lo devuelve la API (GET /api/me, login, registro).
 * Las claves siempre vienen; las que no aplican (dni en un trabajador, puesto en un cliente…) llegan a null.
 */
public class Usuario {
    public int id;
    /** "cliente" o "trabajador" (usuario.tipo) */
    public String tipo;
    public String nombre;
    public String apellidos;
    public String email;
    public String telefono;
    public boolean activo;
    public String dni;
    public String foto;
    /** "tecnico" o "admin"; null en clientes */
    public String puesto;

    /** Las apps son solo para clientes (ADR-024). */
    public boolean esCliente() {
        return "cliente".equals(tipo);
    }

    public String nombreCompleto() {
        return apellidos == null ? nombre : nombre + " " + apellidos;
    }
}
