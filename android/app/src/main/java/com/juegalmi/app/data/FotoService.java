package com.juegalmi.app.data;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageDecoder;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Parcel;
import android.os.Process;
import android.os.ResultReceiver;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.content.IntentCompat;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Ejemplo de VARIOS PROCESOS (PSP, P-29 · ADR-039): reduce la foto de la cámara antes de subirla.
 *
 * En el Manifest lleva android:process=":fotos", así que Android lo arranca en un PROCESO DISTINTO del de
 * la app (otro PID y otra memoria). Decodificar una foto de 12 Mpx gasta mucha memoria y CPU, y así no
 * se gasta la memoria de la app: si algo fuera mal, el problema queda en este proceso. Se ve en Logcat: el PID
 * del mensaje «Foto reducida» no es el de la app.
 *
 * Dentro del proceso, el trabajo va en un hilo de un Executor (VARIOS HILOS): onStartCommand se ejecuta en
 * el hilo principal del proceso :fotos y no se debe bloquear.
 *
 * Los dos procesos se comunican así:
 * - Ida: un Intent con la Uri de la foto (la del FileProvider; los dos procesos son de la misma app).
 * - Vuelta: un ResultReceiver. Es Parcelable y viaja por Binder (el IPC de Android): send() en este
 *   proceso hace que onReceiveResult se ejecute en el proceso de la app, en el hilo de su Handler.
 * - El JPEG reducido se deja en la caché de la app (la comparten los dos procesos) y se devuelve su ruta.
 */
public class FotoService extends Service {

    public static final int OK = 1;
    public static final int ERROR = 0;
    public static final String RUTA = "ruta";
    /** PID del proceso :fotos, para comprobar (y enseñar) que no es el de la app */
    public static final String PID = "pid";

    private static final String TAG = "FotoService";
    private static final String EXTRA_FOTO = "foto";
    private static final String EXTRA_RESPUESTA = "respuesta";
    private static final int LADO_MAXIMO = 1280;
    private static final int CALIDAD_JPEG = 80;

    private final ExecutorService hilo = Executors.newSingleThreadExecutor();

    /** Lo llama la app (ImagenRepository). La respuesta llega a «respuesta» con OK + RUTA, o ERROR. */
    public static void reducir(Context context, Uri foto, ResultReceiver respuesta) {
        Intent intent = new Intent(context, FotoService.class)
                .putExtra(EXTRA_FOTO, foto)
                .putExtra(EXTRA_RESPUESTA, plano(respuesta));
        try {
            context.startService(intent);
        } catch (IllegalStateException e) {
            // Desde Android 8 no se puede arrancar un servicio con la app en segundo plano: se avisa del error
            Log.w(TAG, "No se pudo arrancar FotoService", e);
            respuesta.send(ERROR, null);
        }
    }

    /**
     * Copia «plana» del ResultReceiver. Quien llama suele pasar una subclase anónima (new ResultReceiver() {…}),
     * y al llegar al otro proceso Android buscaría esa clase para leerla. Así solo viaja un ResultReceiver
     * normal, que sigue apuntando (por Binder) al original: onReceiveResult se ejecuta igual en la app.
     */
    private static ResultReceiver plano(ResultReceiver original) {
        Parcel parcel = Parcel.obtain();
        try {
            original.writeToParcel(parcel, 0);
            parcel.setDataPosition(0);
            return ResultReceiver.CREATOR.createFromParcel(parcel);
        } finally {
            parcel.recycle();
        }
    }

