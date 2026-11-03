# Almi Companion · app híbrida (Ionic + Angular + Capacitor)

App **solo para clientes** (ADR-024), compilada como **APK de Android**, con el mismo diseño y las mismas funciones que la nativa de `android/`. Las pantallas siguen los ID `PT-xx` de `08-Diseno-UI/Mapa de pantallas.md`, y cada una lo indica en un comentario.

Versiones: Angular 22.2, Ionic 9.0, Capacitor 8.6. Hace falta Node **24** (Angular no admite Node 22 por debajo de 22.22.3).

## Comandos

```bash
npm install
npx ionic serve            # en el navegador; necesita CORS para http://localhost:8100
npm run test:unit          # pruebas unitarias (Vitest): órdenes de voz, validaciones, precios, fechas
npx playwright test        # pruebas de la app en el navegador (primero: npx playwright install chromium)
npx eslint src             # comprobación de estilo
```

## La URL de la API, en un solo sitio

| Archivo | Se usa en |
|---|---|
| `src/environments/environment.ts` | `ionic serve` |
| `src/environments/environment.prod.ts` | la APK |

Cada archivo lista en sus comentarios las URL habituales (VM, Docker, emulador, AWS).

⚠️ **La VM de VirtualBox usa un certificado local que el WebView de Android no acepta.** Para probar la APK contra ella, hay que arrancar la API sin TLS: `symfony server:start -d --no-tls --allow-all-ip --port=8002` (el 8000 de esa VM lo usa otro proyecto, A-36). Mientras la API vaya por HTTP (A-32), `capacitor.config.ts` carga la app desde `http://localhost`; con el HTTPS final se quita ese bloque.

## Generar la APK

Requisitos: Android SDK 36 y **JDK 21** (el JDK 25 de Android Studio no sirve con el Gradle de Capacitor).

```bash
npx ng build
npx cap sync android
cd android
./gradlew assembleDebug    # app/build/outputs/apk/debug/app-debug.apk
```

Para la entrega, `./gradlew assembleRelease` y firmar la APK con la clave del grupo (la misma de la app nativa, fuera del repo) con `apksigner sign`.

Se instala junto a la nativa porque tiene otro identificador: `com.juegalmi.companion` (la nativa es `com.juegalmi.app`).

## Cómo está organizada

```
src/app/
  core/      servicios (la «Factory» del enunciado, A-15), modelos, interceptor y lógica pura
  shared/    componentes comunes: barra, tarjeta, imagen con placeholder, estados, mapa, barra de vida…
  pages/     una carpeta por área, y un archivo por pantalla
src/theme/   tema Cartucho, copiado de design/generated/ionic/theme (no se edita a mano)
```

Tres reglas que conviene saber para defenderla:

1. **La vista no llama a `HttpClient`:** página → servicio de `core/` → `ApiService`. El token, las cabeceras `X-Latitud`/`X-Longitud` y el 401 están en un solo sitio: `core/api.interceptor.ts`.
2. **Sin zone.js:** Angular repinta al cambiar un *signal* o tras un evento de la plantilla. Si un dato cambia desde código (una respuesta de la API, `ionViewWillEnter`), tiene que ser un `signal`; un campo normal no se vería.
3. **Ionic mantiene vivas las páginas en la pila:** lo que debe recargarse al volver a una pantalla va en `ionViewWillEnter`, no en `ngOnInit`.

## Requisitos de la rúbrica, y dónde están

| Requisito | Dónde |
|---|---|
| GPS con librería | `core/ubicacion.service.ts` (`@capacitor/geolocation`) |
| Cámara | `core/camara.service.ts` (`@capacitor/camera`) |
| Control por voz | `core/voz.service.ts` + `core/orden-voz.ts` |
| Otro sensor | `core/agitar.service.ts` (acelerómetro, `@capacitor/motion`) |
| Mapa interactivo | `shared/mapa.component.ts` (Leaflet, ADR-037) |
| Sesión en Local Storage | `core/sesion.service.ts` |
| Placeholder en las imágenes | `shared/imagen.component.ts` |
| Interfaz adaptativa | `.ja-lista` en `src/global.scss` (1 a 4 columnas) |
