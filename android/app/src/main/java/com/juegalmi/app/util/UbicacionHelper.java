package com.juegalmi.app.util;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;

import androidx.core.content.ContextCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

/**
 * Guarda la última ubicación del móvil para mandarla en las cabeceras X-Latitud / X-Longitud (ADR-014).
 *
 * Usa el FusedLocationProviderClient de Google Play Services: decide solo si usa GPS, wifi o red móvil
 * y trabaja en segundo plano. Precisión «equilibrada» (≈100 m): basta para saber desde dónde se hace
 * la operación y gasta mucha menos batería que el GPS a máxima precisión (CPU mínima).
 */
public final class UbicacionHelper {

    private static UbicacionHelper instancia;

    private final Context context;
    private final FusedLocationProviderClient cliente;
    private volatile Double latitud;
    private volatile Double longitud;

    private UbicacionHelper(Context context) {
        this.context = context.getApplicationContext();
        this.cliente = LocationServices.getFusedLocationProviderClient(this.context);
    }

    public static synchronized UbicacionHelper get(Context context) {
        if (instancia == null) {
            instancia = new UbicacionHelper(context);
        }
        return instancia;
    }

    public boolean tienePermiso() {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
    }

    public boolean hayUbicacion() {
        return latitud != null && longitud != null;
    }

    public double getLatitud() {
        return latitud;
    }

    public double getLongitud() {
        return longitud;
    }

    /** Pide la ubicación actual (asíncrono). Si no hay permiso no hace nada: la app sigue funcionando. */
    @SuppressLint("MissingPermission") // comprobado con tienePermiso()
    public void actualizar() {
        if (!tienePermiso()) {
            return;
        }
        cliente.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, null)
                .addOnSuccessListener(this::guardar);
        // Mientras llega la actual, la última conocida sirve para las primeras peticiones
        cliente.getLastLocation().addOnSuccessListener(ubicacion -> {
            if (!hayUbicacion()) {
                guardar(ubicacion);
            }
        });
    }

    private void guardar(Location ubicacion) {
        if (ubicacion != null) {
            latitud = ubicacion.getLatitude();
            longitud = ubicacion.getLongitude();
        }
    }
}
