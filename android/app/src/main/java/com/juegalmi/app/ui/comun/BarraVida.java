package com.juegalmi.app.ui.comun;

import android.content.Context;
import android.content.res.ColorStateList;
import android.util.AttributeSet;
import android.view.View;
import android.widget.LinearLayout;

import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.juegalmi.app.R;

/**
 * «Barra de vida» del sistema Cartucho (DESIGN.md §1 y §9): N segmentos que se encienden a saltos.
 * 3 segmentos para el pedido, 4 para la reparación y 5 para el alquiler y las copias disponibles.
 * Es un LinearLayout con N Views: sin dibujo propio, así que no gasta CPU de más.
 */
public class BarraVida extends LinearLayout {

    public BarraVida(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        setOrientation(HORIZONTAL);
    }

    /**
     * @param segmentos número total de segmentos
     * @param llenos    cuántos van encendidos
     * @param color     color de los encendidos (los apagados, superficie-3)
     */
    public void mostrar(int segmentos, int llenos, int color) {
        removeAllViews();
        int alto = getResources().getDimensionPixelSize(R.dimen.ja_tamano_segmento_vida);
        int hueco = getResources().getDimensionPixelSize(R.dimen.ja_espacio_1);
        int encendido = ContextCompat.getColor(getContext(), color);
        int apagado = ContextCompat.getColor(getContext(), R.color.ja_superficie_3);
        int escalonado = getResources().getInteger(R.integer.ja_duracion_escalonado);
        int duracion = getResources().getInteger(R.integer.ja_duracion_base);
        for (int i = 0; i < segmentos; i++) {
            View segmento = new View(getContext());
            LayoutParams lp = new LayoutParams(0, alto, 1f);
            if (i > 0) {
                lp.setMarginStart(hueco);
            }
            segmento.setBackgroundResource(R.drawable.fondo_segmento);
            segmento.setBackgroundTintList(ColorStateList.valueOf(i < llenos ? encendido : apagado));
            addView(segmento, lp);
            // Los segmentos se encienden de uno en uno, 80 ms entre ellos (DESIGN.md §7)
            if (i < llenos) {
                segmento.setAlpha(0f);
                segmento.animate().alpha(1f).setStartDelay((long) escalonado * i).setDuration(duracion).start();
            }
        }
    }
}
