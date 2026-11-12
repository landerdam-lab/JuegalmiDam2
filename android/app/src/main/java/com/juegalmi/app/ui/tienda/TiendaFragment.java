package com.juegalmi.app.ui.tienda;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.bumptech.glide.Glide;
import com.google.android.material.card.MaterialCardView;
import com.google.gson.Gson;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Tienda;
import com.juegalmi.app.data.repository.TiendaRepository;
import com.juegalmi.app.ui.comun.EstadoVista;

public class TiendaFragment extends Fragment {

    public static final String EXTRA_TIENDA = "tienda";

    private Tienda tienda;
    private EstadoVista estado;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_tienda, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        estado = new EstadoVista(v);
        opcion(v.findViewById(R.id.opServicios), R.drawable.ic_handyman, R.string.tienda_servicios,
                R.string.tienda_servicios_sub, R.color.ja_marca_suave, ServiciosActivity.class);
        opcion(v.findViewById(R.id.opUbicacion), R.drawable.ic_location_on, R.string.tienda_ubicacion,
                R.string.tienda_ubicacion_sub, R.color.ja_info_suave, UbicacionActivity.class);
        opcion(v.findViewById(R.id.opGaleria), R.drawable.ic_photo_library, R.string.tienda_galeria,
                R.string.tienda_galeria_sub, R.color.ja_alquiler_suave, GaleriaActivity.class);
        opcion(v.findViewById(R.id.opHistoria), R.drawable.ic_menu_book, R.string.tienda_historia,
                R.string.tienda_historia_sub, R.color.ja_aviso_suave, HistoriaActivity.class);
        cargar();
    }

    private void cargar() {
        estado.ocultar();
        new TiendaRepository(requireContext()).tienda(this, new Callback<Tienda>() {
            @Override
            public void onExito(Tienda t) {
                tienda = t;
                View v = requireView();
                ((TextView) v.findViewById(R.id.tvNombreTienda)).setText(t.nombre);
                ((TextView) v.findViewById(R.id.tvDireccion)).setText(t.direccion);
                if (!t.fotos.isEmpty()) {
                    Glide.with(TiendaFragment.this).load(t.fotos.get(0).imagen).centerCrop()
                            .into((ImageView) v.findViewById(R.id.ivPortada));
                }
            }

            @Override
            public void onError(ApiError error) {
                requireView().findViewById(R.id.scroll).setVisibility(View.GONE);
                estado.error(R.string.tienda_error, error, () -> {
                    requireView().findViewById(R.id.scroll).setVisibility(View.VISIBLE);
                    cargar();
                });
            }
        });
    }

    private void opcion(MaterialCardView tarjeta, int icono, int titulo, int subtitulo, int tinte, Class<?> pantalla) {
        tarjeta.setCardBackgroundColor(ContextCompat.getColor(requireContext(), tinte));
        ((ImageView) tarjeta.findViewById(R.id.ivIcono)).setImageResource(icono);
        ((TextView) tarjeta.findViewById(R.id.tvTitulo)).setText(titulo);
        ((TextView) tarjeta.findViewById(R.id.tvSubtitulo)).setText(subtitulo);
        tarjeta.setOnClickListener(v -> {
            Intent intent = new Intent(requireContext(), pantalla);
            if (tienda != null) {
                intent.putExtra(EXTRA_TIENDA, new Gson().toJson(tienda));
            }
            startActivity(intent);
        });
    }

    @Override
    public void onDestroyView() {
        VolleyClient.get(requireContext()).cancelar(this);
        super.onDestroyView();
    }
}
