package com.juegalmi.app.ui.detalle;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.animation.AnimationUtils;
import android.widget.Button;
import android.widget.GridLayout;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import com.bumptech.glide.Glide;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.snackbar.Snackbar;
import com.juegalmi.app.MainActivity;
import com.juegalmi.app.R;
import com.juegalmi.app.data.Carrito;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.VolleyClient;
import com.juegalmi.app.data.model.Producto;
import com.juegalmi.app.data.repository.ProductoRepository;
import com.juegalmi.app.ui.comun.BarraVida;
import com.juegalmi.app.ui.comun.EstadoStock;
import com.juegalmi.app.ui.comun.EstadoVista;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.Formato;

/**
 * Ficha de un producto: PT-06 (videojuego), PT-08 (móvil/tablet) y PT-10 (consola).
 * Una sola pantalla para los tres tipos: lo que no aplica se oculta (los consolas y móviles no se alquilan, ADR-029).
 * Pide el detalle a la API (GET /api/{tipo}/{id}) para tener el stock y las copias al día.
 */
public class DetalleProductoActivity extends AppCompatActivity implements AlquilarHoja.AlAnadir {

    public static final String TRANSICION_IMAGEN = "imagen_producto";
    private static final String EXTRA_TIPO = "tipo";
    private static final String EXTRA_ID = "id";
    private static final String EXTRA_NOMBRE = "nombre";
    private static final String EXTRA_IMAGEN = "imagen";
    /** Segmentos de la barra de copias (DESIGN.md: 5 para alquiler y copias) */
    private static final int SEGMENTOS_COPIAS = 5;

    private ProductoRepository repositorio;
    private EstadoVista estado;
    private CircularProgressIndicator progreso;
    private View scroll;

    /** Lo que ya sabemos del catálogo, para pintar la cabecera al instante mientras llega el detalle. */
    public static Intent intent(Context context, Producto p) {
        return new Intent(context, DetalleProductoActivity.class)
                .putExtra(EXTRA_TIPO, p.tipo)
                .putExtra(EXTRA_ID, p.id)
                .putExtra(EXTRA_NOMBRE, p.nombre)
                .putExtra(EXTRA_IMAGEN, p.imagen);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_detalle);

        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        Bordes.aplicar(toolbar, true, false);
        scroll = findViewById(R.id.scroll);
        Bordes.aplicar(scroll, false, true);
        toolbar.setNavigationOnClickListener(v -> getOnBackPressedDispatcher().onBackPressed());
        toolbar.setOnMenuItemClickListener(item -> {
            verCarrito();
            return true;
        });

        repositorio = new ProductoRepository(this);
        estado = new EstadoVista(findViewById(android.R.id.content));
        progreso = findViewById(R.id.progreso);

        // Cabecera inmediata con los datos de la tarjeta (la imagen ya está en la caché de Glide)
        ((TextView) findViewById(R.id.tvNombre)).setText(getIntent().getStringExtra(EXTRA_NOMBRE));
        cargarImagen(getIntent().getStringExtra(EXTRA_IMAGEN), getIntent().getStringExtra(EXTRA_NOMBRE));

