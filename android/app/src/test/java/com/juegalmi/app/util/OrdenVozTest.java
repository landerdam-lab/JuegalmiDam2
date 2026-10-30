package com.juegalmi.app.util;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

/**
 * Control por voz (RF-15): qué hace la app con cada frase. Se ejecuta en el PC: ./gradlew testDebugUnitTest
 */
public class OrdenVozTest {

    private static void es(OrdenVoz.Accion esperada, String frase) {
        assertEquals(frase, esperada, OrdenVoz.interpretar(frase).accion);
    }

    @Test
    public void abreLasSecciones() {
        es(OrdenVoz.Accion.CARRITO, "Abre el carrito");
        es(OrdenVoz.Accion.PEDIDOS, "mis pedidos");
        es(OrdenVoz.Accion.ALQUILERES, "¿Qué tengo alquilado?");
        es(OrdenVoz.Accion.REPARACIONES, "Mis reparaciones");
        es(OrdenVoz.Accion.NUEVA_REPARACION, "Quiero arreglar el mando");
        es(OrdenVoz.Accion.PERFIL, "mi perfil");
        es(OrdenVoz.Accion.INICIO, "volver al inicio");
    }

    @Test
    public void laTiendaYSusSecciones() {
        es(OrdenVoz.Accion.UBICACION, "Llévame a la tienda");
        es(OrdenVoz.Accion.UBICACION, "¿Cómo llegar?");
        es(OrdenVoz.Accion.SERVICIOS, "servicios de la tienda");
        es(OrdenVoz.Accion.GALERIA, "enséñame la galería");
        es(OrdenVoz.Accion.HISTORIA, "Historia");
        es(OrdenVoz.Accion.TIENDA, "la tienda");
    }

    @Test
    public void cambiaDePestanaDelCatalogo() {
        es(OrdenVoz.Accion.MOVILES, "móviles");
        es(OrdenVoz.Accion.MOVILES, "enséñame las tablets");
        es(OrdenVoz.Accion.CONSOLAS, "consolas");
        es(OrdenVoz.Accion.VIDEOJUEGOS, "videojuegos");
    }

    @Test
    public void buscaLoQueNoEsUnaOrden() {
        OrdenVoz o = OrdenVoz.interpretar("Busca el Mario Kart");
        assertEquals(OrdenVoz.Accion.BUSCAR, o.accion);
        assertEquals("mario kart", o.texto);

        o = OrdenVoz.interpretar("Zelda");
        assertEquals(OrdenVoz.Accion.BUSCAR, o.accion);
        assertEquals("zelda", o.texto);
    }

    @Test
    public void buscarGanaAunqueElJuegoSeLlameComoUnaSeccion() {
        OrdenVoz o = OrdenVoz.interpretar("busca historia de un juego");
        assertEquals(OrdenVoz.Accion.BUSCAR, o.accion);
        assertEquals("historia de un juego", o.texto);
    }

    @Test
    public void quitaTildesYSignos() {
        assertEquals("abreme el carrito", OrdenVoz.normalizar("¡Ábreme el Carrito!"));
    }
}
