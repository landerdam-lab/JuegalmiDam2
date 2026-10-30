package com.juegalmi.app.ui.carrito;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.snackbar.Snackbar;
import com.juegalmi.app.MainActivity;
import com.juegalmi.app.R;
import com.juegalmi.app.data.Carrito;
import com.juegalmi.app.ui.comun.EstadoVista;
import com.juegalmi.app.ui.pedidos.ConfirmarPedidoActivity;
import com.juegalmi.app.util.Formato;

/**
 * PT-11 Carrito: las líneas que el cliente ha ido añadiendo (compras y alquileres), el método de pago y el total.
 * No llama a la API: el pedido se envía en PT-12 al confirmar.
 */
public class CarritoFragment extends Fragment {

    /** Valores de pedido.metodo_pago en la BBDD y la API, con su texto visible. */
    static final String[] METODOS = {"tarjeta", "bizum", "paypal", "en_tienda"};
    static final int[] TEXTOS_METODO = {R.string.pago_tarjeta, R.string.pago_bizum, R.string.pago_paypal,
            R.string.pago_en_tienda};

    private Carrito carrito;
    private LineaCarritoAdapter adaptador;
    private String metodoPago = METODOS[0];

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_carrito, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View vista, @Nullable Bundle savedInstanceState) {
        carrito = Carrito.get(requireContext());

        adaptador = new LineaCarritoAdapter(carrito, this::quitarConDeshacer);
        RecyclerView lista = vista.findViewById(R.id.lista);
        lista.setLayoutManager(new LinearLayoutManager(requireContext()));
        lista.setAdapter(adaptador);

        ChipGroup chips = vista.findViewById(R.id.chipsPago);
        for (int i = 0; i < METODOS.length; i++) {
            Chip chip = new Chip(requireContext());
            chip.setText(TEXTOS_METODO[i]);
            chip.setCheckable(true);
            chip.setChipBackgroundColor(ContextCompat.getColorStateList(requireContext(), R.color.ja_chip_fondo));
            chip.setTag(METODOS[i]);
            chip.setChecked(i == 0);
            chip.setOnCheckedChangeListener((c, marcado) -> {
                if (marcado) {
                    metodoPago = (String) c.getTag();
                }
            });
            chips.addView(chip);
        }

        Button continuar = vista.findViewById(R.id.btnContinuar);
        continuar.setOnClickListener(v -> startActivity(
                new Intent(requireContext(), ConfirmarPedidoActivity.class)
                        .putExtra(ConfirmarPedidoActivity.EXTRA_METODO, metodoPago)));

        EstadoVista estado = new EstadoVista(vista);
        TextView tvArticulos = vista.findViewById(R.id.tvArticulos);
        TextView tvTotal = vista.findViewById(R.id.tvTotal);
        View scroll = vista.findViewById(R.id.scroll);
        View pie = vista.findViewById(R.id.pie);

        // El carrito es un LiveData: cualquier cambio (stepper, quitar, añadir desde la ficha) repinta la pantalla
        carrito.getLineas().observe(getViewLifecycleOwner(), lineas -> {
            adaptador.submitList(lineas);
            boolean vacio = lineas.isEmpty();
            scroll.setVisibility(vacio ? View.GONE : View.VISIBLE);
            pie.setVisibility(vacio ? View.GONE : View.VISIBLE);
            if (vacio) {
                estado.vacio(R.string.carrito_vacio_titulo, R.string.carrito_vacio_texto,
                        R.string.carrito_ir_catalogo, () -> ((MainActivity) requireActivity()).irAInicio());
            } else {
                estado.ocultar();
            }
            int unidades = carrito.unidades();
            tvArticulos.setText(getResources().getQuantityString(R.plurals.articulos, unidades, unidades));
            String total = Formato.precio(carrito.total());
            tvTotal.setText(total);
            continuar.setText(getString(R.string.carrito_continuar, total));
        });
    }

    /** Quitar una línea con «Deshacer» en el snackbar (SCREEN-MAP, PT-11). */
    private void quitarConDeshacer(Carrito.Linea linea) {
        int posicion = carrito.lista().indexOf(linea);
        carrito.quitar(linea);
        Snackbar.make(requireView(), R.string.carrito_quitada, Snackbar.LENGTH_LONG)
                .setAction(R.string.deshacer, v -> carrito.reponer(linea, posicion))
                .show();
    }
}
