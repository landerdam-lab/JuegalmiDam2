// URL base de la API en la APK (ng build usa este archivo). Solo HTTPS: la APK se sirve desde https://localhost,
// y el WebView bloquearía una API por HTTP como contenido mixto.
export const environment = {
  production: true,
  apiUrl: 'https://symfony.3-208-228-110.sslip.io/api',
};
