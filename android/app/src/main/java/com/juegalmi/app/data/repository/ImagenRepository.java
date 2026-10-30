package com.juegalmi.app.data.repository;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.ImageDecoder;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.RetrofitClient;
import com.juegalmi.app.data.model.Peticiones;

import java.io.ByteArrayOutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

/**
 * Sube una foto de la cámara a POST /api/imagenes y devuelve su URL (ADR-019: en la BBDD solo va la ruta).
 *
 * Antes de subirla la reduce a 1280 px y la comprime en JPEG. Eso se hace en un hilo de un Executor
 * (no en el principal: decodificar una foto de 12 Mpx tarda), y el resultado vuelve al principal con un Handler.
 * AsyncTask no se usa porque está obsoleta (A-12).
 */
public class ImagenRepository {

    public static final String USUARIOS = "usuarios";
    public static final String REPARACIONES = "reparaciones";

    private static final int LADO_MAXIMO = 1280;
    private static final int CALIDAD_JPEG = 80;
    private static final ExecutorService HILO = Executors.newSingleThreadExecutor();

    private final Context context;
    private final Handler principal = new Handler(Looper.getMainLooper());

    public ImagenRepository(Context context) {
        this.context = context.getApplicationContext();
    }

    public void subir(Uri foto, String carpeta, Callback<String> callback) {
        HILO.execute(() -> {
            byte[] jpeg;
            try {
                jpeg = comprimir(foto);
            } catch (Exception e) {
                principal.post(() -> callback.onError(ApiError.desdeRespuesta(context, 0, null)));
                return;
            }
            RequestBody cuerpo = RequestBody.create(jpeg, MediaType.parse("image/jpeg"));
            MultipartBody.Part parte = MultipartBody.Part.createFormData("imagen", "foto.jpg", cuerpo);
            RequestBody campoCarpeta = RequestBody.create(carpeta, MediaType.parse("text/plain"));
            RetrofitClient cliente = RetrofitClient.get(context);
            // enqueue ya devuelve el resultado en el hilo principal
            principal.post(() -> cliente.enviar(cliente.servicio().subirImagen(parte, campoCarpeta),
                    new Callback<Peticiones.ImagenSubida>() {
                        @Override
                        public void onExito(Peticiones.ImagenSubida r) {
                            callback.onExito(r.url);
                        }

                        @Override
                        public void onError(ApiError error) {
                            callback.onError(error);
                        }
                    }));
        });
    }

    /** Se ejecuta en el hilo del Executor. ImageDecoder escala al decodificar: no carga la foto entera. */
    private byte[] comprimir(Uri foto) throws Exception {
        ImageDecoder.Source origen = ImageDecoder.createSource(context.getContentResolver(), foto);
        Bitmap bitmap = ImageDecoder.decodeBitmap(origen, (decoder, info, src) -> {
            int ancho = info.getSize().getWidth();
            int alto = info.getSize().getHeight();
            float escala = Math.min(1f, LADO_MAXIMO / (float) Math.max(ancho, alto));
            decoder.setTargetSize(Math.round(ancho * escala), Math.round(alto * escala));
        });
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, CALIDAD_JPEG, salida);
        bitmap.recycle();
        return salida.toByteArray();
    }
}