    @Override
    public int onStartCommand(@Nullable Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf(startId);
            return START_NOT_STICKY;
        }
        Uri foto = IntentCompat.getParcelableExtra(intent, EXTRA_FOTO, Uri.class);
        ResultReceiver respuesta = IntentCompat.getParcelableExtra(intent, EXTRA_RESPUESTA, ResultReceiver.class);
        hilo.execute(() -> {
            try {
                File reducida = reducir(foto);
                Log.i(TAG, "Foto reducida en el proceso " + Process.myPid() + ": " + reducida.length() / 1024 + " KB");
                Bundle datos = new Bundle();
                datos.putString(RUTA, reducida.getAbsolutePath());
                datos.putInt(PID, Process.myPid());
                respuesta.send(OK, datos);
            } catch (Exception | OutOfMemoryError e) {
                // También sin memoria: se avisa a la app en vez de dejarla esperando
                Log.w(TAG, "No se pudo reducir la foto", e);
                respuesta.send(ERROR, null);
            } finally {
                // Se para solo cuando ha terminado su último encargo (por si llegan dos fotos seguidas)
                stopSelf(startId);
            }
        });
        // Si Android mata el proceso a medias, no se reinicia: el usuario verá el error y lo repetirá
        return START_NOT_STICKY;
    }

    /** Se ejecuta en el hilo del Executor: decodifica la foto ya reducida y la guarda en JPEG. */
    private File reducir(Uri foto) throws Exception {
        Bitmap bitmap = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? decodificar(foto) : decodificarAndroid8(foto);
        File carpeta = new File(getCacheDir(), "fotos");
        //noinspection ResultOfMethodCallIgnored
        carpeta.mkdirs();
        File destino = new File(carpeta, "reducida_" + System.currentTimeMillis() + ".jpg");
        try (OutputStream salida = new FileOutputStream(destino)) {
            bitmap.compress(Bitmap.CompressFormat.JPEG, CALIDAD_JPEG, salida);
        } finally {
            bitmap.recycle();
        }
        return destino;
    }

    /** Android 9+: ImageDecoder escala al decodificar (no carga la foto entera) y respeta el giro de la cámara. */
    @androidx.annotation.RequiresApi(Build.VERSION_CODES.P)
    private Bitmap decodificar(Uri foto) throws Exception {
        ImageDecoder.Source origen = ImageDecoder.createSource(getContentResolver(), foto);
        return ImageDecoder.decodeBitmap(origen, (decoder, info, src) -> {
            float escala = escala(info.getSize().getWidth(), info.getSize().getHeight());
            decoder.setTargetSize(Math.round(info.getSize().getWidth() * escala),
                    Math.round(info.getSize().getHeight() * escala));
        });
    }

    /**
     * Android 8 (minSdk 26, sin ImageDecoder): BitmapFactory. Primero se leen solo las medidas, después se
     * decodifica a 1/2, 1/4… (inSampleSize, poca memoria) y al final se ajusta al tamaño exacto.
     */
    private Bitmap decodificarAndroid8(Uri foto) throws Exception {
        BitmapFactory.Options medidas = new BitmapFactory.Options();
        medidas.inJustDecodeBounds = true;
        try (InputStream entrada = getContentResolver().openInputStream(foto)) {
            BitmapFactory.decodeStream(entrada, null, medidas);
        }
        BitmapFactory.Options opciones = new BitmapFactory.Options();
        opciones.inSampleSize = 1;
        while (Math.max(medidas.outWidth, medidas.outHeight) / (opciones.inSampleSize * 2) >= LADO_MAXIMO) {
            opciones.inSampleSize *= 2;
        }
        Bitmap muestra;
        try (InputStream entrada = getContentResolver().openInputStream(foto)) {
            muestra = BitmapFactory.decodeStream(entrada, null, opciones);
        }
        if (muestra == null) {
            throw new IllegalArgumentException("No es una imagen");
        }
        float escala = escala(muestra.getWidth(), muestra.getHeight());
        if (escala >= 1f) {
            return muestra;
        }
        Bitmap reducida = Bitmap.createScaledBitmap(muestra, Math.round(muestra.getWidth() * escala),
                Math.round(muestra.getHeight() * escala), true);
        muestra.recycle();
        return reducida;
    }

    /** Factor para que el lado mayor mida como mucho LADO_MAXIMO (1 si ya es más pequeña). */
    private static float escala(int ancho, int alto) {
        return Math.min(1f, LADO_MAXIMO / (float) Math.max(ancho, alto));
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Servicio «iniciado» (startService), no enlazado
    }

    @Override
    public void onDestroy() {
        hilo.shutdown();
        super.onDestroy();
    }
}
