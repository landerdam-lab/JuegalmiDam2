package com.juegalmi.app.util;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.SystemClock;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleOwner;

import com.google.android.material.snackbar.Snackbar;
import com.juegalmi.app.R;

/**
 * «Agitar para refrescar» (RF-15, sensor además de GPS y cámara): escucha el acelerómetro y, si el móvil
 * se agita fuerte, llama a alAgitar.
 *
 * Se engancha al ciclo de vida de la pantalla: el sensor SOLO está activo mientras la pantalla se ve
 * (onResume → onPause). Así no gasta batería en segundo plano (CPU mínima).
 * Al detectar la sacudida muestra «Actualizando…»: si los datos no cambian, el usuario sabe que ha funcionado.
 */
public class AgitarDetector implements SensorEventListener, DefaultLifecycleObserver {

    /** Fuerza (en «g») a partir de la cual se considera una sacudida. 1 g = el móvil quieto.
     *  Con 2,5 g había que agitar muy fuerte en un móvil real; andar o guardar el móvil no llega a 2 g. */
    private static final float UMBRAL_G = 2.0f;
    /** Tiempo mínimo entre dos refrescos, para que una sacudida no recargue tres veces. */
    private static final long PAUSA_MS = 1500;

    private final Context context;
    private final View vista;
    private final Runnable alAgitar;
    private final SensorManager sensores;
    private long ultima = 0;

    private AgitarDetector(View vista, Runnable alAgitar) {
        Context context = vista.getContext();
        this.context = context.getApplicationContext();
        this.vista = vista;
        this.alAgitar = alAgitar;
        this.sensores = context.getSystemService(SensorManager.class);
    }

    /** Uso: AgitarDetector.vincular(getViewLifecycleOwner(), vista, this::recargar); (vista: la de la pantalla, para el aviso) */
    public static void vincular(LifecycleOwner pantalla, View vista, Runnable alAgitar) {
        pantalla.getLifecycle().addObserver(new AgitarDetector(vista, alAgitar));
    }

    @Override
    public void onResume(@NonNull LifecycleOwner owner) {
        Sensor acelerometro = sensores == null ? null : sensores.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (acelerometro != null && Preferencias.agitar(context)) {
            // SENSOR_DELAY_GAME (~20 ms): con UI (~60 ms) se perdía el pico de la sacudida. Solo mientras se ve la pantalla
            sensores.registerListener(this, acelerometro, SensorManager.SENSOR_DELAY_GAME);
        }
    }

    @Override
    public void onPause(@NonNull LifecycleOwner owner) {
        if (sensores != null) {
            sensores.unregisterListener(this);
        }
    }

    @Override
    public void onSensorChanged(SensorEvent e) {
        float gx = e.values[0] / SensorManager.GRAVITY_EARTH;
        float gy = e.values[1] / SensorManager.GRAVITY_EARTH;
        float gz = e.values[2] / SensorManager.GRAVITY_EARTH;
        float fuerza = (float) Math.sqrt(gx * gx + gy * gy + gz * gz);
        long ahora = SystemClock.elapsedRealtime();
        if (fuerza > UMBRAL_G && ahora - ultima > PAUSA_MS) {
            ultima = ahora;
            Snackbar.make(vista, R.string.agitar_actualizando, Snackbar.LENGTH_SHORT).show();
            alAgitar.run();
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int precision) {
        // No hace falta
    }
}
