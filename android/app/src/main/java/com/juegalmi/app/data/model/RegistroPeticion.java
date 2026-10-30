package com.juegalmi.app.data.model;

/** Cuerpo de POST /api/registro. Gson lo convierte en JSON con estas mismas claves (camelCase). */
public class RegistroPeticion {
    public final String nombre;
    public final String apellidos;
    public final String email;
    public final String password;
    public final String telefono;
    public final String dni;

    public RegistroPeticion(String nombre, String apellidos, String email, String password,
                            String telefono, String dni) {
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.email = email;
        this.password = password;
        this.telefono = telefono;
        this.dni = dni;
    }
}
