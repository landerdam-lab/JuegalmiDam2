import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { apiInterceptor } from './core/api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Los parámetros de la URL (:id, ?tipo=…) llegan a las pantallas como input()
      withComponentInputBinding(),
      // Al cambiar de página se vuelve arriba; los enlaces #historia bajan a su sección
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    // fetch en vez de XMLHttpRequest; el interceptor pone el token y traduce los errores
    provideHttpClient(withFetch(), withInterceptors([apiInterceptor])),
  ],
};
