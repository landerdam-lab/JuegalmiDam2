package com.juegalmi.app.ui.comun;

import android.content.res.ColorStateList;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;

/**
 * Maneja el layout estado_vacio.xml (diseño e1): vacío, error y sin conexión.
 * Así todas las pantallas muestran los estados igual.
 */
public class EstadoVista {

    private final View raiz;
    private final ImageView icono;
    private final TextView titulo;
    private final TextView texto;
    private final View boton;

    public EstadoVista(View contenedor) {
        raiz = contenedor.findViewById(R.id.estado);
        icono = contenedor.findViewById(R.id.estadoIcono);
        titulo = contenedor.findViewById(R.id.estadoTitulo);
        texto = contenedor.findViewById(R.id.estadoTexto);
        boton = contenedor.findViewById(R.id.estadoBoton);
    }

    /** Vacío: baldosa amarilla. Sin botón. */
    public void vacio(int tituloRes, int textoRes) {
        pintar(R.drawable.ic_inventory_2, R.color.ja_primario, R.color.ja_sobre_primario);
        titulo.setText(tituloRes);
        texto.setText(textoRes);
        boton.setVisibility(View.GONE);
        raiz.setVisibility(View.VISIBLE);
    }

    /** Vacío con una acción (p. ej. «Ir al catálogo» en el carrito vacío). */
    public void vacio(int tituloRes, int textoRes, int botonRes, Runnable accion) {
        vacio(tituloRes, textoRes);
        ((android.widget.Button) boton).setText(botonRes);
        boton.setOnClickListener(v -> accion.run());
        boton.setVisibility(View.VISIBLE);
    }

    /** Error o sin red: baldosa roja suave, mensaje y botón «Reintentar». */
    public void error(int tituloRes, ApiError error, Runnable reintentar) {
        pintar(error.esSinRed() ? R.drawable.ic_wifi_off : R.drawable.ic_error,
                R.color.ja_error_suave, R.color.ja_error);
        titulo.setText(tituloRes);
        texto.setText(error.mensaje);
        ((android.widget.Button) boton).setText(R.string.reintentar);
        boton.setOnClickListener(v -> reintentar.run());
        boton.setVisibility(View.VISIBLE);
        raiz.setVisibility(View.VISIBLE);
    }

    public void ocultar() {
        raiz.setVisibility(View.GONE);
    }

    private void pintar(int iconoRes, int fondo, int tinte) {
        icono.setImageResource(iconoRes);
        icono.setBackgroundColor(ContextCompat.getColor(icono.getContext(), fondo));
        icono.setImageTintList(ColorStateList.valueOf(ContextCompat.getColor(icono.getContext(), tinte)));
    }
}
