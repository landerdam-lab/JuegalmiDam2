package com.juegalmi.app.ui.comun;

import android.content.Context;
import android.content.res.ColorStateList;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import com.juegalmi.app.R;
import com.juegalmi.app.data.model.Alquiler;
import com.juegalmi.app.data.model.Pedido;
import com.juegalmi.app.data.model.Reparacion;

/**
 * Pastillas de estado (DESIGN.md §3): cada valor tiene su color (texto) y su color -suave (fondo).
 * Siempre con texto, nunca solo color. Los nombres de los estados son los de la BBDD y la API.
 */
public final class Pastilla {

    private Pastilla() {
    }

    /** Color principal de un estado (también se usa para la barra de vida). */
    public static int colorPedido(String estado) {
        switch (estado) {
            case Pedido.PENDIENTE: return R.color.ja_aviso;
            case Pedido.PREPARADO: return R.color.ja_info;
            case Pedido.ENTREGADO: return R.color.ja_exito;
            default: return R.color.ja_neutro_estado;
        }
    }

    public static int colorReparacion(String estado) {
        switch (estado) {
            case Reparacion.EN_REPARACION: return R.color.ja_aviso;
            case Reparacion.LISTA: return R.color.ja_info;
            case Reparacion.ENTREGADA: return R.color.ja_exito;
            case Reparacion.CANCELADA: return R.color.ja_error;
            default: return R.color.ja_neutro_estado;
        }
    }

    public static int colorAlquiler(String estado) {
        switch (estado) {
            case Alquiler.ACTIVO: return R.color.ja_alquiler;
            case Alquiler.RETRASADO: return R.color.ja_error;
            default: return R.color.ja_neutro_estado;
        }
    }

    /** El -suave que acompaña a cada color de estado. */
    private static int suave(int color) {
        if (color == R.color.ja_aviso) return R.color.ja_aviso_suave;
        if (color == R.color.ja_info) return R.color.ja_info_suave;
        if (color == R.color.ja_exito) return R.color.ja_exito_suave;
        if (color == R.color.ja_error) return R.color.ja_error_suave;
        if (color == R.color.ja_alquiler) return R.color.ja_alquiler_suave;
        return R.color.ja_neutro_estado_suave;
    }

    public static void pintar(TextView pastilla, int color, String texto) {
        Context c = pastilla.getContext();
        pastilla.setText(texto);
        pastilla.setTextColor(ContextCompat.getColor(c, color));
        pastilla.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(c, suave(color))));
    }

    /** Texto visible de un estado: «en_reparacion» → «En reparación». */
    public static String texto(Context c, String estado) {
        int id = c.getResources().getIdentifier("estado_" + estado, "string", c.getPackageName());
        return id != 0 ? c.getString(id) : estado;
    }
}
