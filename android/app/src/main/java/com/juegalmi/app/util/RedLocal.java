package com.juegalmi.app.util;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.juegalmi.app.R;

import java.net.URI;

/**
 * Permiso de RED LOCAL de Android 17 (targetSdk 37). Sin él, la app no puede conectar con una API que esté en
 * la red local (el PC desde el emulador, 10.0.2.2, o la VM del aula, 192.168.x.x): la conexión se queda
 * esperando hasta agotar el tiempo. Es un permiso en tiempo de ejecución (grupo «Dispositivos cercanos»).
 *
 * Solo se pide si hace falta: Android 17 o superior, la URL de la API (res/values/api.xml) es una dirección
 * local y aún no está concedido. Con la API en AWS (dirección pública) no se pide nada.
 * Documentación: developer.android.com/privacy-and-security/local-network-permission
 */
public final class RedLocal {

    /** Android 17 (API 37): desde aquí el permiso es obligatorio para las apps con targetSdk 37 */
    private static final int ANDROID_17 = 37;

    private RedLocal() {
    }

    public static String permiso() {
        return Manifest.permission.ACCESS_LOCAL_NETWORK;
    }

    /** true si hay que pedir el permiso antes de hablar con la API. */
    public static boolean hayQuePedir(Context context) {
        if (Build.VERSION.SDK_INT < ANDROID_17) {
            return false;
        }
        if (ContextCompat.checkSelfPermission(context, permiso()) == PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        return esLocal(context.getString(R.string.api_url_base));
    }

    /**
     * ¿La URL apunta a la red local? Direcciones privadas IPv4 (10.x, 172.16-31.x, 192.168.x), de enlace
     * local (169.254.x) y nombres «.local». No se resuelve el nombre (DNS) para no hacer red aquí.
     * Es Java puro: se prueba en RedLocalTest.
     */
    public static boolean esLocal(String url) {
        String host;
        try {
            host = URI.create(url).getHost();
        } catch (IllegalArgumentException e) {
            return false;
        }
        if (host == null) {
            return false;
        }
        host = host.toLowerCase(java.util.Locale.ROOT);
        if (host.endsWith(".local")) {
            return true;
        }
        String[] partes = host.split("\\.");
        if (partes.length != 4) {
            return false;
        }
        int[] n = new int[4];
        for (int i = 0; i < 4; i++) {
            try {
                n[i] = Integer.parseInt(partes[i]);
            } catch (NumberFormatException e) {
                return false; // es un nombre (p. ej. symfony.3-208-228-110.sslip.io), no una IP
            }
        }
        return n[0] == 10
                || (n[0] == 172 && n[1] >= 16 && n[1] <= 31)
                || (n[0] == 192 && n[1] == 168)
                || (n[0] == 169 && n[1] == 254);
    }
}
