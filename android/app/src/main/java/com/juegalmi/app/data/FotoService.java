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

public class FotoService extends Service {

    public static final int OK = 1;
    public static final int ERROR = 0;
    public static final String RUTA = "ruta";
    public static final String PID = "pid";

    private static final String TAG = "FotoService";
    private static final String EXTRA_FOTO = "foto";
    private static final String EXTRA_RESPUESTA = "respuesta";
    private static final int LADO_MAXIMO = 1280;
    private static final int CALIDAD_JPEG = 80;

    private final ExecutorService hilo = Executors.newSingleThreadExecutor();

    public static void reducir(Context context, Uri foto, ResultReceiver respuesta) {
        Intent intent = new Intent(context, FotoService.class)
                .putExtra(EXTRA_FOTO, foto)
                .putExtra(EXTRA_RESPUESTA, plano(respuesta));
        try {
            context.startService(intent);
        } catch (IllegalStateException e) {
            Log.w(TAG, "No se pudo arrancar FotoService", e);
            respuesta.send(ERROR, null);
        }
    }

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
                Log.w(TAG, "No se pudo reducir la foto", e);
                respuesta.send(ERROR, null);
            } finally {
                stopSelf(startId);
            }
        });
        return START_NOT_STICKY;
    }

    private File reducir(Uri foto) throws Exception {
        Bitmap bitmap = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? decodificar(foto) : decodificarAndroid8(foto);
        File carpeta = new File(getCacheDir(), "fotos");
        carpeta.mkdirs();
        File destino = new File(carpeta, "reducida_" + System.currentTimeMillis() + ".jpg");
        try (OutputStream salida = new FileOutputStream(destino)) {
            bitmap.compress(Bitmap.CompressFormat.JPEG, CALIDAD_JPEG, salida);
        } finally {
            bitmap.recycle();
        }
        return destino;
    }

    @androidx.annotation.RequiresApi(Build.VERSION_CODES.P)
    private Bitmap decodificar(Uri foto) throws Exception {
        ImageDecoder.Source origen = ImageDecoder.createSource(getContentResolver(), foto);
        return ImageDecoder.decodeBitmap(origen, (decoder, info, src) -> {
            float escala = escala(info.getSize().getWidth(), info.getSize().getHeight());
            decoder.setTargetSize(Math.round(info.getSize().getWidth() * escala),
                    Math.round(info.getSize().getHeight() * escala));
        });
    }

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

    private static float escala(int ancho, int alto) {
        return Math.min(1f, LADO_MAXIMO / (float) Math.max(ancho, alto));
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        hilo.shutdown();
        super.onDestroy();
    }
}
