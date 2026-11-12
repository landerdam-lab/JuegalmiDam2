package com.juegalmi.app.ui.tienda;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Servicio;
import com.juegalmi.app.data.repository.TiendaRepository;
import com.juegalmi.app.ui.comun.EstadoVista;
import com.juegalmi.app.ui.reparaciones.NuevaReparacionActivity;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.Formato;

import java.util.ArrayList;
import java.util.List;

public class ServiciosActivity extends AppCompatActivity {

    private static final String[] LINEAS = {"videojuegos", "consolas", "telefonia"};
    private static final int[] TITULOS = {R.string.pestana_videojuegos, R.string.pestana_consolas, R.string.linea_telefonia};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_servicios);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        Bordes.aplicar(toolbar, true, false);
        Bordes.aplicar(findViewById(R.id.pie), false, true);
        toolbar.setNavigationOnClickListener(v -> finish());

        ViewPager2 paginas = findViewById(R.id.paginas);
        paginas.setAdapter(new FragmentStateAdapter(this) {
            @NonNull
            @Override
            public Fragment createFragment(int posicion) {
                return PestanaServicios.nueva(LINEAS[posicion]);
            }

            @Override
            public int getItemCount() {
                return LINEAS.length;
            }
        });
        new TabLayoutMediator((TabLayout) findViewById(R.id.pestanas), paginas,
                (tab, pos) -> tab.setText(TITULOS[pos])).attach();

        findViewById(R.id.btnSolicitar).setOnClickListener(v ->
                startActivity(new Intent(this, NuevaReparacionActivity.class)));
    }

    public static class PestanaServicios extends Fragment {

        private static final String ARG_LINEA = "linea";

        static PestanaServicios nueva(String linea) {
            PestanaServicios f = new PestanaServicios();
            Bundle b = new Bundle();
            b.putString(ARG_LINEA, linea);
            f.setArguments(b);
            return f;
        }

        @Nullable
        @Override
        public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                                 @Nullable Bundle savedInstanceState) {
            return inflater.inflate(R.layout.fragment_catalogo, container, false);
        }

        @Override
        public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
            v.findViewById(R.id.chips).setVisibility(View.GONE);
            RecyclerView lista = v.findViewById(R.id.lista);
            lista.setLayoutManager(new GridLayoutManager(requireContext(),
                    getResources().getInteger(R.integer.columnas_lista)));
            cargar(v, lista);
        }

        private void cargar(View v, RecyclerView lista) {
            EstadoVista estado = new EstadoVista(v);
            estado.ocultar();
            View progreso = v.findViewById(R.id.progreso);
            TextView resultados = v.findViewById(R.id.tvResultados);
            progreso.setVisibility(View.VISIBLE);
            new TiendaRepository(requireContext()).servicios(requireArguments().getString(ARG_LINEA), this,
                    new Callback<List<Servicio>>() {
                        @Override
                        public void onExito(List<Servicio> servicios) {
                            progreso.setVisibility(View.GONE);
                            resultados.setText(getResources().getQuantityString(R.plurals.servicios_n,
                                    servicios.size(), servicios.size()));
                            lista.setAdapter(new Adaptador(servicios));
                            if (servicios.isEmpty()) {
                                estado.vacio(R.string.servicios_vacio_titulo, R.string.servicios_vacio_texto);
                            }
                        }

                        @Override
                        public void onError(ApiError error) {
                            progreso.setVisibility(View.GONE);
                            estado.error(R.string.tienda_error, error, () -> cargar(v, lista));
                        }
                    });
        }

        @Override
        public void onDestroyView() {
            VolleyClient.get(requireContext()).cancelar(this);
            super.onDestroyView();
        }
    }

    private static class Adaptador extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
        private final List<Servicio> servicios;

        Adaptador(List<Servicio> servicios) {
            this.servicios = new ArrayList<>(servicios);
        }

        @NonNull
        @Override
        public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup padre, int tipo) {
            return new RecyclerView.ViewHolder(LayoutInflater.from(padre.getContext())
                    .inflate(R.layout.item_servicio, padre, false)) { };
        }

        @Override
        public void onBindViewHolder(@NonNull RecyclerView.ViewHolder h, int pos) {
            Servicio s = servicios.get(pos);
            View v = h.itemView;
            ((TextView) v.findViewById(R.id.tvNombre)).setText(s.nombre);
            ((TextView) v.findViewById(R.id.tvDescripcion)).setText(s.descripcion);
            ((TextView) v.findViewById(R.id.tvPrecio)).setText(s.precioOrientativo == null
                    ? v.getContext().getString(R.string.servicio_consultar)
                    : v.getContext().getString(R.string.servicio_desde, Formato.precio(s.precioOrientativo)));
        }

        @Override
        public int getItemCount() {
            return servicios.size();
        }
    }
}
