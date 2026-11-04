// URL base de la API: este es el ÚNICO sitio donde se define (ionic serve).
// - VM de VirtualBox: http://192.168.2.75:8001/api (la API se sirve sin TLS con php -S)
// - API en el PC con Docker: http://localhost:8081/api
export const environment = {
  production: false,
  apiUrl: 'http://192.168.2.75:8001/api',
};
