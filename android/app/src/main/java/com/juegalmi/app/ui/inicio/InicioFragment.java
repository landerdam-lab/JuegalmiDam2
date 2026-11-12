package com.juegalmi.app.ui.inicio;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.juegalmi.app.MainActivity;
import com.juegalmi.app.R;
import com.juegalmi.app.data.model.Producto;
import com.juegalmi.app.ui.catalogo.CatalogoFragment;

public class InicioFragment extends Fragment {

    private static final String[] TIPOS = {Producto.VIDEOJUEGO, Producto.MOVIL, Producto.CONSOLA};
    private static final int[] TITULOS = {R.string.pestana_videojuegos, R.string.pestana_moviles,
            R.string.pestana_consolas};

    private BusquedaViewModel busqueda;
    private EditText etBuscar;

    private static final String ARG_BUSQUEDA = "busqueda";
    private static final String ARG_PESTANA = "pestana";
    private ViewPager2 paginas;

    public static InicioFragment nuevo(@Nullable String busqueda, int pestana) {
        InicioFragment f = new InicioFragment();
        Bundle b = new Bundle();
        b.putString(ARG_BUSQUEDA, busqueda);
        b.putInt(ARG_PESTANA, pestana);
        f.setArguments(b);
        return f;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_inicio, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View vista, @Nullable Bundle savedInstanceState) {
        busqueda = new ViewModelProvider(this).get(BusquedaViewModel.class);

        etBuscar = vista.findViewById(R.id.etBuscar);
        etBuscar.setOnEditorActionListener((v, accion, evento) -> {
            if (accion == EditorInfo.IME_ACTION_SEARCH) {
                busqueda.buscar(etBuscar.getText().toString());
                ocultarTeclado();
                return true;
            }
            return false;
        });
        vista.findViewById(R.id.btnVoz).setOnClickListener(v -> ((MainActivity) requireActivity()).escucharVoz());

        paginas = vista.findViewById(R.id.paginas);
        TabLayout pestanas = vista.findViewById(R.id.pestanas);
        paginas.setAdapter(new FragmentStateAdapter(this) {
            @NonNull
            @Override
            public Fragment createFragment(int posicion) {
                return CatalogoFragment.nuevo(TIPOS[posicion]);
            }

            @Override
            public int getItemCount() {
                return TIPOS.length;
            }
        });
        new TabLayoutMediator(pestanas, paginas,
                (pestana, posicion) -> pestana.setText(TITULOS[posicion])).attach();

        Bundle args = getArguments();
        if (args != null && savedInstanceState == null) {
            irAPestana(args.getInt(ARG_PESTANA, 0));
            String texto = args.getString(ARG_BUSQUEDA);
            if (texto != null) buscar(texto);
        }
    }

    public void buscar(String texto) {
        etBuscar.setText(texto);
        busqueda.buscar(texto);
    }

    public void irAPestana(int posicion) {
        paginas.setCurrentItem(posicion, true);
    }

    private void ocultarTeclado() {
        InputMethodManager imm = requireContext().getSystemService(InputMethodManager.class);
        imm.hideSoftInputFromWindow(etBuscar.getWindowToken(), 0);
    }
}
