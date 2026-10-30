package com.juegalmi.app.ui.catalogo;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityOptionsCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.ConcatAdapter;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.juegalmi.app.R;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Pagina;
import com.juegalmi.app.data.model.Producto;
import com.juegalmi.app.data.repository.ProductoRepository;
import com.juegalmi.app.ui.comun.EstadoVista;
import com.juegalmi.app.ui.detalle.DetalleProductoActivity;
import com.juegalmi.app.ui.inicio.BusquedaViewModel;
import com.juegalmi.app.ui.inicio.CabeceraInicioAdapter;
import com.juegalmi.app.util.AgitarDetector;

/**
 * Catálogo de un tipo de producto: PT-05 (videojuegos), PT-07 (móviles y tablets) y PT-09 (consolas).
 * Lista con RecyclerView + ProductoAdapter, filtros con chips y carga por páginas al llegar al final.
 */
public class CatalogoFragment extends Fragment {

    private static final String ARG_TIPO = "tipo";

    private ProductoRepository repositorio;
    private final ProductoRepository.Filtro filtro = new ProductoRepository.Filtro();
    private ProductoAdapter adaptador;
    /** Solo en la pestaña de videojuegos: carrusel «Para alquilar» y tarjeta de reparaciones (PT-04) */
    @Nullable private CabeceraInicioAdapter cabecera;
    @Nullable private Chip chipAlquilables;
    private CircularProgressIndicator progreso;
    private TextView tvResultados;
    private EstadoVista estado;

    private int pagina = 1;
    private int total = 0;
    private boolean cargando = false;

