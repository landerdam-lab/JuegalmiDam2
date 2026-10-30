package com.juegalmi.app.util;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/** ¿Hace falta el permiso de red local de Android 17 para la URL de la API? (res/values/api.xml) */
public class RedLocalTest {

    @Test
    public void direccionesLocales() {
        assertTrue(RedLocal.esLocal("http://10.0.2.2:8000/api/"));        // el PC visto desde el emulador
        assertTrue(RedLocal.esLocal("https://192.168.2.75:8001/api/"));   // VM del aula
        assertTrue(RedLocal.esLocal("http://172.16.0.5/api/"));
        assertTrue(RedLocal.esLocal("http://172.31.255.1/api/"));
        assertTrue(RedLocal.esLocal("http://169.254.10.1/api/"));
        assertTrue(RedLocal.esLocal("http://servidor.local:8000/api/"));
    }

    @Test
    public void direccionesPublicas() {
        assertFalse(RedLocal.esLocal("http://symfony.3-208-228-110.sslip.io/api/")); // AWS
        assertFalse(RedLocal.esLocal("https://3.208.228.110/api/"));
        assertFalse(RedLocal.esLocal("http://172.32.0.1/api/"));         // fuera de 172.16-31
        assertFalse(RedLocal.esLocal("http://11.0.0.1/api/"));
    }

    @Test
    public void urlIncorrecta() {
        assertFalse(RedLocal.esLocal("no es una url"));
        assertFalse(RedLocal.esLocal(""));
    }
}
