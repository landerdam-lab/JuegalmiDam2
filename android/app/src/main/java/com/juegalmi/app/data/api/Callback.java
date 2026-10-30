package com.juegalmi.app.data.api;

/**
 * Respuesta de una petición. Los dos métodos se llaman SIEMPRE en el hilo principal,
 * así que la vista puede tocar sus Views directamente.
 */
public interface Callback<T> {
    void onExito(T resultado);

    void onError(ApiError error);
}
