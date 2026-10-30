package com.juegalmi.app.ui.tienda;

import android.content.Context;
import android.util.AttributeSet;

import com.google.android.material.imageview.ShapeableImageView;

/** Imagen siempre cuadrada (el alto = el ancho de la columna), para la cuadrícula de la galería. */
public class FotoCuadrada extends ShapeableImageView {

    public FotoCuadrada(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void onMeasure(int anchoSpec, int altoSpec) {
        super.onMeasure(anchoSpec, anchoSpec);
    }
}
