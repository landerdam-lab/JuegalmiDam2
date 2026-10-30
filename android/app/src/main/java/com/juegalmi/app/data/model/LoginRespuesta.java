package com.juegalmi.app.data.model;

/** Respuesta de POST /api/login. */
public class LoginRespuesta {
    public String token;
    /** Fecha ISO 8601 en la que caduca el token (2 h, ADR-035) */
    public String expira;
    public Usuario usuario;
}
