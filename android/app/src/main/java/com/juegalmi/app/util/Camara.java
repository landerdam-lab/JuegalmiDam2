package com.juegalmi.app.util;

import android.content.Context;
import android.net.Uri;

import androidx.core.content.FileProvider;

import java.io.File;

public final class Camara {

    private Camara() {
    }

    public static Uri nuevaFoto(Context context) {
        File carpeta = new File(context.getCacheDir(), "fotos");
        carpeta.mkdirs();
        File foto = new File(carpeta, "foto_" + System.currentTimeMillis() + ".jpg");
        return FileProvider.getUriForFile(context, context.getPackageName() + ".fotos", foto);
    }
}
