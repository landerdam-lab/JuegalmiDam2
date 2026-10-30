package com.juegalmi.app.ui.comun;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.util.AgitarDetector;

/**
 * Lo común de Mis pedidos, Mis alquileres y Mis reparaciones (layout fragment_lista):
 * estados de carga / vacío / error, chips de filtro, «agitar para refrescar» y cancelar las peticiones al salir.
 * Cada pantalla solo dice qué carga (cargar) y qué adaptador usa.
 */
public abstract class ListaBaseFragment extends Fragment {

    protected RecyclerView lista;
    protected TextView tvResultados;
    protected EstadoVista estado;
    private View progreso;

    /** Carga (o recarga) los datos de la API. */
    protected abstract void cargar();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_lista, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View vista, @Nullable Bundle savedInstanceState) {
        lista = vista.findViewById(R.id.lista);
        // 1 columna en el móvil y 2-4 en pantallas anchas (res/values-wNNNdp/adaptativo.xml)
        lista.setLayoutManager(new GridLayoutManager(requireContext(),
                getResources().getInteger(R.integer.columnas_lista)));
        tvResultados = vista.findViewById(R.id.tvResultados);
        progreso = vista.findViewById(R.id.progreso);
        estado = new EstadoVista(vista);
        // Agitar el móvil recarga la lista (RF-15). Solo mientras la pantalla está visible
        AgitarDetector.vincular(getViewLifecycleOwner(), requireContext(), this::recargarAgitando);
    }

    protected void titulo(int texto) {
        ((TextView) requireView().findViewById(R.id.tvTitulo)).setText(texto);
    }

    /** Añade chips de filtro de selección única. El primero queda marcado. */
    protected void chips(int[] textos, java.util.function.IntConsumer alElegir) {
        requireView().findViewById(R.id.scrollChips).setVisibility(View.VISIBLE);
        ChipGroup grupo = requireView().findViewById(R.id.chips);
        for (int i = 0; i < textos.length; i++) {
            Chip chip = new Chip(requireContext());
            chip.setText(textos[i]);
            chip.setCheckable(true);
            chip.setChipBackgroundColor(ContextCompat.getColorStateList(requireContext(), R.color.ja_chip_fondo));
            chip.setId(View.generateViewId());
            final int indice = i;
            chip.setOnCheckedChangeListener((c, marcado) -> {
                if (marcado) {
                    alElegir.accept(indice);
                }
            });
            grupo.addView(chip);
            if (i == 0) {
                chip.setChecked(true);
            }
        }
    }

    protected void cargando() {
        estado.ocultar();
        progreso.setVisibility(View.VISIBLE);
    }

    protected void listo(int cuantos, int vacioTitulo, int vacioTexto) {
        progreso.setVisibility(View.GONE);
        if (cuantos == 0) {
            estado.vacio(vacioTitulo, vacioTexto);
        } else {
            estado.ocultar();
        }
    }

    protected void error(int titulo, ApiError error) {
        progreso.setVisibility(View.GONE);
        estado.error(titulo, error, this::cargar);
    }

    /** Las tarjetas se sacuden 2° al agitar (DESIGN.md §7) y se recarga. */
    private void recargarAgitando() {
        lista.animate().rotation(2f).setDuration(60).withEndAction(() ->
                lista.animate().rotation(-2f).setDuration(60).withEndAction(() ->
                        lista.animate().rotation(0f).setDuration(60).start()).start()).start();
        cargar();
    }

    @Override
    public void onDestroyView() {
        VolleyClient.get(requireContext()).cancelar(this);
        super.onDestroyView();
    }
}
