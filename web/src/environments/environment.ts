// URL base de la API para el DESARROLLO (npm start / ng serve). Es el único sitio donde se define;
// la versión de producción (npm run build) usa environment.prod.ts, que Angular pone en su lugar.
// - VM de VirtualBox del aula: http://192.168.2.75:8001/api (por HTTP, A-40)
// - API en el PC con Docker:    http://localhost:8081/api
// La API tiene que permitir el origen de la web en CORS_ALLOW_ORIGIN (localhost:4200 ya lo está).
export const environment = {
  apiUrl: 'http://192.168.2.75:8001/api',
  // Enlaces a las dos APK de Almi Companion (web/public/descargas). Si son null, la portada no muestra el botón.
  apkUrl: '/descargas/AlmiCompanion-android.apk' as string | null,
  apkIonicUrl: '/descargas/AlmiCompanion-ionic.apk' as string | null,
};
