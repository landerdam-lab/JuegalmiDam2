// URL base de la API en la APK (ng build usa este archivo).
// - Emulador con la API en el PC: http://10.0.2.2:8081/api
// - VM de VirtualBox: http://192.168.2.75:8001/api (sin TLS: el WebView no acepta un certificado local)
// - AWS mientras no haya HTTPS (A-32): http://symfony.3-208-228-110.sslip.io/api
export const environment = {
  production: true,
  apiUrl: 'http://192.168.2.75:8001/api',
};
