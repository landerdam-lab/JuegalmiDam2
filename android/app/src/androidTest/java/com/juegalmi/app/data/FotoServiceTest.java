package com.juegalmi.app.data;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Process;
import android.os.ResultReceiver;

import androidx.core.content.FileProvider;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Prueba instrumentada (en el emulador o el móvil): ./gradlew connectedDebugAndroidTest
 * Comprueba el ejemplo de varios procesos (ADR-039): FotoService reduce una «foto» de 4000 × 3000 a 1280 px
 * de lado y lo hace en un proceso con un PID distinto del de la app.
 */
@RunWith(AndroidJUnit4.class)
public class FotoServiceTest {

    @Test
    public void reduceLaFotoEnOtroProceso() throws Exception {
        Context context = ApplicationProvider.getApplicationContext();
        Uri foto = fotoGrande(context);

        CountDownLatch hecho = new CountDownLatch(1);
        AtomicInteger codigo = new AtomicInteger(-1);
        AtomicReference<Bundle> datos = new AtomicReference<>();
        FotoService.reducir(context, foto, new ResultReceiver(new Handler(Looper.getMainLooper())) {
            @Override
            protected void onReceiveResult(int resultado, Bundle respuesta) {
                codigo.set(resultado);
                datos.set(respuesta);
                hecho.countDown();
            }
        });

        assertTrue("FotoService no ha respondido", hecho.await(20, TimeUnit.SECONDS));
        assertEquals(FotoService.OK, codigo.get());
        assertNotNull(datos.get());
        assertNotEquals("Tenía que ejecutarse en el proceso :fotos", Process.myPid(), datos.get().getInt(FotoService.PID));

        File reducida = new File(datos.get().getString(FotoService.RUTA));
        BitmapFactory.Options medidas = new BitmapFactory.Options();
        medidas.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(reducida.getAbsolutePath(), medidas);
        assertEquals(1280, Math.max(medidas.outWidth, medidas.outHeight));
        assertEquals(960, Math.min(medidas.outWidth, medidas.outHeight));
        //noinspection ResultOfMethodCallIgnored
        reducida.delete();
    }

    /** Crea una imagen de 12 Mpx en cache/fotos (la carpeta del FileProvider), como haría la cámara. */
    private static Uri fotoGrande(Context context) throws Exception {
        File carpeta = new File(context.getCacheDir(), "fotos");
        //noinspection ResultOfMethodCallIgnored
        carpeta.mkdirs();
        File fichero = new File(carpeta, "prueba_grande.jpg");
        Bitmap bitmap = Bitmap.createBitmap(4000, 3000, Bitmap.Config.RGB_565);
        try (OutputStream salida = new FileOutputStream(fichero)) {
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, salida);
        } finally {
            bitmap.recycle();
        }
        return FileProvider.getUriForFile(context, context.getPackageName() + ".fotos", fichero);
    }
}
