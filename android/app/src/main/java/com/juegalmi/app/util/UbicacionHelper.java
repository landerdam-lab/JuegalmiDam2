package com.juegalmi.app.util;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;

import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

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

    public void actualizar() {
        actualizar(null);
    }

    @SuppressLint("MissingPermission")
    public void actualizar(@Nullable Runnable listo) {
        if (!tienePermiso()) {
            return;
        }
        cliente.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, null)
                .addOnSuccessListener(ubicacion -> {
                    guardar(ubicacion);
                    if (listo != null) {
                        listo.run();
                    }
                });
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
