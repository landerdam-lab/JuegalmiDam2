# Almi Companion · Web (Angular)

Web de JuegAlmi con dos partes que usan **la misma API** que las apps (nunca la BBDD):

- **Pública, sin login** (ADR-028): portada, catálogo, ficha de producto y «La tienda».
- **Backoffice** (`/admin`) para el **admin** (toda la gestión) y los **técnicos** (solo las reparaciones de su departamento), ADR-024 y ADR-032.

Bóveda: `12-Web/Web - vision general.md` · pantallas `PW-xx` en `08-Diseno-UI/Mapa de pantallas.md`.

## Arrancar

```bash
npm install
npm start            # ng serve → http://localhost:4200
npm test             # 17 pruebas unitarias (Vitest)
npm run build        # versión de producción en dist/almi-companion-web/browser
```

- **Versiones** (ADR-031, fijadas al crear el proyecto el 2026-11-04): Angular **22.2.4** (CLI 22.2.5), TypeScript 6.0, Leaflet 1.9.4, Node 24 o superior.
- **URL de la API**: `src/environments/environment.ts` para desarrollo (`npm start`: la VM del aula, `http://192.168.2.75:8001/api`) y `environment.prod.ts` para producción (`npm run build`: la API de AWS, `https://symfony.3-208-228-110.sslip.io/api`). Angular cambia uno por otro al compilar (`fileReplacements` en `angular.json`).
- **CORS**: la API tiene que permitir el origen de la web en `CORS_ALLOW_ORIGIN` (`localhost:4200` ya entra). En AWS ya está admitido `https://web.3-208-228-110.sslip.io`.
- **Usuarios de prueba** (datos de ejemplo de la API, contraseña `demo1234`): `admin@juegalmi.test` y los técnicos `tecnico.telefonia1@juegalmi.test`, `tecnico.consolas1@juegalmi.test`…

## Pantallas

| ID | Ruta | Quién | Qué hace |
|---|---|---|---|
| PW-01 | `/` | todos | Portada: las 3 líneas como «cartuchos», juegos para alquilar, consolas y telefonía, reparaciones con precios, mapa de la tienda y la app |
| PW-02 | `/catalogo` | todos | Pestañas por tipo, buscador, filtros (plataforma, género, PEGI, alquilables, formato, marca) y orden. Los filtros viven en la URL |
| PW-03 | `/producto/:id` | todos | Ficha con precio, alquiler, disponibilidad y características; «Disponible en la app» en vez de comprar |
| PW-04 | `/tienda` | todos | Servicios por línea (3 pestañas), mapa OpenStreetMap con «Cómo llegar», galería con visor e historia |
| PW-05 | `/acceso` | personal | Login con Signal Forms. Un cliente no puede entrar (se le cierra el token y se le avisa) |
| PW-10 | `/admin` | admin | Resumen: pedidos por preparar, alquileres retrasados, reparaciones abiertas y stock bajo |
| PW-11 | `/admin/productos` | admin | CRUD de videojuegos, móviles y consolas, subida de imagen, retirar (baja lógica) y borrar |
| PW-12 | `/admin/catalogos` | admin | Marcas y plataformas (edición en la fila) y servicios por línea |
| PW-13 | `/admin/clientes` | admin | Buscar, alta, edición, desactivar y borrar |
| PW-14 | `/admin/trabajadores` | admin | Técnicos (con departamento y reparaciones abiertas) y admins |
| PW-15 | `/admin/pedidos` | admin | Pedidos (ficha, entrega en el mapa, cambio de estado) y alquileres (registrar o deshacer la devolución) |
| PW-16 | `/admin/reparaciones` | admin y técnico | Tarjetas con la barra de vida de 4 pasos; estado, presupuesto y técnico (solo el admin reasigna) |
| PW-17 | `/admin/tienda` | admin | Datos e historia; la ubicación se elige pulsando en el mapa; galería (subir, describir, quitar) |
| PW-18 | `/admin/ubicaciones` | admin | Registro de ubicaciones (RF-11) en mapa y tabla, por cliente y fechas |
| — | `/admin/perfil` | admin y técnico | Datos propios y contraseña (`PUT /me`) |

## Cómo está hecho (para defenderlo)

```
src/
├── environments/                 URL de la API: desarrollo (VM) y producción (AWS)
├── theme/                        COPIA EXACTA de design/generated/ionic/theme (no se edita)
├── styles.scss                   Estilos globales: botones, campos, tablas, hojas… todo con var(--ja-*)
└── app/
    ├── core/      Servicios y modelos: la vista nunca llama a HttpClient
    │   ├── api.ts, api.interceptor.ts, api-error.ts   cliente HTTP, token y errores
    │   ├── sesion.ts, auth.ts, guardas.ts             sesión, login y protección de /admin
    │   └── catalogo.ts, pedidos.ts, reparaciones.ts, personas.ts, tiendas.ts, ubicaciones.ts
    ├── shared/    Componentes reutilizables: icono, imagen con placeholder, mapa, barra de vida,
    │              pastilla de estado, estados vacío/error/carga, paginador, hoja lateral, diálogos
    ├── publico/   PW-01 a PW-04
    └── admin/     PW-05 y PW-10 a PW-18
```

- **Capas** (regla 7): pantalla → servicio de `core/` → `Api` → `HttpClient`. El **interceptor** pone `Authorization: Bearer <token>` y, ante un **401**, cierra la sesión y lleva al acceso.
- **Sesión** en `sessionStorage`: se cierra al cerrar el navegador (es el ordenador de la tienda).
- **Guardas**: `sesionGuard` (hay que ser trabajador), `adminGuard` (el técnico acaba en sus reparaciones) e `invitadoGuard`. Son solo comodidad: **la API vuelve a comprobar el rol** en cada petición.
- **Signals y `resource()`**: cada pantalla declara qué datos necesita y Angular los pide en segundo plano (nada bloquea la página) con tres estados: cargando (esqueleto), error (Reintentar) y datos. Lo que depende de la URL (filtros, página) se vuelve a pedir solo.
- **Formularios con Signal Forms** (`@angular/forms/signals`, estables en Angular 22): el modelo es un signal, las reglas se declaran en un esquema y los errores salen **debajo del campo**, en español y diciendo cómo corregirlo. Los errores 422 de la API también se ponen en su campo.
- **Mapas**: Leaflet + OpenStreetMap, sin clave, igual que Ionic (ADR-037). La web **no envía** `X-Latitud`/`X-Longitud` (P-37 aplazado).
- **Sistema «Cartucho»** (ADR-022): mismos tokens, fuentes e iconos (Material Symbols Rounded, en `public/iconos`) que las apps; modo oscuro con la clase `.ion-palette-dark`, como Ionic. Firma visual: la muesca en tarjetas, hojas y menú, y la barra de vida para pedidos (3), reparaciones (4) y copias de alquiler (5).
- **Carga rápida**: cada pantalla se descarga al visitarla (`loadComponent`); la carga inicial pesa unos **92 kB** comprimidos. Imágenes con `loading="lazy"` y placeholder.
- **Accesibilidad**: foco visible, zonas táctiles de 48 px, estados con color + icono + texto, `aria-live` en avisos y diálogos nativos (`<dialog>`) que atrapan el foco y se cierran con Escape.

## Pendiente

- Botón de descarga de la APK: poner su URL en `environment.apkUrl` cuando esté publicada.
- Desplegar en AWS: copiar `dist/almi-companion-web/browser` al nginx de la red privada (`https://web.3-208-228-110.sslip.io`), con `try_files $uri $uri/ /index.html;` para que funcionen las rutas de Angular al recargar.
