package com.juegalmi.app.ui.comun;

import android.content.DialogInterface;

import androidx.appcompat.app.AlertDialog;
import androidx.core.content.ContextCompat;

import com.juegalmi.app.R;

/** Diálogos destructivos (cancelar, cerrar sesión): el botón que confirma va en rojo (DESIGN.md §9). */
public final class Dialogos {

    private Dialogos() {
    }

    /** Uso: Dialogos.destructivo(new MaterialAlertDialogBuilder(…)….show()); */
    public static AlertDialog destructivo(AlertDialog dialogo) {
        dialogo.getButton(DialogInterface.BUTTON_POSITIVE)
                .setTextColor(ContextCompat.getColor(dialogo.getContext(), R.color.ja_error));
        return dialogo;
    }
}
