package com.juegalmi.app.ui.inicio;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

/**
 * Texto buscado en Inicio, compartido con las 3 pestañas del catálogo.
 * InicioFragment lo escribe (teclado o voz) y cada CatalogoFragment lo observa y vuelve a cargar.
 * Al ser un ViewModel, sobrevive al girar la pantalla.
 */
public class BusquedaViewModel extends ViewModel {

    private final MutableLiveData<String> texto = new MutableLiveData<>("");

    public LiveData<String> getTexto() {
        return texto;
    }

    public void buscar(String nuevo) {
        String limpio = nuevo == null ? "" : nuevo.trim();
        if (!limpio.equals(texto.getValue())) {
            texto.setValue(limpio);
        }
    }
}
