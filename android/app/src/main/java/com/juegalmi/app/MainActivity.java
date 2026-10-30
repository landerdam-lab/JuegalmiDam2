package com.juegalmi.app;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.view.View;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.annotation.OptIn;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.fragment.app.Fragment;

import com.bumptech.glide.Glide;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.badge.BadgeDrawable;
import com.google.android.material.badge.BadgeUtils;
import com.google.android.material.badge.ExperimentalBadgeUtils;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.imageview.ShapeableImageView;
import com.google.android.material.navigation.NavigationView;
import com.google.android.material.snackbar.Snackbar;
import com.juegalmi.app.data.Carrito;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.Usuario;
import com.juegalmi.app.data.repository.AuthRepository;
import com.juegalmi.app.ui.alquileres.AlquileresFragment;
import com.juegalmi.app.ui.auth.AuthActivity;
import com.juegalmi.app.ui.carrito.CarritoFragment;
import com.juegalmi.app.ui.comun.Dialogos;
import com.juegalmi.app.ui.inicio.InicioFragment;
import com.juegalmi.app.ui.pedidos.PedidosFragment;
import com.juegalmi.app.ui.perfil.PerfilFragment;
import com.juegalmi.app.ui.reparaciones.NuevaReparacionActivity;
import com.juegalmi.app.ui.reparaciones.ReparacionesFragment;
import com.juegalmi.app.ui.tienda.GaleriaActivity;
import com.juegalmi.app.ui.tienda.HistoriaActivity;
import com.juegalmi.app.ui.tienda.ServiciosActivity;
import com.juegalmi.app.ui.tienda.TiendaFragment;
import com.juegalmi.app.ui.tienda.UbicacionActivity;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.OrdenVoz;
import com.juegalmi.app.util.RedLocal;
import com.juegalmi.app.util.UbicacionHelper;

import java.util.ArrayList;

/**
 * Entrada de la app.
 * 1. Splash (PT-01): se queda en pantalla mientras se comprueba el token con GET /api/me.
 *    Sin sesión → login. Sin red → login con aviso (SCREEN-MAP, PT-01).
 * 2. Con sesión: Navigation Drawer + barra superior (RT-08). Cada opción del menú es un fragment
 *    que se pone en el contenedor: Inicio, Carrito, La tienda, Mis pedidos, Mis alquileres, Mis reparaciones y Perfil.
 */
public class MainActivity extends AppCompatActivity {

    /** Otra pantalla puede pedir abrir una sección (p. ej. «Ver carrito» desde la ficha). */
    public static final String EXTRA_SECCION = "seccion";

    private AuthRepository auth;
    private DrawerLayout drawer;
    private NavigationView navegacion;
    private BadgeDrawable insignia;
    /** Mientras sea true, el sistema sigue mostrando el splash. */
    private volatile boolean comprobandoSesion = true;

