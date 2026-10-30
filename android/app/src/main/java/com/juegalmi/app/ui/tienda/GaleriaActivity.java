package com.juegalmi.app.ui.tienda;

import android.app.Dialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.google.android.material.appbar.MaterialToolbar;
import com.juegalmi.app.R;
import com.juegalmi.app.data.model.Tienda;
import com.juegalmi.app.util.Bordes;

import java.util.List;

/**
 * PT-27 Galería (RF-08): fotos de la tienda en una cuadrícula de 3 columnas (GridLayoutManager) y visor
 * a pantalla completa al tocar una. Glide pone el placeholder y solo descarga el tamaño de la baldosa.
 */
public class GaleriaActivity extends TiendaBaseActivity {

    private static final int COLUMNAS = 3;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_galeria);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        Bordes.aplicar(toolbar, true, false);
        Bordes.aplicar(findViewById(R.id.lista), false, true);
        toolbar.setNavigationOnClickListener(v -> finish());
        cargarTienda();
    }

    @Override
    protected void conTienda(Tienda t) {
        ((MaterialToolbar) findViewById(R.id.toolbar)).setSubtitle(
                getResources().getQuantityString(R.plurals.fotos_n, t.fotos.size(), t.fotos.size()));
        RecyclerView lista = findViewById(R.id.lista);
        lista.setLayoutManager(new GridLayoutManager(this, COLUMNAS));
        lista.setAdapter(new Adaptador(t.fotos));
    }

    /** Visor a pantalla completa con la descripción de la foto. */
    private void ver(Tienda.Foto foto) {
        Dialog visor = new Dialog(this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        View v = LayoutInflater.from(this).inflate(R.layout.visor_foto, null);
        Glide.with(this).load(foto.imagen).placeholder(R.drawable.ic_image).into((ImageView) v.findViewById(R.id.ivFoto));
        ((TextView) v.findViewById(R.id.tvDescripcion)).setText(foto.descripcion);
        v.findViewById(R.id.btnCerrar).setOnClickListener(b -> visor.dismiss());
        visor.setContentView(v);
        visor.show();
    }

    private class Adaptador extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
        private final List<Tienda.Foto> fotos;

        Adaptador(List<Tienda.Foto> fotos) {
            this.fotos = fotos;
        }

        @NonNull
        @Override
        public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup padre, int tipo) {
            return new RecyclerView.ViewHolder(LayoutInflater.from(padre.getContext())
                    .inflate(R.layout.item_foto, padre, false)) { };
        }

        @Override
        public void onBindViewHolder(@NonNull RecyclerView.ViewHolder h, int pos) {
            Tienda.Foto f = fotos.get(pos);
            ImageView iv = (ImageView) h.itemView;
            iv.setContentDescription(f.descripcion);
            Glide.with(iv).load(f.imagen).placeholder(R.drawable.ic_image).error(R.drawable.ic_broken_image)
                    .centerCrop().into(iv);
            iv.setOnClickListener(v -> ver(f));
        }

        @Override
        public int getItemCount() {
            return fotos.size();
        }
    }
}