        cargar();
    }

    private void cargar() {
        String tipo = getIntent().getStringExtra(EXTRA_TIPO);
        int id = getIntent().getIntExtra(EXTRA_ID, 0);
        estado.ocultar();
        progreso.setVisibility(View.VISIBLE);
        repositorio.detalle(tipo, id, this, new Callback<Producto>() {
            @Override
            public void onExito(Producto producto) {
                progreso.setVisibility(View.GONE);
                scroll.setVisibility(View.VISIBLE);
                pintar(producto);
            }

            @Override
            public void onError(ApiError error) {
                progreso.setVisibility(View.GONE);
                scroll.setVisibility(View.GONE);
                estado.error(R.string.catalogo_error_titulo, error, () -> cargar());
            }
        });
    }

    private void pintar(Producto p) {
        ((TextView) findViewById(R.id.tvNombre)).setText(p.nombre);
        ((TextView) findViewById(R.id.tvSubtitulo)).setText(subtitulo(p));
        ((TextView) findViewById(R.id.tvDescripcion)).setText(p.descripcion);
        cargarImagen(p.imagen, p.nombre);

        TextView tvEstado = findViewById(R.id.tvEstado);
        EstadoStock.pintar(tvEstado, p);
        if (p.stock > EstadoStock.ULTIMAS) {
            tvEstado.setText(getString(R.string.detalle_en_stock_uds, p.stock));
        }

        Button comprar = findViewById(R.id.btnComprar);
        comprar.setText(getString(R.string.detalle_comprar, Formato.precio(p.precio)));
        comprar.setEnabled(p.stock > 0);
        // Desactivado = atenuado: el estilo del botón tiene el amarillo fijo y no cambia solo (DESIGN.md §9)
        comprar.setAlpha(p.stock > 0 ? 1f : 0.4f);
        comprar.setOnClickListener(v -> comprar(p, v));

        pintarAlquiler(p);
        pintarDatos(p);
    }

    /** Caja de alquiler: solo videojuegos. Barra de 5 segmentos con la proporción de copias libres. */
    private void pintarAlquiler(Producto p) {
        View caja = findViewById(R.id.cajaAlquiler);
        Button alquilar = findViewById(R.id.btnAlquilar);
        boolean seAlquila = p.esVideojuego() && p.copiasAlquiler != null && p.copiasAlquiler > 0;
        caja.setVisibility(seAlquila ? View.VISIBLE : View.GONE);
        alquilar.setVisibility(seAlquila ? View.VISIBLE : View.GONE);
        if (!seAlquila) {
            return;
        }
        int total = p.copiasAlquiler;
        int libres = p.copiasDisponibles != null ? p.copiasDisponibles : 0;
        ((TextView) findViewById(R.id.tvPrecioAlquiler)).setText(Formato.precio(p.precioAlquiler));
        ((BarraVida) findViewById(R.id.barraCopias)).mostrar(SEGMENTOS_COPIAS,
                Math.round(SEGMENTOS_COPIAS * libres / (float) total), R.color.ja_alquiler);
        ((TextView) findViewById(R.id.tvCopias)).setText(libres > 0
                ? getString(R.string.detalle_copias, libres, total)
                : getString(R.string.detalle_sin_copias));
        // Sin copias: «Alquilar» desactivado y el motivo escrito debajo de la barra (SCREEN-MAP, PT-06)
        alquilar.setEnabled(libres > 0);
        alquilar.setAlpha(libres > 0 ? 1f : 0.4f);
        alquilar.setOnClickListener(v -> AlquilarHoja.nueva(p).show(getSupportFragmentManager(), AlquilarHoja.TAG));
    }

    /** Detalles en dos columnas, según el tipo. Solo campos que existen en el modelo (A-08). */
    private void pintarDatos(Producto p) {
        GridLayout grid = findViewById(R.id.gridDatos);
        grid.removeAllViews();
        if (p.esVideojuego()) {
            dato(grid, R.string.detalle_genero, p.genero);
            dato(grid, R.string.pegi_titulo, p.pegi == null ? null : String.valueOf(p.pegi));
            dato(grid, R.string.detalle_plataforma, p.plataforma == null ? null : p.plataforma.nombre);
        } else if (Producto.MOVIL.equals(p.tipo)) {
            dato(grid, R.string.detalle_formato, p.formato == null ? null
                    : getString(Producto.MOVIL.equals(p.formato) ? R.string.filtro_moviles : R.string.filtro_tablets));
            dato(grid, R.string.detalle_pantalla, p.pantallaPulgadas == null ? null
                    : getString(R.string.detalle_pulgadas, Formato.decimal(p.pantallaPulgadas)));
            dato(grid, R.string.detalle_ram, p.ramGb == null ? null : getString(R.string.detalle_gb, p.ramGb));
            dato(grid, R.string.detalle_almacenamiento, p.almacenamientoGb == null ? null
                    : getString(R.string.detalle_gb, p.almacenamientoGb));
        } else {
            dato(grid, R.string.detalle_modelo, p.modelo);
            dato(grid, R.string.detalle_almacenamiento, p.almacenamientoGb == null ? null
                    : getString(R.string.detalle_gb, p.almacenamientoGb));
        }
        dato(grid, R.string.detalle_marca, p.marca == null ? null : p.marca.nombre);
    }

    private void dato(GridLayout grid, int etiqueta, String valor) {
        if (valor == null) {
            return;
        }
        View celda = LayoutInflater.from(this).inflate(R.layout.item_dato, grid, false);
        ((TextView) celda.findViewById(R.id.tvEtiqueta)).setText(etiqueta);
        ((TextView) celda.findViewById(R.id.tvValor)).setText(valor);
        // Columna con peso 1: las dos columnas miden lo mismo
        GridLayout.LayoutParams lp = new GridLayout.LayoutParams(GridLayout.spec(GridLayout.UNDEFINED),
                GridLayout.spec(GridLayout.UNDEFINED, 1f));
        lp.width = 0;
        grid.addView(celda, lp);
    }

    private String subtitulo(Producto p) {
        String marca = p.marca == null ? "" : p.marca.nombre;
        if (p.plataforma != null) {
            return marca + " · " + p.plataforma.nombre;
        }
        return p.modelo != null ? marca + " · " + p.modelo : marca;
    }

    private void cargarImagen(String url, String nombre) {
        ImageView imagen = findViewById(R.id.ivImagen);
        imagen.setContentDescription(getString(R.string.imagen_producto, nombre));
        Glide.with(this).load(url)
                .placeholder(R.drawable.placeholder_imagen)
                .error(R.drawable.placeholder_error)
                .centerCrop()
                .into(imagen);
    }

    /**
     * Comprar: añade una unidad al carrito con la animación «insertar» (RF-13): el botón baja un poco y vuelve
     * con un rebote corto, como un cartucho que encaja (DESIGN.md §7). Luego un snackbar con «Ver carrito».
     */
    private void comprar(Producto p, View boton) {
        Carrito.get(this).comprar(p, 1);
        float baja = getResources().getDimension(R.dimen.ja_espacio_1);
        boton.animate().translationY(baja).setDuration(getResources().getInteger(R.integer.ja_duracion_rapida))
                .withEndAction(() -> boton.animate().translationY(0)
                        .setInterpolator(AnimationUtils.loadInterpolator(this, R.interpolator.ja_insertar))
                        .setDuration(getResources().getInteger(R.integer.ja_duracion_lenta)).start())
                .start();
        avisoAnadido(getString(R.string.anadido_compra, p.nombre));
    }

    /** La hoja de alquilar ya ha añadido la línea al carrito. */
    @Override
    public void alquilado(int dias) {
        avisoAnadido(getString(R.string.anadido_alquiler, getResources().getQuantityString(R.plurals.dias, dias, dias)));
    }

    private void avisoAnadido(String texto) {
        Snackbar.make(findViewById(R.id.contenido), texto, Snackbar.LENGTH_LONG)
                .setAction(R.string.ver_carrito, v -> verCarrito())
                .show();
    }

    private void verCarrito() {
        startActivity(MainActivity.abrirSeccion(this, R.id.nav_carrito));
    }

    @Override
    protected void onDestroy() {
        VolleyClient.get(this).cancelar(this);
        super.onDestroy();
    }
}
