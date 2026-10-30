package com.juegalmi.app.ui.comun;

import android.content.res.ColorStateList;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import com.juegalmi.app.R;
import com.juegalmi.app.data.model.Producto;

/**
 * Pastilla de stock (DESIGN.md §3, stock derivado): disponible → éxito · ≤ 2 uds. → aviso · 0 → neutro «Agotado».
 * El estado va con color Y texto, nunca solo con color.
 */
public final class EstadoStock {

    /** A partir de cuántas unidades se avisa de «últimas unidades». */
    public static final int ULTIMAS = 2;

    private EstadoStock() {
    }

    public static void pintar(TextView pastilla, Producto p) {
        int texto;
        int fondo;
        String etiqueta;
        if (p.stock <= 0) {
            texto = R.color.ja_neutro_estado;
            fondo = R.color.ja_neutro_estado_suave;
            etiqueta = pastilla.getContext().getString(R.string.estado_agotado);
        } else if (p.stock <= ULTIMAS) {
            texto = R.color.ja_aviso;
            fondo = R.color.ja_aviso_suave;
            etiqueta = pastilla.getContext().getString(R.string.estado_ultimas, p.stock);
        } else {
            texto = R.color.ja_exito;
            fondo = R.color.ja_exito_suave;
            etiqueta = pastilla.getContext().getString(R.string.estado_en_stock);
        }
        pastilla.setText(etiqueta);
        pastilla.setTextColor(ContextCompat.getColor(pastilla.getContext(), texto));
        pastilla.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(pastilla.getContext(), fondo)));
    }
}
