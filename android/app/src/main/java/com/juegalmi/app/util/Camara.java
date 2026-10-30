package com.juegalmi.app.util;

import android.content.Context;
import android.net.Uri;

import androidx.core.content.FileProvider;

import java.io.File;

/**
 * Prepara el fichero donde la app de cámara guarda la foto (ActivityResultContracts.TakePicture).
 *
 * La cámara es otra app, así que no puede escribir en nuestra carpeta privada: se le da una Uri temporal
 * con FileProvider (declarado en el Manifest, rutas en res/xml/rutas_fotos.xml). Al usar la app de cámara
 * del sistema no hace falta pedir el permiso CAMERA.
 */
public final class Camara {

    private Camara() {
    }

    public static Uri nuevaFoto(Context context) {
        File carpeta = new File(context.getCacheDir(), "fotos");
        //noinspection ResultOfMethodCallIgnored
        carpeta.mkdirs();
        File foto = new File(carpeta, "foto_" + System.currentTimeMillis() + ".jpg");
        return FileProvider.getUriForFile(context, context.getPackageName() + ".fotos", foto);
    }
}
