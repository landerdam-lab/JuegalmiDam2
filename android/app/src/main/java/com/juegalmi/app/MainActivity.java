package com.juegalmi.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
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
import com.google.android.material.navigation.NavigationView;
import com.juegalmi.app.data.Carrito;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.model.Usuario;
import com.juegalmi.app.data.repository.AuthRepository;
import com.juegalmi.app.ui.alquileres.AlquileresFragment;
import com.juegalmi.app.ui.auth.AuthActivity;
import com.juegalmi.app.ui.carrito.CarritoFragment;
import com.juegalmi.app.ui.inicio.InicioFragment;
import com.juegalmi.app.ui.pedidos.PedidosFragment;
import com.juegalmi.app.ui.perfil.PerfilFragment;
import com.juegalmi.app.ui.reparaciones.ReparacionesFragment;
import com.juegalmi.app.ui.tienda.TiendaFragment;
import com.juegalmi.app.util.Bordes;
import com.juegalmi.app.util.UbicacionHelper;

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

    private final ActivityResultLauncher<String> permisoUbicacion = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            concedido -> UbicacionHelper.get(this).actualizar());

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
            comprobarSesion();
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
            abrir(R.id.nav_carrito);
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
            ImageView avatar = cabecera.findViewById(R.id.ivAvatar);
            avatar.setPadding(0, 0, 0, 0);
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
        new MaterialAlertDialogBuilder(this, R.style.ThemeOverlay_JuegAlmi_Dialogo)
                .setTitle(R.string.menu_cerrar_sesion)
                .setMessage(R.string.cerrar_sesion_texto)
                .setPositiveButton(R.string.menu_cerrar_sesion, (d, w) -> {
                    auth.logout(this);
                    Carrito.get(this).vaciar();
                    irAlLogin(false);
                })
                .setNegativeButton(R.string.volver, null)
                .show();
    }

    private void irAlLogin(boolean sinRed) {
        Intent intent = new Intent(this, AuthActivity.class)
                .putExtra(AuthActivity.EXTRA_SIN_RED, sinRed)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
