package com.juegalmi.app.util;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.SystemClock;

import androidx.annotation.NonNull;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleOwner;

/**
 * «Agitar para refrescar» (RF-15, sensor además de GPS y cámara): escucha el acelerómetro y, si el móvil
 * se agita fuerte, llama a alAgitar.
 *
 * Se engancha al ciclo de vida de la pantalla: el sensor SOLO está activo mientras la pantalla se ve
 * (onResume → onPause). Así no gasta batería en segundo plano (CPU mínima).
 */
public class AgitarDetector implements SensorEventListener, DefaultLifecycleObserver {

    /** Fuerza (en «g») a partir de la cual se considera una sacudida. 1 g = el móvil quieto. */
    private static final float UMBRAL_G = 2.5f;
    /** Tiempo mínimo entre dos refrescos, para que una sacudida no recargue tres veces. */
    private static final long PAUSA_MS = 1500;

    private final Context context;
    private final Runnable alAgitar;
    private final SensorManager sensores;
    private long ultima = 0;

    private AgitarDetector(Context context, Runnable alAgitar) {
        this.context = context.getApplicationContext();
        this.alAgitar = alAgitar;
        this.sensores = context.getSystemService(SensorManager.class);
    }

    /** Uso: AgitarDetector.vincular(getViewLifecycleOwner(), requireContext(), this::recargar); */
    public static void vincular(LifecycleOwner pantalla, Context context, Runnable alAgitar) {
        pantalla.getLifecycle().addObserver(new AgitarDetector(context, alAgitar));
    }

    @Override
    public void onResume(@NonNull LifecycleOwner owner) {
        Sensor acelerometro = sensores == null ? null : sensores.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (acelerometro != null && Preferencias.agitar(context)) {
            // SENSOR_DELAY_UI (~60 ms) basta para notar una sacudida y gasta menos que GAME o FASTEST
            sensores.registerListener(this, acelerometro, SensorManager.SENSOR_DELAY_UI);
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
            alAgitar.run();
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int precision) {
        // No hace falta
    }
}
