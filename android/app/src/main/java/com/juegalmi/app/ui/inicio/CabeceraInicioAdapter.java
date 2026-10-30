package com.juegalmi.app.ui.inicio;

import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.Pagina;
import com.juegalmi.app.data.model.Producto;
import com.juegalmi.app.data.repository.ProductoRepository;
import com.juegalmi.app.ui.reparaciones.NuevaReparacionActivity;
import com.juegalmi.app.util.Formato;

import java.util.ArrayList;
import java.util.List;

/**
 * Cabecera de Inicio (PT-04) encima del catálogo de videojuegos, unida a la lista con un ConcatAdapter:
 * carrusel horizontal «Para alquilar» (GET /api/videojuegos?alquilable=1) y tarjeta «Reparamos tu dispositivo».
 * Solo con datos del modelo: no hay «novedades» porque el producto no guarda su fecha de alta (A-08).
 */
public class CabeceraInicioAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    public interface Acciones {
        void abrir(Producto producto, ImageView imagen);

        void verAlquilables();
    }

    private final Acciones acciones;
    private final List<Producto> alquilables = new ArrayList<>();
    private boolean visible = true;
    private Carrusel carrusel;

    public CabeceraInicioAdapter(Acciones acciones) {
        this.acciones = acciones;
    }

    /** Se oculta al buscar o filtrar: entonces solo interesa la lista de resultados. */
    public void mostrar(boolean si) {
        if (si != visible) {
            visible = si;
            if (si) notifyItemInserted(0);
            else notifyItemRemoved(0);
        }
    }

    public void cargar(ProductoRepository repositorio, Object etiqueta) {
        ProductoRepository.Filtro filtro = new ProductoRepository.Filtro();
        filtro.soloAlquilables = true;
        repositorio.listar(filtro, 1, etiqueta, new Callback<Pagina<Producto>>() {
            @Override
            public void onExito(Pagina<Producto> pagina) {
                alquilables.clear();
                alquilables.addAll(pagina.items);
                if (carrusel != null) carrusel.notifyDataSetChanged();
            }

            @Override
            public void onError(ApiError error) {
                // Si falla, la lista de debajo ya muestra el error con «Reintentar»
            }
        });
    }

    @Override
    public int getItemCount() {
        return visible ? 1 : 0;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup padre, int tipo) {
        View v = LayoutInflater.from(padre.getContext()).inflate(R.layout.cabecera_inicio, padre, false);
        RecyclerView lista = v.findViewById(R.id.carrusel);
        lista.setLayoutManager(new LinearLayoutManager(padre.getContext(), LinearLayoutManager.HORIZONTAL, false));
        carrusel = new Carrusel();
        lista.setAdapter(carrusel);
        v.findViewById(R.id.btnVerAlquilables).setOnClickListener(b -> acciones.verAlquilables());
        View.OnClickListener reparar = b -> b.getContext().startActivity(
                new Intent(b.getContext(), NuevaReparacionActivity.class));
        v.findViewById(R.id.tarjetaReparar).setOnClickListener(reparar);
        v.findViewById(R.id.btnReparar).setOnClickListener(reparar);
        return new RecyclerView.ViewHolder(v) { };
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder h, int posicion) {
        // Todo se prepara al crearla: es una sola fila
    }

    /** Tarjetas verticales del carrusel. */
    private class Carrusel extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

        @NonNull
        @Override
        public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup padre, int tipo) {
            return new RecyclerView.ViewHolder(LayoutInflater.from(padre.getContext())
                    .inflate(R.layout.item_producto_carrusel, padre, false)) { };
        }

        @Override
        public void onBindViewHolder(@NonNull RecyclerView.ViewHolder h, int pos) {
            Producto p = alquilables.get(pos);
            View v = h.itemView;
            ((TextView) v.findViewById(R.id.tvNombre)).setText(p.nombre);
            ((TextView) v.findViewById(R.id.tvSubtitulo)).setText(
                    (p.marca == null ? "" : p.marca.nombre) + (p.plataforma == null ? "" : " · " + p.plataforma.nombre));
            ((TextView) v.findViewById(R.id.tvPrecio)).setText(Formato.precio(p.precio));
            ((TextView) v.findViewById(R.id.tvAlquiler)).setText(v.getContext().getString(R.string.precio_alquiler_dia,
                    Formato.precio(p.precioAlquiler == null ? 0 : p.precioAlquiler)));
            ImageView iv = v.findViewById(R.id.ivImagen);
            iv.setContentDescription(v.getContext().getString(R.string.imagen_producto, p.nombre));
            Glide.with(iv).load(p.imagen).placeholder(R.drawable.ic_image).error(R.drawable.ic_broken_image)
                    .centerCrop().into(iv);
            v.setOnClickListener(b -> acciones.abrir(p, iv));
        }

        @Override
        public int getItemCount() {
            return alquilables.size();
        }
    }
}
