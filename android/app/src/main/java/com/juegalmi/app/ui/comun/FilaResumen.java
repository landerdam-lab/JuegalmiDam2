package com.juegalmi.app.ui.comun;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.Nullable;

import com.bumptech.glide.Glide;
import com.juegalmi.app.R;

/**
 * Añade una fila item_fila_resumen a un contenedor. La usan el resumen de PT-12 y las líneas de PT-14,
 * donde hay pocas filas fijas y un RecyclerView sería excesivo.
 */
public final class FilaResumen {

    private FilaResumen() {
    }

    public static void anadir(ViewGroup contenedor, String titulo, String detalle, String importe,
                              @Nullable String imagen) {
        View fila = LayoutInflater.from(contenedor.getContext()).inflate(R.layout.item_fila_resumen, contenedor, false);
        ((TextView) fila.findViewById(R.id.tvTitulo)).setText(titulo);
        ((TextView) fila.findViewById(R.id.tvDetalle)).setText(detalle);
        ((TextView) fila.findViewById(R.id.tvImporte)).setText(importe);
        ImageView iv = fila.findViewById(R.id.ivImagen);
        if (imagen != null) {
            iv.setVisibility(View.VISIBLE);
            Glide.with(iv).load(imagen).placeholder(R.drawable.ic_image).error(R.drawable.ic_broken_image)
                    .centerCrop().into(iv);
        } else {
            // Sin miniatura, el texto empieza pegado al borde
            View textos = fila.findViewById(R.id.textos);
            ((ViewGroup.MarginLayoutParams) textos.getLayoutParams()).setMarginStart(0);
        }
        contenedor.addView(fila);
    }
}
