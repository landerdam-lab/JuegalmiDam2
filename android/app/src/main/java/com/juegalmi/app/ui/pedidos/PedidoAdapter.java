package com.juegalmi.app.ui.pedidos;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.google.android.material.imageview.ShapeableImageView;
import com.juegalmi.app.R;
import com.juegalmi.app.data.model.Alquiler;
import com.juegalmi.app.data.model.Pedido;
import com.juegalmi.app.ui.comun.BarraVida;
import com.juegalmi.app.ui.comun.Pastilla;
import com.juegalmi.app.util.Fechas;
import com.juegalmi.app.util.Formato;

import java.util.ArrayList;
import java.util.List;

/** Tarjetas de Mis pedidos (PT-13). */
public class PedidoAdapter extends ListAdapter<Pedido, PedidoAdapter.Tarjeta> {

    private static final int MAX_MINIATURAS = 3;

    public interface AlPulsar {
        void abrir(Pedido pedido);
    }

    private final AlPulsar alPulsar;

    public PedidoAdapter(AlPulsar alPulsar) {
        super(new DiffUtil.ItemCallback<Pedido>() {
            @Override
            public boolean areItemsTheSame(@NonNull Pedido a, @NonNull Pedido b) {
                return a.id == b.id;
            }

            @Override
            public boolean areContentsTheSame(@NonNull Pedido a, @NonNull Pedido b) {
                return a.estado.equals(b.estado) && a.total == b.total;
            }
        });
        this.alPulsar = alPulsar;
    }

    /** Paso de la barra de vida de 3: pendiente 1, preparado 2, entregado 3, cancelado 0. */
    static int paso(String estado) {
        switch (estado) {
            case Pedido.PENDIENTE: return 1;
            case Pedido.PREPARADO: return 2;
            case Pedido.ENTREGADO: return 3;
            default: return 0;
        }
    }

    @NonNull
    @Override
    public Tarjeta onCreateViewHolder(@NonNull ViewGroup padre, int tipo) {
        return new Tarjeta(LayoutInflater.from(padre.getContext()).inflate(R.layout.item_pedido, padre, false));
    }

    @Override
    public void onBindViewHolder(@NonNull Tarjeta t, int posicion) {
        Pedido p = getItem(posicion);
        var c = t.itemView.getContext();
        t.referencia.setText(p.referencia());
        t.fecha.setText(Fechas.fechaHora(p.fecha));
        int color = Pastilla.colorPedido(p.estado);
        Pastilla.pintar(t.estado, color, Pastilla.texto(c, p.estado));
        int paso = paso(p.estado);
        t.paso.setText(paso == 0 ? c.getString(R.string.pedido_anulado) : c.getString(R.string.paso_de, paso, 3));
        t.barra.mostrar(3, paso, color);
        t.metodo.setText(MetodosPago.texto(c, p.metodoPago));
        t.total.setText(Formato.precio(p.total));

        // Miniaturas de los productos (compras y alquileres)
        List<String> imagenes = new ArrayList<>();
        for (Pedido.Compra compra : p.compras) {
            imagenes.add(compra.producto.imagen);
        }
        for (Alquiler a : p.alquileres) {
            imagenes.add(a.videojuego.imagen);
        }
        t.miniaturas.removeAllViews();
        int tam = c.getResources().getDimensionPixelSize(R.dimen.miniatura_cuadrada);
        int hueco = c.getResources().getDimensionPixelSize(R.dimen.ja_espacio_2);
        for (int i = 0; i < Math.min(MAX_MINIATURAS, imagenes.size()); i++) {
            ShapeableImageView iv = (ShapeableImageView) LayoutInflater.from(c)
                    .inflate(R.layout.miniatura, t.miniaturas, false);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(tam, tam);
            lp.setMarginEnd(hueco);
            Glide.with(iv).load(imagenes.get(i)).placeholder(R.drawable.placeholder_imagen)
                    .error(R.drawable.placeholder_error).centerCrop().into(iv);
            t.miniaturas.addView(iv, lp);
        }
        if (imagenes.size() > MAX_MINIATURAS) {
            TextView mas = new TextView(c);
            mas.setText(c.getString(R.string.mas_n, imagenes.size() - MAX_MINIATURAS));
            mas.setTextAppearance(R.style.TextAppearance_JuegAlmi_EtiquetaS);
            mas.setTextColor(c.getColor(R.color.ja_texto_2));
            mas.setGravity(android.view.Gravity.CENTER);
            t.miniaturas.addView(mas, new LinearLayout.LayoutParams(tam, tam));
        }

        t.itemView.setOnClickListener(v -> alPulsar.abrir(p));
    }

    static class Tarjeta extends RecyclerView.ViewHolder {
        final TextView referencia;
        final TextView fecha;
        final TextView estado;
        final TextView paso;
        final BarraVida barra;
        final LinearLayout miniaturas;
        final TextView metodo;
        final TextView total;

        Tarjeta(View v) {
            super(v);
            referencia = v.findViewById(R.id.tvReferencia);
            fecha = v.findViewById(R.id.tvFecha);
            estado = v.findViewById(R.id.tvEstado);
            paso = v.findViewById(R.id.tvPaso);
            barra = v.findViewById(R.id.barra);
            miniaturas = v.findViewById(R.id.miniaturas);
            metodo = v.findViewById(R.id.tvMetodo);
            total = v.findViewById(R.id.tvTotal);
        }
    }
}