    /**
     * Control por voz (RF-15, rúbrica Móviles 5): el reconocedor de voz de Android devuelve las frases posibles
     * (la primera es la más probable) y OrdenVoz decide qué hacer: abrir una sección, cambiar de pestaña o buscar.
     */
    private final ActivityResultLauncher<Intent> voz = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), resultado -> {
                Intent datos = resultado.getData();
                ArrayList<String> frases = datos == null ? null
                        : datos.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (frases != null && !frases.isEmpty()) {
                    ejecutar(OrdenVoz.interpretar(frases.get(0)), frases.get(0));
                }
            });

    private final ActivityResultLauncher<String> permisoUbicacion = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            concedido -> UbicacionHelper.get(this).actualizar());

    /** Android 17: sin este permiso no se llega a una API de la red local (util/RedLocal). Se comprueba la sesión igual:
     *  si se niega, GET /api/me falla por red y se va al login, que lo explica */
    private final ActivityResultLauncher<String> permisoRedLocal = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(), concedido -> comprobarSesion());

    /** Intent para abrir la app en una sección del menú (R.id.nav_*). */
    public static Intent abrirSeccion(Context context, int seccion) {
        return new Intent(context, MainActivity.class)
                .putExtra(EXTRA_SECCION, seccion)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Splash (PT-01): tiene que ir ANTES de super.onCreate. Muestra Theme.JuegAlmi.Splash
        // y luego cambia al tema normal (postSplashScreenTheme = Theme.JuegAlmi)
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        auth = new AuthRepository(this);
        if (!auth.haySesion()) {
            irAlLogin(false);
            return;
        }

        // Edge-to-edge: la app ocupa toda la pantalla, también detrás de las barras del sistema
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        prepararNavegacion();

        if (savedInstanceState == null) {
            splash.setKeepOnScreenCondition(() -> comprobandoSesion);
            if (RedLocal.hayQuePedir(this)) {
                permisoRedLocal.launch(RedLocal.permiso());
            } else {
                comprobarSesion();
            }
            abrir(getIntent().getIntExtra(EXTRA_SECCION, R.id.nav_inicio));
        } else {
            comprobandoSesion = false;
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent.hasExtra(EXTRA_SECCION)) {
            abrir(intent.getIntExtra(EXTRA_SECCION, R.id.nav_inicio));
        }
    }

    private void comprobarSesion() {
        auth.comprobarSesion(this, new Callback<Usuario>() {
            @Override
            public void onExito(Usuario usuario) {
                comprobandoSesion = false;
                pintarCabecera(usuario);
                pedirUbicacion();
            }

            @Override
            public void onError(ApiError error) {
                comprobandoSesion = false;
                if (error.esSinRed()) {
                    irAlLogin(true);
                }
                // 401: ya lo gestiona SesionCaducada (vuelve al login). Otro error: se sigue con los datos guardados
            }
        });
    }

    private void prepararNavegacion() {
        drawer = findViewById(R.id.drawer);
        navegacion = findViewById(R.id.navegacion);
        MaterialToolbar toolbar = findViewById(R.id.toolbar);
        Bordes.aplicar(toolbar, true, false);
        Bordes.aplicar(findViewById(R.id.contenedor), false, true);
        Bordes.aplicar(navegacion.getHeaderView(0), true, false);

        toolbar.setNavigationOnClickListener(v -> drawer.openDrawer(GravityCompat.START));
        toolbar.setOnMenuItemClickListener(item -> {
            if (item.getItemId() == R.id.accion_voz) {
                escucharVoz();
            } else {
                abrir(R.id.nav_carrito);
            }
            return true;
        });
        ponerInsignia(toolbar);

        pintarCabecera(auth.getUsuario());
        navegacion.getHeaderView(0).setOnClickListener(v -> {
            drawer.closeDrawer(GravityCompat.START);
            abrir(R.id.nav_perfil);
        });
        navegacion.setNavigationItemSelectedListener(item -> {
            drawer.closeDrawer(GravityCompat.START);
            if (item.getItemId() == R.id.nav_cerrar_sesion) {
                confirmarCierreSesion();
                return false;
            }
            abrir(item.getItemId());
            return true;
        });

        // Atrás: primero cierra el drawer (DESIGN.md §8); desde otra sección vuelve a Inicio; desde Inicio sale
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (drawer.isDrawerOpen(GravityCompat.START)) {
                    drawer.closeDrawer(GravityCompat.START);
                } else if (!(getSupportFragmentManager().findFragmentById(R.id.contenedor) instanceof InicioFragment)) {
                    abrir(R.id.nav_inicio);
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    /** Insignia amarilla con las unidades del carrito (DESIGN.md §8). Se actualiza sola (LiveData). */
    @OptIn(markerClass = ExperimentalBadgeUtils.class)
    private void ponerInsignia(MaterialToolbar toolbar) {
        insignia = BadgeDrawable.create(this);
        insignia.setBackgroundColor(ContextCompat.getColor(this, R.color.ja_primario));
        insignia.setBadgeTextColor(ContextCompat.getColor(this, R.color.ja_sobre_primario));
        BadgeUtils.attachBadgeDrawable(insignia, toolbar, R.id.accion_carrito);
        Carrito.get(this).getLineas().observe(this, lineas -> {
            int n = Carrito.get(this).unidades();
            insignia.setNumber(n);
            insignia.setVisible(n > 0);
        });
    }

    /** Pone en el contenedor la pantalla de una opción del menú. */
    public void abrir(int seccion) {
        Fragment pantalla;
        if (seccion == R.id.nav_carrito) pantalla = new CarritoFragment();
        else if (seccion == R.id.nav_tienda) pantalla = new TiendaFragment();
        else if (seccion == R.id.nav_pedidos) pantalla = new PedidosFragment();
        else if (seccion == R.id.nav_alquileres) pantalla = new AlquileresFragment();
        else if (seccion == R.id.nav_reparaciones) pantalla = new ReparacionesFragment();
        else if (seccion == R.id.nav_perfil) pantalla = new PerfilFragment();
        else {
            seccion = R.id.nav_inicio;
            pantalla = new InicioFragment();
        }
        navegacion.setCheckedItem(seccion);
        getSupportFragmentManager().beginTransaction()
                .setCustomAnimations(android.R.anim.fade_in, android.R.anim.fade_out)
                .replace(R.id.contenedor, pantalla)
                .commit();
    }

    /** Abre el reconocedor de voz del sistema (micro de la barra superior y del buscador de Inicio). */
    public void escucharVoz() {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-ES")
                .putExtra(RecognizerIntent.EXTRA_PROMPT, getString(R.string.voz_pista));
        try {
            voz.launch(intent);
        } catch (ActivityNotFoundException e) {
            Snackbar.make(findViewById(R.id.contenedor), R.string.voz_no_disponible, Snackbar.LENGTH_LONG).show();
        }
    }

    /** Ejecuta una orden de voz y enseña qué ha entendido la app. */
    private void ejecutar(OrdenVoz orden, String frase) {
        switch (orden.accion) {
            case CARRITO: abrir(R.id.nav_carrito); break;
            case PEDIDOS: abrir(R.id.nav_pedidos); break;
            case ALQUILERES: abrir(R.id.nav_alquileres); break;
            case REPARACIONES: abrir(R.id.nav_reparaciones); break;
            case PERFIL: abrir(R.id.nav_perfil); break;
            case TIENDA: abrir(R.id.nav_tienda); break;
            case NUEVA_REPARACION: startActivity(new Intent(this, NuevaReparacionActivity.class)); break;
            case SERVICIOS: startActivity(new Intent(this, ServiciosActivity.class)); break;
            case UBICACION: startActivity(new Intent(this, UbicacionActivity.class)); break;
            case GALERIA: startActivity(new Intent(this, GaleriaActivity.class)); break;
            case HISTORIA: startActivity(new Intent(this, HistoriaActivity.class)); break;
            case INICIO:
            case VIDEOJUEGOS: abrirInicio(null, 0); break;
            case MOVILES: abrirInicio(null, 1); break;
            case CONSOLAS: abrirInicio(null, 2); break;
            default: abrirInicio(orden.texto, -1); break;
        }
        Snackbar.make(findViewById(R.id.contenedor), getString(R.string.voz_entendido, frase), Snackbar.LENGTH_SHORT).show();
    }

    /** Inicio con una búsqueda y/o una pestaña (-1 = la que esté). Si ya está abierto, no se recrea. */
    private void abrirInicio(@Nullable String busqueda, int pestana) {
        Fragment actual = getSupportFragmentManager().findFragmentById(R.id.contenedor);
        if (actual instanceof InicioFragment && actual.getView() != null) {
            if (pestana >= 0) ((InicioFragment) actual).irAPestana(pestana);
            if (busqueda != null) ((InicioFragment) actual).buscar(busqueda);
            return;
        }
        navegacion.setCheckedItem(R.id.nav_inicio);
        getSupportFragmentManager().beginTransaction()
                .replace(R.id.contenedor, InicioFragment.nuevo(busqueda, Math.max(pestana, 0)))
                .commit();
    }

    public void irAInicio() {
        abrir(R.id.nav_inicio);
    }

    public void pintarCabecera(Usuario usuario) {
        if (usuario == null) {
            return;
        }
        View cabecera = navegacion.getHeaderView(0);
        ((TextView) cabecera.findViewById(R.id.tvNombre)).setText(usuario.nombreCompleto());
        ((TextView) cabecera.findViewById(R.id.tvEmail)).setText(usuario.email);
        if (usuario.foto != null) {
            ShapeableImageView avatar = cabecera.findViewById(R.id.ivAvatar);
            avatar.setContentPadding(0, 0, 0, 0);
            avatar.setImageTintList(null);
            Glide.with(this).load(usuario.foto).placeholder(R.drawable.ic_person).centerCrop().into(avatar);
        }
    }

    /**
     * La ubicación se manda en todas las peticiones (ADR-014). Antes del permiso del sistema se explica
     * para qué se usa (DESIGN.md §10). Si dice que no, la app sigue funcionando para consultar.
     */
    private void pedirUbicacion() {
        UbicacionHelper ubicacion = UbicacionHelper.get(this);
        if (ubicacion.tienePermiso()) {
            ubicacion.actualizar();
            return;
        }
        new MaterialAlertDialogBuilder(this, R.style.ThemeOverlay_JuegAlmi_Dialogo)
                .setTitle(R.string.permiso_ubicacion_titulo)
                .setMessage(R.string.permiso_ubicacion_texto)
                .setPositiveButton(R.string.permiso_continuar,
                        (d, w) -> permisoUbicacion.launch(Manifest.permission.ACCESS_COARSE_LOCATION))
                .setNegativeButton(R.string.permiso_ahora_no, null)
                .show();
    }

    public void confirmarCierreSesion() {
        Dialogos.destructivo(new MaterialAlertDialogBuilder(this, R.style.ThemeOverlay_JuegAlmi_Dialogo)
                .setTitle(R.string.menu_cerrar_sesion)
                .setMessage(R.string.cerrar_sesion_texto)
                .setPositiveButton(R.string.menu_cerrar_sesion, (d, w) -> {
                    auth.logout(this);
                    Carrito.get(this).vaciar();
                    irAlLogin(false);
                })
                .setNegativeButton(R.string.volver, null)
                .show());
    }

    private void irAlLogin(boolean sinRed) {
        Intent intent = new Intent(this, AuthActivity.class)
                .putExtra(AuthActivity.EXTRA_SIN_RED, sinRed)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
