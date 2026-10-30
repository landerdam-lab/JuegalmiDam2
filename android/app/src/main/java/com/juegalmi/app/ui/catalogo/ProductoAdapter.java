package com.juegalmi.app.ui.catalogo;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.juegalmi.app.R;
import com.juegalmi.app.data.model.Producto;
import com.juegalmi.app.ui.comun.EstadoStock;
import com.juegalmi.app.util.Formato;

import java.util.ArrayList;
import java.util.List;

/**
 * Adaptador propio del RecyclerView del catálogo (RT-06): convierte cada Producto en una tarjeta item_producto.
 *
 * Es un ListAdapter: al recibir una lista nueva, DiffUtil calcula EN SEGUNDO PLANO qué tarjetas han cambiado
 * y solo redibuja esas (menos CPU que notifyDataSetChanged).
 */
public class ProductoAdapter extends ListAdapter<Producto, ProductoAdapter.Tarjeta> {

    public interface AlPulsar {
        void abrir(Producto producto, ImageView imagen);
    }

    private final AlPulsar alPulsar;

    public ProductoAdapter(AlPulsar alPulsar) {
        super(new DiffUtil.ItemCallback<Producto>() {
            @Override
            public boolean areItemsTheSame(@NonNull Producto a, @NonNull Producto b) {
                return a.id == b.id;
            }

            @Override
            public boolean areContentsTheSame(@NonNull Producto a, @NonNull Producto b) {
                return a.precio == b.precio && a.stock == b.stock && a.alquilable == b.alquilable
                        && a.nombre.equals(b.nombre);
            }
        });
        this.alPulsar = alPulsar;
    }

    /** Añade una página al final (scroll infinito). */
    public void anadir(List<Producto> nuevos) {
        List<Producto> todos = new ArrayList<>(getCurrentList());
        todos.addAll(nuevos);
        submitList(todos);
    }

    @NonNull
    @Override
    public Tarjeta onCreateViewHolder(@NonNull ViewGroup padre, int tipo) {
        View vista = LayoutInflater.from(padre.getContext()).inflate(R.layout.item_producto, padre, false);
        return new Tarjeta(vista);
    }

    @Override
    public void onBindViewHolder(@NonNull Tarjeta t, int posicion) {
        Producto p = getItem(posicion);
        t.nombre.setText(p.nombre);
        t.subtitulo.setText(subtitulo(t.itemView, p));
        t.precio.setText(Formato.precio(p.precio));
        EstadoStock.pintar(t.estado, p);

        if (p.esVideojuego() && p.alquilable && p.precioAlquiler != null) {
            t.alquiler.setText(t.itemView.getContext().getString(R.string.precio_alquiler_dia,
                    Formato.precio(p.precioAlquiler)));
            t.alquiler.setVisibility(View.VISIBLE);
        } else {
            t.alquiler.setVisibility(View.GONE);
        }

        // Agotado: el contenido al 60 % (DESIGN.md §9). Va en el contenido y no en la tarjeta entera
        // porque el RecyclerView anima la opacidad de la tarjeta al insertarla y la dejaría al 100 %
        t.contenido.setAlpha(p.stock <= 0 ? 0.6f : 1f);

        // Glide descarga y escala la imagen en segundo plano, la guarda en caché y muestra
        // un placeholder mientras tanto (requisito innegociable) y otro si falla
        t.imagen.setContentDescription(t.itemView.getContext().getString(R.string.imagen_producto, p.nombre));
        Glide.with(t.imagen)
                .load(p.imagen)
                .placeholder(R.drawable.placeholder_imagen)
                .error(R.drawable.placeholder_error)
                .centerCrop()
                .into(t.imagen);

        t.itemView.setOnClickListener(v -> alPulsar.abrir(p, t.imagen));
    }

    /** «Nintendo · Switch · PEGI 12» (videojuego) o «Samsung · Tablet» / «Sony · PS5». */
    static String subtitulo(View v, Producto p) {
        List<String> partes = new ArrayList<>();
        if (p.marca != null) {
            partes.add(p.marca.nombre);
        }
        if (p.plataforma != null) {
            partes.add(p.plataforma.nombre);
        }
        if (p.pegi != null) {
            partes.add(v.getContext().getString(R.string.pegi, p.pegi));
        }
        if (p.formato != null) {
            partes.add(v.getContext().getString(Producto.MOVIL.equals(p.formato)
                    ? R.string.filtro_moviles : R.string.filtro_tablets));
        }
        if (p.modelo != null) {
            partes.add(p.modelo);
        }
        return String.join(" · ", partes);
    }

    static class Tarjeta extends RecyclerView.ViewHolder {
        final ImageView imagen;
        final TextView nombre;
        final TextView subtitulo;
        final TextView precio;
        final TextView alquiler;
        final TextView estado;
        final View contenido;

        Tarjeta(View v) {
            super(v);
            imagen = v.findViewById(R.id.ivImagen);
            nombre = v.findViewById(R.id.tvNombre);
            subtitulo = v.findViewById(R.id.tvSubtitulo);
            precio = v.findViewById(R.id.tvPrecio);
            alquiler = v.findViewById(R.id.tvAlquiler);
            estado = v.findViewById(R.id.tvEstado);
            contenido = v.findViewById(R.id.contenidoTarjeta);
        }
    }
}
