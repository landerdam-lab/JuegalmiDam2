package com.juegalmi.app.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Interpreta lo que el cliente dice al micro (control por voz de la app, RF-15 / rúbrica Móviles 5).
 *
 * Recibe la frase que devuelve el reconocedor de voz de Android y decide qué hacer: abrir una sección,
 * cambiar de pestaña del catálogo o buscar. Es Java puro (sin Android), así que se prueba en el PC
 * (OrdenVozTest). Si la frase no es ninguna orden, se busca tal cual en el catálogo.
 */
public final class OrdenVoz {

    /** Qué hay que hacer con la frase. */
    public enum Accion {
        INICIO, CARRITO, PEDIDOS, ALQUILERES, REPARACIONES, NUEVA_REPARACION, PERFIL,
        TIENDA, SERVICIOS, UBICACION, GALERIA, HISTORIA,
        VIDEOJUEGOS, MOVILES, CONSOLAS, BUSCAR
    }

    public final Accion accion;
    /** Solo en BUSCAR: el texto que se busca (sin «busca», «quiero»…). */
    public final String texto;

    private OrdenVoz(Accion accion, String texto) {
        this.accion = accion;
        this.texto = texto;
    }

    /** «busca zelda», «buscar el mario kart», «encuentra fifa» → lo que va detrás */
    private static final Pattern BUSCAR = Pattern.compile("^(?:busca|buscar|buscame|encuentra)\\s+(?:el |la |los |las |un |una )?(.+)$");

    public static OrdenVoz interpretar(String frase) {
        String f = normalizar(frase);
        Matcher m = BUSCAR.matcher(f);
        if (m.matches()) {
            // «busca …» siempre es una búsqueda, aunque el juego se llame como una sección
            return new OrdenVoz(Accion.BUSCAR, m.group(1).trim());
        }
        // El orden importa: lo más concreto primero («nueva reparacion» antes que «reparacion»)
        if (tiene(f, "nueva reparacion", "pedir reparacion", "solicitar reparacion", "reparar", "arreglar")) {
            return orden(Accion.NUEVA_REPARACION);
        }
        if (tiene(f, "carrito", "cesta")) return orden(Accion.CARRITO);
        if (tiene(f, "mis pedidos", "pedidos", "mi pedido")) return orden(Accion.PEDIDOS);
        if (tiene(f, "alquiler", "alquilado")) return orden(Accion.ALQUILERES);
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

    /** ¿Aparece alguna de las expresiones como palabras completas? («consolas» no casa con «consolador») */
    private static boolean tiene(String frase, String... expresiones) {
        String rodeada = " " + frase + " ";
        for (String e : expresiones) {
            if (rodeada.contains(" " + e + " ")) {
                return true;
            }
        }
        return false;
    }

    /** Minúsculas, sin tildes ni signos, con espacios simples: «¡Ábreme el Carrito!» → «abreme el carrito». */
    static String normalizar(String frase) {
        String sinTildes = Normalizer.normalize(frase == null ? "" : frase, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9ñ ]", " ").replaceAll("\\s+", " ").trim();
    }
}
