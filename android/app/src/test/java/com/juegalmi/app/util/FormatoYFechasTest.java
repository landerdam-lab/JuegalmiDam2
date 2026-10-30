package com.juegalmi.app.util;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/** Cómo se muestran precios y fechas de la API (formato de España). */
public class FormatoYFechasTest {

    @Test
    public void precioConComaYEuro() {
        // Java separa el número y el símbolo con un espacio duro (U+00A0)
        String texto = Formato.precio(69.99).replace(' ', ' ');
        assertEquals("69,99 €", texto);
    }

    @Test
    public void decimalConUnaCifra() {
        assertEquals("6,1", Formato.decimal(6.1));
        assertEquals("6", Formato.decimal(6.0));
    }

    @Test
    public void fechaDeLaApi() {
        assertEquals("03/11/2026", Fechas.fecha("2026-11-03"));
        // También acepta una fecha con hora: se queda con el día
        assertEquals("03/11/2026", Fechas.fecha("2026-11-03T10:00:00+00:00"));
        assertEquals("03/11", Fechas.corta("2026-11-03"));
    }

    @Test
    public void fechaIncorrectaSeDevuelveTalCual() {
        assertEquals("mañana", Fechas.fecha("mañana"));
    }

    @Test
    public void diasHastaUnaFecha() {
        String dentroDeTres = LocalDate.now().plusDays(3).toString();
        String haceDos = LocalDate.now().minusDays(2).toString();
        assertEquals(3, Fechas.diasHasta(dentroDeTres));
        assertEquals(-2, Fechas.diasHasta(haceDos));
    }

    @Test
    public void devolucionDeUnAlquiler() {
        String esperada = LocalDate.now().plusDays(7).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        assertEquals(esperada, Fechas.dentroDe(7));
        assertTrue(Fechas.fechaHora("no es una fecha").contains("no es"));
    }
}
