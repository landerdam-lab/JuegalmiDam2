// URL base de la API en PRODUCCIÓN (npm run build): la API de AWS con HTTPS (2026-11-04).
// La web desplegada en https://web.3-208-228-110.sslip.io ya está admitida en su CORS.
// Solo responde con el laboratorio de AWS Academy encendido.
export const environment = {
  apiUrl: 'https://symfony.3-208-228-110.sslip.io/api',
  apkUrl: null as string | null,
};
