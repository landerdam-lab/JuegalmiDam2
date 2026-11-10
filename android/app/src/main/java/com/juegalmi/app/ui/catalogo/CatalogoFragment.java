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
import androidx.recyclerview.widget.GridLayoutManager;
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
import com.juegalmi.app.data.model.Referencia;
import com.juegalmi.app.data.repository.ProductoRepository;
import com.juegalmi.app.ui.comun.EstadoVista;
import com.juegalmi.app.ui.detalle.DetalleProductoActivity;
import com.juegalmi.app.ui.inicio.BusquedaViewModel;
import com.juegalmi.app.ui.inicio.CabeceraInicioAdapter;
import com.juegalmi.app.util.AgitarDetector;

import java.util.ArrayList;
import java.util.List;

/**
 * Catálogo de un tipo de producto: PT-05 (videojuegos), PT-07 (móviles y tablets) y PT-09 (consolas).
 * Lista con RecyclerView + ProductoAdapter, filtros con chips y carga por páginas al llegar al final.
 */
public class CatalogoFragment extends Fragment {

    private static final String ARG_TIPO = "tipo";

    private ProductoRepository repositorio;
    /** Vive en un ViewModel: al girar la pantalla se recrea el fragmento, pero los filtros elegidos se conservan */
    private ProductoRepository.Filtro filtro;
    private ProductoAdapter adaptador;
    /** Solo en la pestaña de videojuegos: carrusel «Para alquilar» y tarjeta de reparaciones (PT-04) */
    @Nullable private CabeceraInicioAdapter cabecera;
    @Nullable private Chip chipAlquilables;
    @Nullable private Chip quitarFiltros;
    /**
     * Etiqueta propia para las opciones de los filtros: cargar() cancela las peticiones de «this» al cambiar de
     * filtro, y no debe cancelar también las de marcas, plataformas y géneros.
     */
    private final Object etiquetaOpciones = new Object();
    /** Valores de videojuego.pegi (los mismos que el CHECK de la BBDD) */
    private static final int[] PEGI = {3, 7, 12, 16, 18};
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
        filtro = new ViewModelProvider(this).get(FiltroViewModel.class).filtro;
        filtro.tipo = requireArguments().getString(ARG_TIPO, Producto.VIDEOJUEGO);

        progreso = vista.findViewById(R.id.progreso);
        tvResultados = vista.findViewById(R.id.tvResultados);
        estado = new EstadoVista(vista);

        adaptador = new ProductoAdapter(this::abrirDetalle);
        RecyclerView lista = vista.findViewById(R.id.lista);
        // Cuadrícula: 1 columna en el móvil y 2-4 en pantallas anchas (res/values-wNNNdp/adaptativo.xml)
        GridLayoutManager gestor = new GridLayoutManager(requireContext(),
                getResources().getInteger(R.integer.columnas_lista));
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
            // La cabecera ocupa toda la fila; los productos, una columna cada uno
            final CabeceraInicioAdapter cab = cabecera;
            gestor.setSpanSizeLookup(new GridLayoutManager.SpanSizeLookup() {
                @Override
                public int getSpanSize(int posicion) {
                    return posicion < cab.getItemCount() ? gestor.getSpanCount() : 1;
                }
            });
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
        AgitarDetector.vincular(getViewLifecycleOwner(), vista, () -> cargar(1));

