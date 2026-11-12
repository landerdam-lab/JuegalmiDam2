package com.juegalmi.app.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class OrdenVoz {

    public enum Accion {
        INICIO, CARRITO, PEDIDOS, ALQUILERES, REPARACIONES, NUEVA_REPARACION, PERFIL,
        TIENDA, SERVICIOS, UBICACION, GALERIA, HISTORIA,
        VIDEOJUEGOS, MOVILES, CONSOLAS, BUSCAR
    }

    public final Accion accion;
    public final String texto;

    private OrdenVoz(Accion accion, String texto) {
        this.accion = accion;
        this.texto = texto;
    }

    private static final Pattern BUSCAR = Pattern.compile("^(?:busca|buscar|buscame|encuentra)\\s+(?:el |la |los |las |un |una )?(.+)$");

    public static OrdenVoz interpretar(String frase) {
        String f = normalizar(frase);
        Matcher m = BUSCAR.matcher(f);
        if (m.matches()) {
            return new OrdenVoz(Accion.BUSCAR, m.group(1).trim());
        }
        if (tiene(f, "nueva reparacion", "pedir reparacion", "solicitar reparacion", "reparar", "arreglar")) {
            return orden(Accion.NUEVA_REPARACION);
        }
        if (tiene(f, "carrito", "cesta")) return orden(Accion.CARRITO);
        if (tiene(f, "mis pedidos", "pedidos", "mi pedido")) return orden(Accion.PEDIDOS);
        if (tiene(f, "alquiler", "alquileres", "alquilado")) return orden(Accion.ALQUILERES);
        if (tiene(f, "reparacion", "reparaciones")) return orden(Accion.REPARACIONES);
        if (tiene(f, "perfil", "mi cuenta", "mis datos")) return orden(Accion.PERFIL);
        if (tiene(f, "como llegar", "llevame", "ubicacion", "mapa", "donde esta")) return orden(Accion.UBICACION);
        if (tiene(f, "servicios", "servicio")) return orden(Accion.SERVICIOS);
        if (tiene(f, "galeria", "fotos")) return orden(Accion.GALERIA);
        if (tiene(f, "historia", "quienes sois", "quienes somos")) return orden(Accion.HISTORIA);
        if (tiene(f, "tienda")) return orden(Accion.TIENDA);
        if (tiene(f, "inicio", "catalogo", "portada")) return orden(Accion.INICIO);
        if (tiene(f, "moviles", "movil", "tablets", "tablet", "telefonos")) return orden(Accion.MOVILES);
        if (tiene(f, "consolas", "consola")) return orden(Accion.CONSOLAS);
        if (tiene(f, "videojuegos", "juegos")) return orden(Accion.VIDEOJUEGOS);
        return new OrdenVoz(Accion.BUSCAR, f);
    }

    private static OrdenVoz orden(Accion a) {
        return new OrdenVoz(a, null);
    }

    private static boolean tiene(String frase, String... expresiones) {
        String rodeada = " " + frase + " ";
        for (String e : expresiones) {
            if (rodeada.contains(" " + e + " ")) {
                return true;
            }
        }
        return false;
    }

    static String normalizar(String frase) {
        String sinTildes = Normalizer.normalize(frase == null ? "" : frase, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9ñ ]", " ").replaceAll("\\s+", " ").trim();
    }
}
