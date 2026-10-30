package com.juegalmi.app.ui.catalogo;

import android.content.Context;
import android.view.Menu;

import androidx.annotation.Nullable;
import androidx.appcompat.widget.PopupMenu;
import androidx.core.content.ContextCompat;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.juegalmi.app.R;

import java.util.ArrayList;
import java.util.List;

/**
 * Chip de filtro con desplegable («Plataforma: Todas ▾»). Al tocarlo abre un menú con las opciones; al elegir
 * una, el chip la muestra y se pinta como seleccionado (marca-suave, DESIGN.md §9).
 *
 * No es «checkable» a propósito: así no interfiere con los chips de selección única del mismo grupo
 * (Todos / Móviles / Tablets).
 */
public class ChipDesplegable {

    /** Una opción del menú: texto visible y el valor que se manda a la API (null = sin filtro). */
    public static class Opcion {
        final String texto;
        @Nullable final Object valor;

        public Opcion(String texto, @Nullable Object valor) {
            this.texto = texto;
            this.valor = valor;
        }
    }

    public interface AlElegir {
        void elegido(@Nullable Object valor);
    }

    private final Context context;
    private final Chip chip;
    private final String titulo;
    private final String textoTodos;
    private final List<Opcion> opciones = new ArrayList<>();

    /**
     * @param titulo     «Plataforma»
     * @param textoTodos «Todas» (opción sin filtro; si es null, no hay opción vacía, p. ej. en «Ordenar»)
     */
    public ChipDesplegable(ChipGroup grupo, String titulo, @Nullable String textoTodos, AlElegir alElegir) {
        this.context = grupo.getContext();
        this.titulo = titulo;
        this.textoTodos = textoTodos;
        chip = new Chip(context);
        chip.setCheckable(false);
        chip.setCloseIcon(ContextCompat.getDrawable(context, R.drawable.ic_expand_more));
        chip.setCloseIconVisible(true);
        chip.setChipStrokeWidth(0f);
        chip.setOnCloseIconClickListener(v -> abrir(alElegir));
        chip.setOnClickListener(v -> abrir(alElegir));
        grupo.addView(chip);
        mostrar(null, false);
    }

    /** Las opciones llegan de la API (marcas, plataformas, géneros) o son fijas (PEGI, orden). */
    public void opciones(List<Opcion> lista) {
        opciones.clear();
        if (textoTodos != null) {
            opciones.add(new Opcion(textoTodos, null));
        }
        opciones.addAll(lista);
    }

    private void abrir(AlElegir alElegir) {
        if (opciones.isEmpty()) {
            return; // aún no han llegado de la API
        }
        PopupMenu menu = new PopupMenu(context, chip);
        for (int i = 0; i < opciones.size(); i++) {
            menu.getMenu().add(Menu.NONE, i, i, opciones.get(i).texto);
        }
        menu.setOnMenuItemClickListener(item -> {
            Opcion o = opciones.get(item.getItemId());
            mostrar(o.texto, o.valor != null);
            alElegir.elegido(o.valor);
            return true;
        });
        menu.show();
    }

    /** Vuelve al estado inicial (lo usa «Quitar filtros»). */
    public void reiniciar() {
        mostrar(null, false);
    }

    /** Cambia el texto sin avisar (p. ej. «Ordenar: Nombre» al empezar). */
    public void mostrar(@Nullable String eleccion, boolean activo) {
        String valor = eleccion != null ? eleccion : (textoTodos != null ? textoTodos : "");
        chip.setText(valor.isEmpty() ? titulo : context.getString(R.string.filtro_titulo_valor, titulo, valor));
        chip.setChipBackgroundColorResource(activo ? R.color.ja_marca_suave : R.color.ja_superficie_2);
        chip.setTextColor(ContextCompat.getColor(context, activo ? R.color.ja_marca : R.color.ja_texto));
        chip.setCloseIconTintResource(activo ? R.color.ja_marca : R.color.ja_texto_2);
    }
}
