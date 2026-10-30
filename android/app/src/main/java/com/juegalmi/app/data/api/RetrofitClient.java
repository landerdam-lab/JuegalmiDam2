package com.juegalmi.app.data.api;

import android.content.Context;

import com.juegalmi.app.R;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * Cliente de Retrofit (2.ª librería asíncrona, PSP 3). Usa la misma URL base y las mismas cabeceras
 * que Volley (CabecerasApi). Con enqueue() la petición va en un hilo de OkHttp, y en Android
 * Retrofit devuelve el resultado en el hilo principal.
 */
public final class RetrofitClient {

    private static RetrofitClient instancia;

    private final Context context;
    private final JuegAlmiService servicio;

    private RetrofitClient(Context context) {
        this.context = context.getApplicationContext();

        OkHttpClient http = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                // Interceptor: añade token y ubicación a cada petición y vigila los 401
                .addInterceptor(chain -> {
                    Request.Builder peticion = chain.request().newBuilder();
                    for (Map.Entry<String, String> c : CabecerasApi.crear(this.context).entrySet()) {
                        peticion.header(c.getKey(), c.getValue());
                    }
                    okhttp3.Response respuesta = chain.proceed(peticion.build());
                    if (respuesta.code() == 401) {
                        SesionCaducada.manejar(this.context);
                    }
                    return respuesta;
                })
                .build();

        servicio = new Retrofit.Builder()
                .baseUrl(this.context.getString(R.string.api_url_base))
                .client(http)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(JuegAlmiService.class);
    }

    public static synchronized RetrofitClient get(Context context) {
        if (instancia == null) {
            instancia = new RetrofitClient(context);
        }
        return instancia;
    }

    public JuegAlmiService servicio() {
        return servicio;
    }

    /** Lanza la llamada en segundo plano y traduce la respuesta a nuestro Callback (éxito o ApiError). */
    public <T> void enviar(Call<T> llamada, Callback<T> callback) {
        llamada.enqueue(new retrofit2.Callback<T>() {
            @Override
            public void onResponse(Call<T> call, Response<T> respuesta) {
                if (respuesta.isSuccessful()) {
                    callback.onExito(respuesta.body());
                    return;
                }
                String cuerpo = null;
                try (ResponseBody error = respuesta.errorBody()) {
                    if (error != null) {
                        cuerpo = error.string();
                    }
                } catch (IOException ignorada) {
                    // Sin cuerpo: ApiError usará el mensaje genérico
                }
                callback.onError(ApiError.desdeRespuesta(context, respuesta.code(), cuerpo));
            }

            @Override
            public void onFailure(Call<T> call, Throwable t) {
                callback.onError(ApiError.sinRed(context));
            }
        });
    }
}
