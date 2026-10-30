package com.juegalmi.app.ui.inicio;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.juegalmi.app.R;
import com.juegalmi.app.data.model.Producto;
import com.juegalmi.app.ui.catalogo.CatalogoFragment;

import java.util.ArrayList;

/**
 * PT-04 Inicio: buscador + pestañas (TabLayout + ViewPager2, RT-08).
 * Cada pestaña es un CatalogoFragment de un tipo de producto.
 * El micro abre el reconocimiento de voz de Android (RF-15, PT-29) y busca lo que se dice.
 */
public class InicioFragment extends Fragment {

    private static final String[] TIPOS = {Producto.VIDEOJUEGO, Producto.MOVIL, Producto.CONSOLA};
    private static final int[] TITULOS = {R.string.pestana_videojuegos, R.string.pestana_moviles,
            R.string.pestana_consolas};

    private BusquedaViewModel busqueda;
    private EditText etBuscar;

    /** Resultado del reconocedor de voz: una lista de frases posibles; la primera es la más probable. */
    private final ActivityResultLauncher<Intent> voz = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), resultado -> {
                Intent datos = resultado.getData();
                if (datos == null) {
                    return;
                }
                ArrayList<String> frases = datos.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (frases != null && !frases.isEmpty()) {
                    etBuscar.setText(frases.get(0));
                    busqueda.buscar(frases.get(0));
                }
            });

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_inicio, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View vista, @Nullable Bundle savedInstanceState) {
        // El ViewModel pertenece a este fragment: sus pestañas (hijas) obtienen el mismo
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
        vista.findViewById(R.id.btnVoz).setOnClickListener(v -> escuchar());

        ViewPager2 paginas = vista.findViewById(R.id.paginas);
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
    }

    private void escuchar() {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-ES")
                .putExtra(RecognizerIntent.EXTRA_PROMPT, getString(R.string.voz_pista));
        try {
            voz.launch(intent);
        } catch (ActivityNotFoundException e) {
            Snackbar.make(requireView(), R.string.voz_no_disponible, Snackbar.LENGTH_LONG).show();
        }
    }

    private void ocultarTeclado() {
        InputMethodManager imm = requireContext().getSystemService(InputMethodManager.class);
        imm.hideSoftInputFromWindow(etBuscar.getWindowToken(), 0);
    }
}
