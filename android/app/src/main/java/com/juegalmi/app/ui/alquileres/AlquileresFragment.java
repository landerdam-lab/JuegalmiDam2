package com.juegalmi.app.ui.alquileres;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.google.android.material.tabs.TabLayout;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.Alquiler;
import com.juegalmi.app.data.model.Pagina;
import com.juegalmi.app.data.repository.PedidoRepository;
import com.juegalmi.app.ui.comun.BarraVida;
import com.juegalmi.app.ui.comun.ListaBaseFragment;
import com.juegalmi.app.ui.comun.Pastilla;
import com.juegalmi.app.util.Fechas;
import com.juegalmi.app.util.Formato;

import java.util.Objects;

/**
 * PT-16 Mis alquileres: pestañas Activos / Retrasados / Devueltos (GET /api/alquileres?estado=).
 * Cada tarjeta lleva la cuenta atrás y una barra de 5 que se vacía según pasan los días.
 * La devolución se registra en la tienda (la hace el admin, ADR-035).
 */
public class AlquileresFragment extends ListaBaseFragment {

    private static final String[] ESTADOS = {Alquiler.ACTIVO, Alquiler.RETRASADO, Alquiler.DEVUELTO};
    private static final int[] PESTANAS = {R.string.pestana_activos, R.string.pestana_retrasados, R.string.pestana_devueltos};
    private static final int SEGMENTOS = 5;

    private final Adaptador adaptador = new Adaptador();
    private String estadoElegido = Alquiler.ACTIVO;

    @Override
    public void onViewCreated(@NonNull View vista, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(vista, savedInstanceState);
        titulo(R.string.menu_alquileres);
        lista.setAdapter(adaptador);

        TabLayout pestanas = vista.findViewById(R.id.pestanas);
        pestanas.setVisibility(View.VISIBLE);
        for (int t : PESTANAS) {
            pestanas.addTab(pestanas.newTab().setText(t));
        }
        pestanas.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                estadoElegido = ESTADOS[tab.getPosition()];
                cargar();
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {
            }

            @Override
            public void onTabReselected(TabLayout.Tab tab) {
            }
        });
        cargar();
    }

    @Override
    protected void cargar() {
        cargando();
        new PedidoRepository(requireContext()).misAlquileres(estadoElegido, this, new Callback<Pagina<Alquiler>>() {
            @Override
            public void onExito(Pagina<Alquiler> pagina) {
                adaptador.submitList(pagina.items);
                tvResultados.setText(getString(R.string.alquileres_aviso_tienda));
                listo(pagina.items.size(), R.string.alquileres_vacio_titulo, R.string.alquileres_vacio_texto);
            }

            @Override
            public void onError(ApiError error) {
                error(R.string.alquileres_error, error);
            }
        });
    }

    private static class Adaptador extends ListAdapter<Alquiler, Adaptador.Tarjeta> {

        Adaptador() {
            super(new DiffUtil.ItemCallback<Alquiler>() {
                @Override
                public boolean areItemsTheSame(@NonNull Alquiler a, @NonNull Alquiler b) {
                    return a.id == b.id;
                }

                @Override
                public boolean areContentsTheSame(@NonNull Alquiler a, @NonNull Alquiler b) {
                    return a.estado.equals(b.estado) && Objects.equals(a.fechaDevolucion, b.fechaDevolucion);
                }
            });
        }

        @NonNull
        @Override
        public Tarjeta onCreateViewHolder(@NonNull ViewGroup padre, int tipo) {
            return new Tarjeta(LayoutInflater.from(padre.getContext()).inflate(R.layout.item_alquiler, padre, false));
        }

        @Override
        public void onBindViewHolder(@NonNull Tarjeta t, int posicion) {
            Alquiler a = getItem(posicion);
            var c = t.itemView.getContext();
            int color = Pastilla.colorAlquiler(a.estado);
            t.nombre.setText(a.videojuego.nombre);
            t.plataforma.setText(a.videojuego.plataforma == null ? "" : a.videojuego.plataforma.nombre);
            Pastilla.pintar(t.estado, color, Pastilla.texto(c, a.estado));
            t.fechas.setText(c.getString(R.string.rango_fechas, Fechas.corta(a.fechaInicio), Fechas.corta(a.fechaFin)));
            t.importe.setText(Formato.precio(a.subtotal));

            // Cuenta atrás y barra: llena el primer día, vacía el día de devolver
            long quedan = Fechas.diasHasta(a.fechaFin);
            int llenos = 0;
            String cuenta;
            if (Alquiler.ACTIVO.equals(a.estado)) {
                llenos = (int) Math.max(1, Math.round(SEGMENTOS * Math.min(quedan, a.dias) / (double) a.dias));
                cuenta = quedan <= 0 ? c.getString(R.string.alquiler_devolver_hoy)
                        : c.getResources().getQuantityString(R.plurals.alquiler_quedan, (int) quedan, (int) quedan);
                if (quedan <= 1) {
                    color = R.color.ja_aviso; // último día: aviso
                }
            } else if (Alquiler.RETRASADO.equals(a.estado)) {
                cuenta = c.getResources().getQuantityString(R.plurals.alquiler_retraso, (int) -quedan, (int) -quedan);
                llenos = SEGMENTOS;
            } else {
                cuenta = a.fechaDevolucion == null ? Pastilla.texto(c, a.estado)
                        : c.getString(R.string.alquiler_devuelto_el, Fechas.fecha(a.fechaDevolucion));
            }
            t.cuenta.setText(cuenta);
            t.cuenta.setTextColor(ContextCompat.getColor(c, color));
            t.barra.mostrar(SEGMENTOS, llenos, color);

            Glide.with(t.imagen).load(a.videojuego.imagen).placeholder(R.drawable.placeholder_imagen)
                    .error(R.drawable.placeholder_error).centerCrop().into(t.imagen);
        }

        static class Tarjeta extends RecyclerView.ViewHolder {
            final ImageView imagen;
            final TextView plataforma;
            final TextView estado;
            final TextView nombre;
            final TextView cuenta;
            final BarraVida barra;
            final TextView fechas;
            final TextView importe;

            Tarjeta(View v) {
                super(v);
                imagen = v.findViewById(R.id.ivImagen);
                plataforma = v.findViewById(R.id.tvPlataforma);
                estado = v.findViewById(R.id.tvEstado);
                nombre = v.findViewById(R.id.tvNombre);
                cuenta = v.findViewById(R.id.tvCuenta);
                barra = v.findViewById(R.id.barra);
                fechas = v.findViewById(R.id.tvFechas);
                importe = v.findViewById(R.id.tvImporte);
            }
        }
    }
}