        // El buscador de Inicio: al cambiar el texto se recarga desde la página 1
        BusquedaViewModel busqueda = new ViewModelProvider(requireParentFragment()).get(BusquedaViewModel.class);
        busqueda.getTexto().observe(getViewLifecycleOwner(), texto -> {
            filtro.texto = texto;
            cargar(1);
        });
    }

    /**
     * Filtros del catálogo (todos los aplica la API, que es quien sabe qué hay):
     * - Videojuegos: Solo alquilables · Plataforma · Género · PEGI · Marca · Ordenar
     * - Móviles y tablets: Todos / Móviles / Tablets · Marca · Ordenar
     * - Consolas: Marca · Ordenar
     * Las opciones de plataforma, marca y género vienen de la API; PEGI son los 5 valores de la BBDD (CHECK).
     * Si hay algún filtro puesto aparece «Quitar filtros».
     */
    private void prepararChips(ChipGroup chips) {
        List<ChipDesplegable> desplegables = new ArrayList<>();
        Chip quitar = nuevoChip(chips, R.string.filtro_quitar);
        quitar.setCheckable(false);
        quitar.setChipIconResource(R.drawable.ic_close);
        quitar.setChipIconVisible(true);
        quitar.setVisibility(View.GONE);
        quitarFiltros = quitar;

        if (filtro.tipo.equals(Producto.VIDEOJUEGO)) {
            Chip alquilables = nuevoChip(chips, R.string.filtro_solo_alquilables);
            chipAlquilables = alquilables;
            alquilables.setChecked(filtro.soloAlquilables);
            alquilables.setOnCheckedChangeListener((c, marcado) -> {
                filtro.soloAlquilables = marcado;
                cargar(1);
            });

            ChipDesplegable plataforma = new ChipDesplegable(chips, getString(R.string.filtro_plataforma),
                    getString(R.string.filtro_todas), valor -> {
                filtro.plataformaId = (Integer) valor;
                cargar(1);
            });
            repositorio.plataformas(etiquetaOpciones, opcionesDe(plataforma, filtro.plataformaId));
            desplegables.add(plataforma);

            ChipDesplegable genero = new ChipDesplegable(chips, getString(R.string.filtro_genero),
                    getString(R.string.filtro_todos), valor -> {
                filtro.genero = (String) valor;
                cargar(1);
            });
            if (filtro.genero != null) genero.mostrar(filtro.genero, true);
            repositorio.generos(etiquetaOpciones, new Callback<List<String>>() {
                @Override
                public void onExito(List<String> lista) {
                    List<ChipDesplegable.Opcion> o = new ArrayList<>();
                    for (String g : lista) o.add(new ChipDesplegable.Opcion(g, g));
                    genero.opciones(o);
                }

                @Override
                public void onError(ApiError error) {
                    // Sin opciones el chip no se abre; el resto del catálogo sigue funcionando
                }
            });
            desplegables.add(genero);

            ChipDesplegable pegi = new ChipDesplegable(chips, getString(R.string.filtro_pegi),
                    getString(R.string.filtro_todos), valor -> {
                filtro.pegi = (Integer) valor;
                cargar(1);
            });
            List<ChipDesplegable.Opcion> edades = new ArrayList<>();
            for (int edad : PEGI) edades.add(new ChipDesplegable.Opcion(String.valueOf(edad), edad));
            pegi.opciones(edades);
            if (filtro.pegi != null) pegi.mostrar(String.valueOf(filtro.pegi), true);
            desplegables.add(pegi);
        } else if (filtro.tipo.equals(Producto.MOVIL)) {
            chips.setSingleSelection(true);
            chips.setSelectionRequired(true);
            Chip todos = nuevoChip(chips, R.string.filtro_todos);
            Chip moviles = nuevoChip(chips, R.string.filtro_moviles);
            Chip tablets = nuevoChip(chips, R.string.filtro_tablets);
            (Producto.MOVIL.equals(filtro.formato) ? moviles : "tablet".equals(filtro.formato) ? tablets : todos).setChecked(true);
            chips.setOnCheckedStateChangeListener((grupo, ids) -> {
                int id = ids.isEmpty() ? View.NO_ID : ids.get(0);
                filtro.formato = id == moviles.getId() ? Producto.MOVIL : id == tablets.getId() ? "tablet" : null;
                cargar(1);
            });
        }

        ChipDesplegable marca = new ChipDesplegable(chips, getString(R.string.filtro_marca),
                getString(R.string.filtro_todas), valor -> {
            filtro.marcaId = (Integer) valor;
            cargar(1);
        });
        repositorio.marcas(etiquetaOpciones, opcionesDe(marca, filtro.marcaId));
        desplegables.add(marca);

        // Ordenar no tiene opción vacía: siempre hay un orden (nombre por defecto)
        ChipDesplegable orden = new ChipDesplegable(chips, getString(R.string.filtro_ordenar), null, valor -> {
            filtro.orden = (String) valor;
            cargar(1);
        });
        List<ChipDesplegable.Opcion> ordenes = new ArrayList<>();
        ordenes.add(new ChipDesplegable.Opcion(getString(R.string.orden_nombre), ProductoRepository.ORDEN_NOMBRE));
        ordenes.add(new ChipDesplegable.Opcion(getString(R.string.orden_precio_asc), ProductoRepository.ORDEN_PRECIO_ASC));
        ordenes.add(new ChipDesplegable.Opcion(getString(R.string.orden_precio_desc), ProductoRepository.ORDEN_PRECIO_DESC));
        orden.opciones(ordenes);
        orden.mostrar(textoOrden(), !ProductoRepository.ORDEN_NOMBRE.equals(filtro.orden));

        quitar.setOnClickListener(v -> {
            filtro.quitarFiltros();
            for (ChipDesplegable d : desplegables) d.reiniciar();
            orden.mostrar(getString(R.string.orden_nombre), false);
            if (chipAlquilables != null) chipAlquilables.setChecked(false);
            cargar(1);
        });
    }

    /** Callback que convierte una lista {id, nombre} de la API en las opciones de un desplegable. */
    private String textoOrden() {
        if (ProductoRepository.ORDEN_PRECIO_ASC.equals(filtro.orden)) return getString(R.string.orden_precio_asc);
        if (ProductoRepository.ORDEN_PRECIO_DESC.equals(filtro.orden)) return getString(R.string.orden_precio_desc);
        return getString(R.string.orden_nombre);
    }

    private Callback<List<Referencia>> opcionesDe(ChipDesplegable chip, @Nullable Integer elegido) {
        return new Callback<List<Referencia>>() {
            @Override
            public void onExito(List<Referencia> lista) {
                List<ChipDesplegable.Opcion> o = new ArrayList<>();
                for (Referencia r : lista) o.add(new ChipDesplegable.Opcion(r.nombre, r.id));
                chip.opciones(o);
                // Tras girar la pantalla, el chip vuelve a mostrar lo que estaba elegido
                for (Referencia r : lista) {
                    if (elegido != null && elegido == r.id) chip.mostrar(r.nombre, true);
                }
            }

            @Override
            public void onError(ApiError error) {
                // Sin opciones el chip no se abre; el resto del catálogo sigue funcionando
            }
        };
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
        if (quitarFiltros != null) {
            quitarFiltros.setVisibility(filtro.hayFiltros() ? View.VISIBLE : View.GONE);
        }
        if (cabecera != null) {
            // Al buscar o filtrar, solo la lista de resultados
            cabecera.mostrar((filtro.texto == null || filtro.texto.isEmpty()) && !filtro.hayFiltros());
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
        VolleyClient.get(requireContext()).cancelar(etiquetaOpciones);
        if (cabecera != null) {
            VolleyClient.get(requireContext()).cancelar(cabecera);
        }
        super.onDestroyView();
    }
}
