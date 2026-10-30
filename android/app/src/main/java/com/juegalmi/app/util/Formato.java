package com.juegalmi.app.util;

import java.text.NumberFormat;
import java.util.Locale;

/** Formatos para mostrar datos en pantalla (en español de España). */
public final class Formato {

    private static final Locale ES = Locale.forLanguageTag("es-ES");

    private Formato() {
    }

    /** 69.99 → "69,99 €" */
    public static String precio(double importe) {
        return NumberFormat.getCurrencyInstance(ES).format(importe);
    }

    /** 6.1 → "6,1" (pulgadas de pantalla) */
    public static String decimal(double valor) {
        NumberFormat f = NumberFormat.getNumberInstance(ES);
        f.setMaximumFractionDigits(1);
        return f.format(valor);
    }
}
