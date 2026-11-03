package com.juegalmi.app.ui.catalogo;

import androidx.lifecycle.ViewModel;

import com.juegalmi.app.data.repository.ProductoRepository;

/** Guarda los filtros de una pestaña del catálogo: un ViewModel sobrevive al giro de la pantalla. */
public class FiltroViewModel extends ViewModel {
    final ProductoRepository.Filtro filtro = new ProductoRepository.Filtro();
}
