package com.juegalmi.app.data.model;

import java.util.ArrayList;
import java.util.List;

/** Listado paginado de la API: {items, page, limit, total}. */
public class Pagina<T> {
    public List<T> items = new ArrayList<>();
    public int page;
    public int limit;
    public int total;
}
