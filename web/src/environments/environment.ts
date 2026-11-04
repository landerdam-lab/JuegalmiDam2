// URL base de la API: este es el ÚNICO sitio donde se define (Convenciones: "en un solo sitio").
// - VM de VirtualBox del aula: http://192.168.2.75:8001/api (por HTTP hasta el HTTPS final, A-32 y A-40)
// - API en el PC con Docker:    http://localhost:8081/api
// - AWS (cuando esté desplegada): http://symfony.3-208-228-110.sslip.io/api
// La API tiene que permitir el origen de la web en CORS_ALLOW_ORIGIN (localhost:4200 ya lo está).
export const environment = {
  apiUrl: 'http://192.168.2.75:8001/api',
  // Enlace a la APK de Almi Companion. Mientras sea null, la portada no muestra el botón de descarga.
  apkUrl: null as string | null,
};
