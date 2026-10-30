package com.juegalmi.app.data.repository;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.ResultReceiver;

import com.juegalmi.app.data.FotoService;
import com.juegalmi.app.data.api.ApiError;
import com.juegalmi.app.data.api.Callback;
import com.juegalmi.app.data.api.RetrofitClient;
import com.juegalmi.app.data.model.Peticiones;

import java.io.File;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

/**
 * Sube una foto de la cámara a POST /api/imagenes y devuelve su URL (ADR-019: en la BBDD solo va la ruta).
 *
 * Antes de subirla hay que reducirla a 1280 px y comprimirla en JPEG. Eso lo hace FotoService en OTRO
 * PROCESO (ejemplo de varios procesos, ADR-039), con su propio hilo; el resultado vuelve a este proceso, en
 * el hilo principal, por un ResultReceiver. Después Retrofit sube el fichero en su hilo de red (enqueue).
 * AsyncTask no se usa porque está obsoleta (A-12).
 */
public class ImagenRepository {

    public static final String USUARIOS = "usuarios";
    public static final String REPARACIONES = "reparaciones";

    private final Context context;
    private final Handler principal = new Handler(Looper.getMainLooper());

    public ImagenRepository(Context context) {
        this.context = context.getApplicationContext();
    }

    public void subir(Uri foto, String carpeta, Callback<String> callback) {
        FotoService.reducir(context, foto, new ResultReceiver(principal) {
            @Override
            protected void onReceiveResult(int codigo, Bundle datos) {
                if (codigo != FotoService.OK || datos == null) {
                    callback.onError(ApiError.desdeRespuesta(context, 0, null));
                    return;
                }
                enviar(new File(datos.getString(FotoService.RUTA)), carpeta, callback);
            }
        });
    }

    /** OkHttp lee el fichero al enviarlo, en su hilo de red: aquí no se lee nada en el hilo principal. */
    private void enviar(File jpeg, String carpeta, Callback<String> callback) {
        RequestBody cuerpo = RequestBody.create(jpeg, MediaType.parse("image/jpeg"));
        MultipartBody.Part parte = MultipartBody.Part.createFormData("imagen", "foto.jpg", cuerpo);
        RequestBody campoCarpeta = RequestBody.create(carpeta, MediaType.parse("text/plain"));
        RetrofitClient cliente = RetrofitClient.get(context);
        cliente.enviar(cliente.servicio().subirImagen(parte, campoCarpeta), new Callback<Peticiones.ImagenSubida>() {
            @Override
            public void onExito(Peticiones.ImagenSubida r) {
                borrar(jpeg);
                callback.onExito(r.url);
            }

            @Override
            public void onError(ApiError error) {
                borrar(jpeg);
                callback.onError(error);
            }
        });
    }

    /** La copia reducida ya no hace falta: no se deja basura en la caché. */
    private static void borrar(File jpeg) {
        //noinspection ResultOfMethodCallIgnored
        jpeg.delete();
    }
}
