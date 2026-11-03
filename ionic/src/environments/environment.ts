// URL base de la API: este es el ÚNICO sitio donde se define (ionic serve).
// - VM de VirtualBox: https://192.168.2.75:8001/api (aceptar antes el certificado en el navegador)
// - API en el PC con Docker: http://localhost:8081/api
export const environment = {
  production: false,
  apiUrl: 'https://192.168.2.75:8001/api',
};
