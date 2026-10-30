package com.juegalmi.app.ui.pedidos;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.Pagina;
import com.juegalmi.app.data.model.Pedido;
import com.juegalmi.app.data.repository.PedidoRepository;
import com.juegalmi.app.ui.comun.ListaBaseFragment;

import java.util.ArrayList;
import java.util.List;

/** PT-13 Mis pedidos: lista con estado (color + texto + barra de 3) y total. Filtro por estado con chips. */
public class PedidosFragment extends ListaBaseFragment {

    /** null = todos */
    private static final String[] FILTROS = {null, Pedido.PENDIENTE, Pedido.PREPARADO, Pedido.ENTREGADO, Pedido.CANCELADO};
    private static final int[] TEXTOS = {R.string.filtro_todos, R.string.filtro_pendientes, R.string.filtro_preparados,
            R.string.filtro_entregados, R.string.filtro_cancelados};

    private final PedidoAdapter adaptador = new PedidoAdapter(this::abrir);
    private List<Pedido> todos = new ArrayList<>();
    private String filtro = null;

    @Override
    public void onViewCreated(@NonNull View vista, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(vista, savedInstanceState);
        titulo(R.string.menu_pedidos);
        lista.setAdapter(adaptador);
        // Un cliente tiene pocos pedidos: se piden todos una vez y el filtro se aplica en el móvil
        chips(TEXTOS, i -> {
            filtro = FILTROS[i];
            pintar();
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        cargar(); // al volver del detalle (p. ej. tras cancelar) la lista se actualiza
    }

    @Override
    protected void cargar() {
        cargando();
        new PedidoRepository(requireContext()).misPedidos(this, new Callback<Pagina<Pedido>>() {
            @Override
            public void onExito(Pagina<Pedido> pagina) {
                todos = pagina.items;
                pintar();
            }

            @Override
            public void onError(ApiError error) {
                error(R.string.pedidos_error, error);
            }
        });
    }

    private void pintar() {
        List<Pedido> visibles = new ArrayList<>();
        for (Pedido p : todos) {
            if (filtro == null || filtro.equals(p.estado)) {
                visibles.add(p);
            }
        }
        adaptador.submitList(visibles);
        tvResultados.setText(getResources().getQuantityString(R.plurals.pedidos_realizados, visibles.size(), visibles.size()));
        listo(visibles.size(), R.string.pedidos_vacio_titulo, R.string.pedidos_vacio_texto);
    }

    private void abrir(Pedido p) {
        startActivity(new Intent(requireContext(), DetallePedidoActivity.class).putExtra(DetallePedidoActivity.EXTRA_ID, p.id));
    }
}
