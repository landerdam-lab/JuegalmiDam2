package com.juegalmi.app.ui.carrito;

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
import com.juegalmi.app.data.Carrito;
import com.juegalmi.app.ui.comun.Pastilla;
import com.juegalmi.app.util.Formato;

/**
 * Líneas del carrito. El stepper cambia la cantidad (compras, hasta el stock) o los días (alquileres, de 1 a 14,
 * ADR-035). La API vuelve a comprobarlo todo al confirmar.
 */
public class LineaCarritoAdapter extends ListAdapter<Carrito.Linea, LineaCarritoAdapter.Fila> {

    static final int DIAS_MIN = 1;
    static final int DIAS_MAX = 14;

    public interface AlQuitar {
        void quitar(Carrito.Linea linea);
    }

    private final Carrito carrito;
    private final AlQuitar alQuitar;

    LineaCarritoAdapter(Carrito carrito, AlQuitar alQuitar) {
        super(new DiffUtil.ItemCallback<Carrito.Linea>() {
            @Override
            public boolean areItemsTheSame(@NonNull Carrito.Linea a, @NonNull Carrito.Linea b) {
                return a.tipo.equals(b.tipo) && a.producto.id == b.producto.id;
            }

            @Override
            public boolean areContentsTheSame(@NonNull Carrito.Linea a, @NonNull Carrito.Linea b) {
                return false; // la cantidad cambia sobre el mismo objeto: se repinta siempre (son pocas líneas)
            }
        });
        this.carrito = carrito;
        this.alQuitar = alQuitar;
    }

    @NonNull
    @Override
    public Fila onCreateViewHolder(@NonNull ViewGroup padre, int tipo) {
        return new Fila(LayoutInflater.from(padre.getContext()).inflate(R.layout.item_linea_carrito, padre, false));
    }

    @Override
    public void onBindViewHolder(@NonNull Fila f, int posicion) {
        Carrito.Linea l = getItem(posicion);
        boolean alquiler = Carrito.ALQUILER.equals(l.tipo);
        var c = f.itemView.getContext();

        f.nombre.setText(l.producto.nombre);
        Pastilla.pintar(f.tipo, alquiler ? R.color.ja_alquiler : R.color.ja_marca,
                c.getString(alquiler ? R.string.linea_alquiler : R.string.linea_compra));
        f.unitario.setText(alquiler
                ? c.getString(R.string.precio_por_dia, Formato.precio(l.producto.precioAlquiler == null ? 0 : l.producto.precioAlquiler))
                : c.getString(R.string.precio_por_unidad, Formato.precio(l.producto.precio)));
        f.cantidad.setText(alquiler
                ? c.getResources().getQuantityString(R.plurals.dias, l.dias, l.dias)
                : String.valueOf(l.cantidad));
        f.subtotal.setText(Formato.precio(l.subtotal()));

        int valor = alquiler ? l.dias : l.cantidad;
        int minimo = alquiler ? DIAS_MIN : 1;
        int maximo = alquiler ? DIAS_MAX : Math.max(l.producto.stock, 1);
        // Límite alcanzado: botón desactivado (DESIGN.md §9, stepper)
        f.menos.setEnabled(valor > minimo);
        f.mas.setEnabled(valor < maximo);
        f.menos.setAlpha(valor > minimo ? 1f : 0.4f);
        f.mas.setAlpha(valor < maximo ? 1f : 0.4f);
        f.menos.setOnClickListener(v -> cambiar(l, valor - 1));
        f.mas.setOnClickListener(v -> cambiar(l, valor + 1));
        f.quitar.setOnClickListener(v -> alQuitar.quitar(l));

        Glide.with(f.imagen).load(l.producto.imagen)
                .placeholder(R.drawable.ic_image).error(R.drawable.ic_broken_image)
                .centerCrop().into(f.imagen);
    }

    private void cambiar(Carrito.Linea l, int valor) {
        if (Carrito.ALQUILER.equals(l.tipo)) {
            carrito.alquilar(l.producto, valor);
        } else {
            carrito.cambiarCantidad(l, valor);
        }
    }

    static class Fila extends RecyclerView.ViewHolder {
        final ImageView imagen;
        final TextView nombre;
        final TextView tipo;
        final TextView unitario;
        final TextView cantidad;
        final TextView subtotal;
        final View menos;
        final View mas;
        final View quitar;

        Fila(View v) {
            super(v);
            imagen = v.findViewById(R.id.ivImagen);
            nombre = v.findViewById(R.id.tvNombre);
            tipo = v.findViewById(R.id.tvTipo);
            unitario = v.findViewById(R.id.tvUnitario);
            cantidad = v.findViewById(R.id.tvCantidad);
            subtotal = v.findViewById(R.id.tvSubtotal);
            menos = v.findViewById(R.id.btnMenos);
            mas = v.findViewById(R.id.btnMas);
            quitar = v.findViewById(R.id.btnQuitar);
        }
    }
}
