package com.juegalmi.app.ui.reparaciones;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton;
import com.google.android.material.snackbar.Snackbar;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.Pagina;
import com.juegalmi.app.data.model.Reparacion;
import com.juegalmi.app.data.repository.ReparacionRepository;
import com.juegalmi.app.ui.comun.BarraVida;
import com.juegalmi.app.ui.comun.ListaBaseFragment;
import com.juegalmi.app.ui.comun.Pastilla;
import com.juegalmi.app.util.Fechas;
import com.juegalmi.app.util.Formato;

import java.util.ArrayList;
import java.util.List;

/**
 * PT-18 Mis reparaciones: tarjetas con estado y barra de vida de 4 (recibida → en reparación → lista → entregada),
 * presupuesto y FAB «Nueva reparación». El cliente puede cancelar la suya mientras no esté lista (ADR-035).
 */
public class ReparacionesFragment extends ListaBaseFragment {

    private static final int[] FILTROS = {R.string.filtro_todas, R.string.filtro_activas, R.string.filtro_finalizadas};

    private final Adaptador adaptador = new Adaptador();
    private List<Reparacion> todas = new ArrayList<>();
    private int filtro = 0;

    @Override
    public void onViewCreated(@NonNull View vista, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(vista, savedInstanceState);
        titulo(R.string.menu_reparaciones);
        lista.setAdapter(adaptador);
        chips(FILTROS, i -> {
            filtro = i;
            pintar();
        });

        ExtendedFloatingActionButton fab = vista.findViewById(R.id.fab);
        fab.setVisibility(View.VISIBLE);
        fab.setText(R.string.reparacion_nueva_titulo);
        fab.setIconResource(R.drawable.ic_build);
        fab.setOnClickListener(v -> startActivity(new Intent(requireContext(), NuevaReparacionActivity.class)));
        // El FAB se encoge al bajar por la lista para no tapar las tarjetas (DESIGN.md §9)
        lista.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrolled(@NonNull RecyclerView rv, int dx, int dy) {
                if (dy > 0) fab.shrink();
                else if (dy < 0) fab.extend();
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        cargar(); // al volver de «Nueva reparación» aparece la recién creada
    }

    @Override
    protected void cargar() {
        cargando();
        new ReparacionRepository(requireContext()).misReparaciones(this, new Callback<Pagina<Reparacion>>() {
            @Override
            public void onExito(Pagina<Reparacion> pagina) {
                todas = pagina.items;
                pintar();
            }

            @Override
            public void onError(ApiError error) {
                error(R.string.reparaciones_error, error);
            }
        });
    }

    private void pintar() {
        List<Reparacion> visibles = new ArrayList<>();
        for (Reparacion r : todas) {
            if (filtro == 0 || (filtro == 1) == r.activa()) {
                visibles.add(r);
            }
        }
        adaptador.submitList(visibles);
        tvResultados.setText(getResources().getQuantityString(R.plurals.reparaciones_n, visibles.size(), visibles.size()));
        listo(visibles.size(), R.string.reparaciones_vacio_titulo, R.string.reparaciones_vacio_texto);
    }

    private void confirmarCancelacion(Reparacion r) {
        new MaterialAlertDialogBuilder(requireContext(), R.style.ThemeOverlay_JuegAlmi_Dialogo)
                .setTitle(getString(R.string.cancelar_reparacion_titulo, r.referencia()))
                .setMessage(R.string.cancelar_reparacion_texto)
                .setNegativeButton(R.string.volver, null)
                .setPositiveButton(R.string.reparacion_cancelar, (d, w) ->
                        new ReparacionRepository(requireContext()).cancelar(r.id, new Callback<Reparacion>() {
                            @Override
                            public void onExito(Reparacion cancelada) {
                                if (isAdded()) cargar();
                            }

                            @Override
                            public void onError(ApiError error) {
                                if (isAdded()) Snackbar.make(requireView(), error.mensaje, Snackbar.LENGTH_LONG).show();
                            }
                        }))
                .show();
    }

    /** Paso de la barra de 4. Cancelada = 0 (con el contorno rojo de la pastilla). */
    private static int paso(String estado) {
        switch (estado) {
            case Reparacion.RECIBIDA: return 1;
            case Reparacion.EN_REPARACION: return 2;
            case Reparacion.LISTA: return 3;
            case Reparacion.ENTREGADA: return 4;
            default: return 0;
        }
    }

    private class Adaptador extends ListAdapter<Reparacion, Adaptador.Tarjeta> {

        Adaptador() {
            super(new DiffUtil.ItemCallback<Reparacion>() {
                @Override
                public boolean areItemsTheSame(@NonNull Reparacion a, @NonNull Reparacion b) {
                    return a.id == b.id;
                }

                @Override
                public boolean areContentsTheSame(@NonNull Reparacion a, @NonNull Reparacion b) {
                    return a.estado.equals(b.estado);
                }
            });
        }

        @NonNull
        @Override
        public Tarjeta onCreateViewHolder(@NonNull ViewGroup padre, int tipo) {
            return new Tarjeta(LayoutInflater.from(padre.getContext()).inflate(R.layout.item_reparacion, padre, false));
        }

        @Override
        public void onBindViewHolder(@NonNull Tarjeta t, int posicion) {
            Reparacion r = getItem(posicion);
            var c = t.itemView.getContext();
            int color = Pastilla.colorReparacion(r.estado);
            Pastilla.pintar(t.departamento, R.color.ja_marca, r.departamento == null ? "" : r.departamento.nombre);
            Pastilla.pintar(t.estado, color, Pastilla.texto(c, r.estado));
            t.dispositivo.setText(r.dispositivo);
            t.referencia.setText(r.referencia());
            t.problema.setText(r.problema);
            t.fecha.setText(r.fechaSalida != null
                    ? c.getString(R.string.reparacion_salida, Fechas.fechaHora(r.fechaSalida))
                    : c.getString(R.string.reparacion_entrada, Fechas.fechaHora(r.fechaEntrada)));
            t.barra.mostrar(4, paso(r.estado), color);
            t.presupuesto.setText(r.presupuesto == null ? c.getString(R.string.pendiente) : Formato.precio(r.presupuesto));
            // Cancelada: tarjeta atenuada (como el «agotado»)
            t.contenido.setAlpha(Reparacion.CANCELADA.equals(r.estado) ? 0.6f : 1f);
            boolean cancelable = Reparacion.RECIBIDA.equals(r.estado) || Reparacion.EN_REPARACION.equals(r.estado);
            t.cancelar.setVisibility(cancelable ? View.VISIBLE : View.GONE);
            t.cancelar.setOnClickListener(v -> confirmarCancelacion(r));
        }

        class Tarjeta extends RecyclerView.ViewHolder {
            final View contenido;
            final TextView departamento;
            final TextView estado;
            final TextView dispositivo;
            final TextView referencia;
            final TextView problema;
            final TextView fecha;
            final BarraVida barra;
            final TextView presupuesto;
            final View cancelar;

            Tarjeta(View v) {
                super(v);
                contenido = v.findViewById(R.id.contenido);
                departamento = v.findViewById(R.id.tvDepartamento);
                estado = v.findViewById(R.id.tvEstado);
                dispositivo = v.findViewById(R.id.tvDispositivo);
                referencia = v.findViewById(R.id.tvReferencia);
                problema = v.findViewById(R.id.tvProblema);
                fecha = v.findViewById(R.id.tvFecha);
                barra = v.findViewById(R.id.barra);
                presupuesto = v.findViewById(R.id.tvPresupuesto);
                cancelar = v.findViewById(R.id.btnCancelar);
            }
        }
    }
}
