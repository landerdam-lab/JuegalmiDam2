package com.juegalmi.app.data.model;

import androidx.annotation.Nullable;

import java.util.List;

/**
 * Cuerpos JSON que la app envía a la API con Retrofit. Gson los convierte con estas mismas claves (camelCase)
 * y no envía los campos null (por eso los opcionales son Integer/String y no int).
 */
public final class Peticiones {

    private Peticiones() {
    }

    /** POST /api/pedidos: {lineas: [...], metodoPago} */
    public static class NuevoPedido {
        public final List<Linea> lineas;
        public final String metodoPago;

        public NuevoPedido(List<Linea> lineas, String metodoPago) {
            this.lineas = lineas;
            this.metodoPago = metodoPago;
        }
    }

    /** {productoId, tipo: "compra", cantidad} o {productoId, tipo: "alquiler", dias} */
    public static class Linea {
        public final int productoId;
        public final String tipo;
        @Nullable public final Integer cantidad;
        @Nullable public final Integer dias;

        public Linea(int productoId, String tipo, @Nullable Integer cantidad, @Nullable Integer dias) {
            this.productoId = productoId;
            this.tipo = tipo;
            this.cantidad = cantidad;
            this.dias = dias;
        }
    }

    /** PUT /api/pedidos/{id} o /api/reparaciones/{id}: el cliente solo puede cancelar. */
    public static class CambioEstado {
        public final String estado;

        public CambioEstado(String estado) {
            this.estado = estado;
        }
    }

    /** POST /api/reparaciones. La ubicación va en las cabeceras, no aquí. */
    public static class NuevaReparacion {
        public final int departamentoId;
        public final String dispositivo;
        public final String problema;
        @Nullable public final String foto;

        public NuevaReparacion(int departamentoId, String dispositivo, String problema, @Nullable String foto) {
            this.departamentoId = departamentoId;
            this.dispositivo = dispositivo;
            this.problema = problema;
            this.foto = foto;
        }
    }

    /** PUT /api/me: solo los campos que cambian (los null no se envían). */
    public static class Perfil {
        @Nullable public String nombre;
        @Nullable public String apellidos;
        @Nullable public String telefono;
        @Nullable public String foto;
    }

    /** Respuesta de POST /api/imagenes */
    public static class ImagenSubida {
        public String ruta;
        public String url;
    }
}
