package com.juegalmi.app.ui.detalle;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.bumptech.glide.Glide;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.gson.Gson;
import com.juegalmi.app.R;
import com.juegalmi.app.data.Carrito;
import com.juegalmi.app.data.model.Producto;
import com.juegalmi.app.ui.comun.BarraVida;
import com.juegalmi.app.util.Fechas;
import com.juegalmi.app.util.Formato;

/**
 * PT-15 Alquilar: hoja inferior desde la ficha del videojuego. Se elige la duración, se ven las fechas y el precio,
 * y se añade la línea de alquiler al carrito. El alquiler se confirma con el pedido (ADR-034).
 */
public class AlquilarHoja extends BottomSheetDialogFragment {

    public static final String TAG = "alquilar";
    private static final String ARG_PRODUCTO = "producto";
    private static final int[] DURACIONES = {3, 7, 14};
    private static final int SEGMENTOS = 5;

    public interface AlAnadir {
        void alquilado(int dias);
    }

    private Producto producto;
    private int dias = DURACIONES[1];

    public static AlquilarHoja nueva(Producto p) {
        AlquilarHoja h = new AlquilarHoja();
        Bundle args = new Bundle();
        args.putString(ARG_PRODUCTO, new Gson().toJson(p));
        h.setArguments(args);
        return h;
    }

    @Override
    public int getTheme() {
        return R.style.ThemeOverlay_JuegAlmi_Hoja;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.hoja_alquilar, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        producto = new Gson().fromJson(requireArguments().getString(ARG_PRODUCTO), Producto.class);
        ((TextView) v.findViewById(R.id.tvNombre)).setText(producto.nombre);
        ((TextView) v.findViewById(R.id.tvPlataforma)).setText(producto.plataforma == null ? "" : producto.plataforma.nombre);
        ((TextView) v.findViewById(R.id.tvPrecioDia)).setText(getString(R.string.precio_por_dia, Formato.precio(producto.precioAlquiler)));
        Glide.with(this).load(producto.imagen).placeholder(R.drawable.ic_image).centerCrop()
                .into((android.widget.ImageView) v.findViewById(R.id.ivImagen));

        int total = producto.copiasAlquiler == null ? 0 : producto.copiasAlquiler;
        int libres = producto.copiasDisponibles == null ? 0 : producto.copiasDisponibles;
        ((BarraVida) v.findViewById(R.id.barraCopias)).mostrar(SEGMENTOS,
                total == 0 ? 0 : Math.round(SEGMENTOS * libres / (float) total), R.color.ja_alquiler);
        ((TextView) v.findViewById(R.id.tvCopias)).setText(getString(R.string.detalle_copias, libres, total));
        ((TextView) v.findViewById(R.id.tvDesde)).setText(Fechas.dentroDe(0));

        ChipGroup chips = v.findViewById(R.id.chipsDias);
        for (int d : DURACIONES) {
            Chip chip = new Chip(requireContext());
            chip.setText(getResources().getQuantityString(R.plurals.dias, d, d));
            chip.setCheckable(true);
            chip.setChipBackgroundColor(ContextCompat.getColorStateList(requireContext(), R.color.ja_chip_fondo));
            chip.setChecked(d == dias);
            chip.setOnCheckedChangeListener((c, marcado) -> {
                if (marcado) {
                    dias = d;
                    pintarPrecio(v);
                }
            });
            chips.addView(chip);
        }
        pintarPrecio(v);

        v.findViewById(R.id.btnAnadir).setOnClickListener(b -> {
            Carrito.get(requireContext()).alquilar(producto, dias);
            if (getActivity() instanceof AlAnadir) {
                ((AlAnadir) getActivity()).alquilado(dias);
            }
            dismiss();
        });
    }

    private void pintarPrecio(View v) {
        ((TextView) v.findViewById(R.id.tvHasta)).setText(Fechas.dentroDe(dias));
        ((TextView) v.findViewById(R.id.tvTarifa)).setText(getString(R.string.alquilar_tarifa,
                getResources().getQuantityString(R.plurals.dias, dias, dias), Formato.precio(producto.precioAlquiler)));
        ((TextView) v.findViewById(R.id.tvTotal)).setText(Formato.precio(producto.precioAlquiler * dias));
    }
}
