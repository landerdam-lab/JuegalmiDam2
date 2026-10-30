package com.juegalmi.app.ui.pedidos;

import android.content.Context;

import com.juegalmi.app.R;

/** Texto visible de pedido.metodo_pago (tarjeta, bizum, paypal, en_tienda). */
public final class MetodosPago {

    private MetodosPago() {
    }

    public static String texto(Context c, String metodo) {
        if (metodo == null) {
            return "";
        }
        switch (metodo) {
            case "tarjeta": return c.getString(R.string.pago_tarjeta);
            case "bizum": return c.getString(R.string.pago_bizum);
            case "paypal": return c.getString(R.string.pago_paypal);
            case "en_tienda": return c.getString(R.string.pago_en_tienda);
            default: return metodo;
        }
    }
}