    public static CatalogoFragment nuevo(String tipo) {
        CatalogoFragment f = new CatalogoFragment();
        Bundle args = new Bundle();
        args.putString(ARG_TIPO, tipo);
        f.setArguments(args);
        return f;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_catalogo, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View vista, @Nullable Bundle savedInstanceState) {
        repositorio = new ProductoRepository(requireContext());
        filtro.tipo = requireArguments().getString(ARG_TIPO, Producto.VIDEOJUEGO);

        progreso = vista.findViewById(R.id.progreso);
        tvResultados = vista.findViewById(R.id.tvResultados);
        estado = new EstadoVista(vista);

        adaptador = new ProductoAdapter(this::abrirDetalle);
        RecyclerView lista = vista.findViewById(R.id.lista);
        LinearLayoutManager gestor = new LinearLayoutManager(requireContext());
        lista.setLayoutManager(gestor);
        if (filtro.tipo.equals(Producto.VIDEOJUEGO)) {
            // ConcatAdapter: la cabecera de Inicio y el catálogo en una sola lista que se desplaza junta
            cabecera = new CabeceraInicioAdapter(new CabeceraInicioAdapter.Acciones() {
                @Override
                public void abrir(Producto producto, ImageView imagen) {
                    abrirDetalle(producto, imagen);
                }

                @Override
                public void verAlquilables() {
                    if (chipAlquilables != null) chipAlquilables.setChecked(true);
                }
            });
            // Etiqueta propia: así, al recargar el catálogo (cancelar(this)) no se cancela el carrusel
            cabecera.cargar(repositorio, cabecera);
            lista.setAdapter(new ConcatAdapter(cabecera, adaptador));
        } else {
            lista.setAdapter(adaptador);
        }
        // Scroll infinito: al ver los 5 últimos, se pide la página siguiente (carga rápida, RNF-03)
        lista.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrolled(@NonNull RecyclerView rv, int dx, int dy) {
                int filas = rv.getAdapter() == null ? 0 : rv.getAdapter().getItemCount();
                if (dy > 0 && !cargando && adaptador.getItemCount() < total
                        && gestor.findLastVisibleItemPosition() >= filas - 5) {
                    cargar(pagina + 1);
                }
            }
        });

        prepararChips(vista.findViewById(R.id.chips));
        // Agitar el móvil recarga el catálogo (RF-15, sensor). Solo mientras se ve la pestaña
        AgitarDetector.vincular(getViewLifecycleOwner(), requireContext(), () -> cargar(1));

        // El buscador de Inicio: al cambiar el texto se recarga desde la página 1
        BusquedaViewModel busqueda = new ViewModelProvider(requireParentFragment()).get(BusquedaViewModel.class);
        busqueda.getTexto().observe(getViewLifecycleOwner(), texto -> {
            filtro.texto = texto;
            cargar(1);
        });
    }

    /** Filtros del diseño: «Solo alquilables» en videojuegos; Todos / Móviles / Tablets en móviles. */
    private void prepararChips(ChipGroup chips) {
        if (filtro.tipo.equals(Producto.VIDEOJUEGO)) {
            Chip alquilables = nuevoChip(chips, R.string.filtro_solo_alquilables);
            chipAlquilables = alquilables;
            alquilables.setOnCheckedChangeListener((c, marcado) -> {
                filtro.soloAlquilables = marcado;
                cargar(1);
            });
        } else if (filtro.tipo.equals(Producto.MOVIL)) {
            chips.setSingleSelection(true);
            chips.setSelectionRequired(true);
            Chip todos = nuevoChip(chips, R.string.filtro_todos);
            Chip moviles = nuevoChip(chips, R.string.filtro_moviles);
            Chip tablets = nuevoChip(chips, R.string.filtro_tablets);
            todos.setChecked(true);
            chips.setOnCheckedStateChangeListener((grupo, ids) -> {
                int id = ids.isEmpty() ? View.NO_ID : ids.get(0);
                filtro.formato = id == moviles.getId() ? Producto.MOVIL : id == tablets.getId() ? "tablet" : null;
                cargar(1);
            });
        } else {
            chips.setVisibility(View.GONE);
        }
    }

    private Chip nuevoChip(ChipGroup grupo, int texto) {
        Chip chip = new Chip(requireContext());
        chip.setText(texto);
        chip.setCheckable(true);
        chip.setChipBackgroundColor(ContextCompat.getColorStateList(requireContext(), R.color.ja_chip_fondo));
        chip.setId(View.generateViewId());
        grupo.addView(chip);
        return chip;
    }

    /** Página 1 = recarga completa (filtro nuevo); siguientes = se añaden al final. */
    private void cargar(int numero) {
        // Si llega otra búsqueda antes de que acabe la anterior, se cancela la anterior
        VolleyClient.get(requireContext()).cancelar(this);
        cargando = true;
        estado.ocultar();
        if (cabecera != null) {
            // Al buscar o filtrar, solo la lista de resultados
            cabecera.mostrar((filtro.texto == null || filtro.texto.isEmpty()) && !filtro.soloAlquilables);
        }
        if (numero == 1) {
            progreso.setVisibility(View.VISIBLE);
        }

        repositorio.listar(filtro, numero, this, new Callback<Pagina<Producto>>() {
            @Override
            public void onExito(Pagina<Producto> resultado) {
                cargando = false;
                progreso.setVisibility(View.GONE);
                pagina = numero;
                total = resultado.total;
                tvResultados.setText(getResources().getQuantityString(R.plurals.catalogo_encontrados,
                        total, total));
                if (numero == 1) {
                    adaptador.submitList(resultado.items);
                } else {
                    adaptador.anadir(resultado.items);
                }
                if (total == 0) {
                    estado.vacio(R.string.catalogo_vacio_titulo, R.string.catalogo_vacio_texto);
                }
            }

            @Override
            public void onError(ApiError error) {
                cargando = false;
                progreso.setVisibility(View.GONE);
                if (numero == 1) {
                    adaptador.submitList(null);
                    tvResultados.setText(null);
                    estado.error(R.string.catalogo_error_titulo, error, () -> cargar(1));
                }
            }
        });
    }

    /** Abre la ficha. La imagen «viaja» de la tarjeta a la ficha (shared element, DESIGN.md §7). */
    private void abrirDetalle(Producto producto, ImageView imagen) {
        Intent intent = DetalleProductoActivity.intent(requireContext(), producto);
        ActivityOptionsCompat opciones = ActivityOptionsCompat.makeSceneTransitionAnimation(
                requireActivity(), imagen, DetalleProductoActivity.TRANSICION_IMAGEN);
        startActivity(intent, opciones.toBundle());
    }

    @Override
    public void onDestroyView() {
        VolleyClient.get(requireContext()).cancelar(this);
        if (cabecera != null) {
            VolleyClient.get(requireContext()).cancelar(cabecera);
        }
        super.onDestroyView();
    }
}
