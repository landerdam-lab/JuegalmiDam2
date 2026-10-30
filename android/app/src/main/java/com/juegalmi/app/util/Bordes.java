package com.juegalmi.app.util;

import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

/**
 * Edge-to-edge (DESIGN.md §8): la app se dibuja detrás de la barra de estado y de la de gestos,
 * así que a la vista de arriba y a la de abajo se les suma ese tamaño como padding para que no queden tapadas.
 */
public final class Bordes {

    private Bordes() {
    }

    /** Suma los insets del sistema (y del teclado) al padding que ya tenga la vista. */
    public static void aplicar(View vista, boolean arriba, boolean abajo) {
        int izq = vista.getPaddingLeft();
        int sup = vista.getPaddingTop();
        int der = vista.getPaddingRight();
        int inf = vista.getPaddingBottom();
        ViewCompat.setOnApplyWindowInsetsListener(vista, (v, insets) -> {
            Insets barras = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime());
            v.setPadding(izq + barras.left, sup + (arriba ? barras.top : 0),
                    der + barras.right, inf + (abajo ? barras.bottom : 0));
            return insets;
        });
    }
}
