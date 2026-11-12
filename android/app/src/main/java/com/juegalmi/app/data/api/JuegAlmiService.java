package com.juegalmi.app.data.api;

import com.juegalmi.app.data.model.Pedido;
import com.juegalmi.app.data.model.Peticiones;
import com.juegalmi.app.data.model.RegistroPeticion;
import com.juegalmi.app.data.model.Reparacion;
import com.juegalmi.app.data.model.Usuario;

import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Part;
import retrofit2.http.Path;


public interface JuegAlmiService {

    @POST("registro")
    Call<Usuario> registro(@Body RegistroPeticion peticion);

    @PUT("me")
    Call<Usuario> actualizarPerfil(@Body Peticiones.Perfil perfil);

    @POST("pedidos")
    Call<Pedido> crearPedido(@Body Peticiones.NuevoPedido pedido);

    @PUT("pedidos/{id}")
    Call<Pedido> cambiarEstadoPedido(@Path("id") int id, @Body Peticiones.CambioEstado estado);

    @POST("reparaciones")
    Call<Reparacion> crearReparacion(@Body Peticiones.NuevaReparacion reparacion);

    @PUT("reparaciones/{id}")
    Call<Reparacion> cambiarEstadoReparacion(@Path("id") int id, @Body Peticiones.CambioEstado estado);

    @Multipart
    @POST("imagenes")
    Call<Peticiones.ImagenSubida> subirImagen(@Part MultipartBody.Part imagen, @Part("carpeta") RequestBody carpeta);
}
