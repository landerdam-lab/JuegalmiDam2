package com.juegalmi.app.util;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

/** Fechas de la API (ISO 8601) → texto en español. java.time está disponible desde la API 26 (minSdk). */
public final class Fechas {

    private static final Locale ES = Locale.forLanguageTag("es-ES");
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("d MMM yyyy · HH:mm", ES);
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy", ES);
    private static final DateTimeFormatter CORTA = DateTimeFormatter.ofPattern("dd/MM", ES);

    private Fechas() {
    }

    /** "2026-10-28T10:42:00+00:00" → "28 oct 2026 · 11:42" (hora del móvil) */
    public static String fechaHora(String iso) {
        try {
            return OffsetDateTime.parse(iso).atZoneSameInstant(ZoneId.systemDefault()).format(FECHA_HORA);
        } catch (RuntimeException e) {
            return iso;
        }
    }

    /** "2026-11-03" → "03/11/2026" */
    public static String fecha(String dia) {
        try {
            return LocalDate.parse(dia.substring(0, 10)).format(FECHA);
        } catch (RuntimeException e) {
            return dia;
        }
    }

    /** "2026-11-03" → "03/11" */
    public static String corta(String dia) {
        try {
            return LocalDate.parse(dia.substring(0, 10)).format(CORTA);
        } catch (RuntimeException e) {
            return dia;
        }
    }

    /** Días que faltan hasta esa fecha (negativo si ya pasó). */
    public static long diasHasta(String dia) {
        return ChronoUnit.DAYS.between(LocalDate.now(), LocalDate.parse(dia.substring(0, 10)));
    }

    /** Hoy + n días, en "dd/MM/yyyy" (fecha de devolución de un alquiler que aún no existe). */
    public static String dentroDe(int dias) {
        return LocalDate.now().plusDays(dias).format(FECHA);
    }
}
