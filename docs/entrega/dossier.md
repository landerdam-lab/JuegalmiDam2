# Dossier del proyecto: Almi Companion para JuegAlmi (E-09)

> **Borrador para revisar en grupo.** Sustituye a `dossier-especificacion-tecnica.pdf`, que describe el modelo v2 (A-30). Lo ha redactado Claude Code a partir de la bóveda y del código. Hay que revisarlo, completar lo marcado con **[GRUPO]** y poder defender cada punto. Para entregarlo, expórtalo a PDF.

## 1. Portada y equipo

Reto 2 · DAM2 · Centro de Estudios ALMI · curso 25-26. **Equipo:** Lander, Oier y Ruben. **[GRUPO]** Completar el reparto final de áreas (P-31).

**Enlaces de la demo** (solo responden con el laboratorio de AWS encendido):
- Web: https://web.3-208-228-110.sslip.io
- API: https://symfony.3-208-228-110.sslip.io/api
- Repositorio (privado): https://github.com/landerdam-lab/JuegalmiDam2

## 2. Introducción y objetivos

JuegAlmi es una tienda ficticia que vende y alquila videojuegos, vende y repara consolas, y vende y repara móviles y tablets. Su cliente puede comprar, alquilar y pedir reparaciones desde el móvil, y la empresa lo gestiona todo desde una web. «Almi Companion» es el nombre de la app de la tienda (ADR-036).

## 3. Propuesta y desviaciones

- Propuesta del Hito 1: `propuesta-hito1.md`.
- Cambios respecto al enunciado y a la propuesta: `anexo-desviaciones.md`.

## 4. Arquitectura y tecnologías

```
 Android nativa ─┐
 Ionic (APK)    ─┼─ HTTPS ─▶ Bastión + Nginx Proxy Manager ─▶ API Symfony ─▶ MariaDB
 Web Angular    ─┘            (subred pública)                 (subred privada)
```

| Pieza | Tecnología | Por qué |
|---|---|---|
| API | PHP 8.3, Symfony 7.4, Doctrine | Lo pide el enunciado; ORM y tokens propios |
| Base de datos | MariaDB 11.4 | Compatible con MySQL (ADR-011). **[GRUPO]** Confirmar con el profesor (P-33) |
| App nativa | Java, XML, minSdk 26 | ADR-027 |
| App híbrida | Ionic 9, Angular 22, Capacitor 8 | Una sola base de código web compilada como APK (ADR-024, ADR-031) |
| Web | Angular 22, sin Ionic | Publicidad, catálogo y gestión (ADR-024, ADR-041) |
| Nube | AWS: bastión, subred privada, NAT, S3 | ADR-010 |

**Regla de la arquitectura:** las apps y la web solo hablan con la API. La lógica de negocio (stock, copias, precios, permisos) vive en la API.

## 5. Base de datos

- **21 tablas**, modelo v7, sin redundancia. Herencia `usuario` → `cliente` / `trabajador` y `producto` → `videojuego` / `movil` / `consola`. Tres relaciones N:M con atributos: `compra`, `alquiler` y `producto_proveedor` (precio de coste por proveedor, ADR-042).
- **Diagramas:** `docs/datos/er-juegalmi.png` y `docs/datos/relacional-juegalmi.png`, regenerados el 2026-11-06 desde el `.drawio`.
- **Coincidencia con el E-R:** comprobado el 2026-11-05 que todas las columnas de la base de datos de AWS aparecen en el modelo relacional del diagrama.
- **Integridad:** claves externas, UNIQUE, CHECK y 10 triggers, cargados con migraciones. Doctrine no genera los CHECK ni los triggers, por eso van a mano (A-09). Nunca se usa `doctrine:schema:update`.
- **Copias:** cada día a las 09:00 a un bucket S3 privado y cifrado, y luego a Glacier. Restauración probada el 2026-10-29. Guía: `docs/infraestructura/copias-de-seguridad.md`.

## 6. API

- **REST:** GET, POST, PUT y DELETE. Lista completa en la bóveda (`05-API/Endpoints.md`).
- **Errores:** `{"error": {"codigo", "mensaje", "campos"}}` con 400, 401, 403, 404, 409 y 422.
- **Tokens:** el login entrega un token aleatorio de 2 horas; en la base de datos solo se guarda su SHA-256. Todo exige token salvo login y registro.
- **Excepción confirmada por el profesor:** los `GET` de catálogo y tienda son públicos para la web (ADR-028). Las apps envían el token igualmente.
- **Login y registro ignoran un token antiguo** (A-51). Si no, una app con la sesión caducada no podría volver a entrar.
- **Ubicación:** las apps envían `X-Latitud` y `X-Longitud`, y la API lo guarda en `registro_ubicacion` (ADR-014).
- **HTTPS:** lo pone Nginx Proxy Manager con Let's Encrypt, delante de Symfony (ADR-010). **[GRUPO]** La rúbrica dice «integrado en Symfony»: confirmar con el profesor (P-33).

## 7. App Android nativa

Solo para clientes (ADR-024). Volley para las lecturas, Retrofit para las escrituras, Glide con placeholder para las imágenes, RecyclerView y CardView, Tabs y Navigation Drawer. Incluye GPS, cámara, voz, acelerómetro (agitar para refrescar), mapa con OSMDroid y tema claro y oscuro. Guía: `android/README.md`.

### Hilos y procesos

- **Hilos:** las colas de Volley y Retrofit, Glide, y un `ExecutorService` con `Handler` para reducir las fotos.
- **Procesos:** `FotoService` corre en un proceso aparte (`android:process=":fotos"`, ADR-039).
- **Sin AsyncTask:** está obsoleta desde la API 30 (A-12). La rúbrica la nombra como ejemplo, y Executors, Volley y Retrofit cumplen la misma función con una alternativa actual.
- **Vista y datos separados:** la vista llama a repositorios, y estos al cliente HTTP.

## 8. App Ionic

Mismas pantallas (`PT-xx`) y mismos datos que la nativa. La «Factory» del enunciado es un concepto de AngularJS: aquí son servicios `@Injectable` con `HttpClient` (A-15). Capacitor da acceso a GPS, cámara y voz. Guía: `ionic/README.md`.

**Comparación con la nativa:** el 2026-11-05 se compararon las pantallas una a una y se igualó Ionic con la nativa (`comparativa-apps/`).

## 9. Web

**Pública:** portada, catálogo, ficha, la tienda y descarga de las dos APK. **Backoffice:** el admin gestiona productos, proveedores (con el precio de coste y el margen de cada producto), clientes, trabajadores, pedidos, reparaciones y tienda; el técnico solo ve las reparaciones de su departamento. Guía: `web/README.md`.

## 10. Generar e instalar las APK

Las dos APK están firmadas con la clave del grupo y apuntan a la API de AWS. **Se descargan desde el final de la portada de la web.**

**App nativa** (la clave se configura en `android/keystore.properties`, que no se sube):
```bash
cd android
./gradlew assembleRelease     # app/build/outputs/apk/release/app-release.apk
```

**App Ionic** (necesita JDK 21):
```bash
cd ionic
npx ng build                  # genera www/ con la URL de producción
npx cap sync android          # copia la web al proyecto de Android
cd android && ./gradlew assembleRelease
# Resultado sin firmar: primero zipalign, después apksigner
zipalign -f -p 4 app-release-unsigned.apk alineada.apk
apksigner sign --ks almi-companion.jks --ks-key-alias almi --out AlmiCompanion-ionic.apk alineada.apk
```

**Comprobar:** `apksigner verify --print-certs <apk>`.

**Instalar en un móvil:**
1. Abre la web en el móvil y baja hasta «Almi Companion en tu móvil».
2. Pulsa **APK nativa** o **APK Ionic**.
3. Abre el archivo descargado y permite instalar apps de fuentes desconocidas si Android lo pide.
4. Acepta los permisos de ubicación, cámara y micrófono al usar cada función.

Por cable: `adb install -r AlmiCompanion-android.apk`.

**[GRUPO]** Añadir capturas del proceso en el móvil real.

## 11. Pruebas

| Dónde | Herramienta | Resultado (2026-11-05; API y web, 2026-11-06) |
|---|---|---|
| API | PHPUnit, con la base de datos real | 51 en verde |
| Android | JUnit | 23 en verde |
| Ionic | Vitest y ESLint | 9 en verde, lint sin errores |
| Web | Vitest | 20 en verde |
| Las dos apps | Emulador (Android 17) contra AWS | Login, catálogo, ficha, carrito y navegación |
| Las dos apps | Móvil real (Android 16) | Registro e inicio de sesión contra AWS |

**[GRUPO]** Falta en un móvil real: una frase de voz en las dos apps, cámara, GPS y una compra completa. El emulador no tiene micrófono.

## 12. Sistemas y seguridad en la nube

Bastión como única entrada SSH, API y base de datos en subred privada sin IP pública, grupos de seguridad mínimos, proxy inverso con HTTPS, Adminer y panel del proxy limitados a una IP, usuarios de base de datos sin `root` y copias cifradas. Sin credenciales en los servidores: usan un perfil de instancia. Detalle: `docs/infraestructura/`.

Digitalización y Sostenibilidad no se evalúan, salvo el bastión (profesor, 2026-10-28, A-17). **[GRUPO]** Pedir la confirmación por escrito.

## 13. Uso de IA

Se ha usado Claude Code para programar, probar, revisar y documentar. El registro de cada uso está en la bóveda (`09-Transversal/Registro de uso de IA.md`). **[GRUPO]** Cada integrante debe poder explicar todo lo generado.

## 14. Manual de usuario

**Cliente (apps):** regístrate o entra, busca en el catálogo con el texto, el micro o los filtros, añade al carrito, elige método de pago y entrega, y confirma. Consulta pedidos, alquileres y reparaciones en el menú. Para pedir una reparación, elige departamento, describe la avería y añade una foto.

**Admin (web, `/acceso`):** gestiona catálogo, usuarios, pedidos, devoluciones, reparaciones y tienda. No compra ni alquila (ADR-029).

**Técnico (web, `/acceso`):** ve las reparaciones de su departamento y actualiza estado y presupuesto.

**Cuentas de demostración** (contraseña `demo1234`): `cliente1@juegalmi.test`, `admin@juegalmi.test`, `tecnico.consolas1@juegalmi.test`.

## 15. Conclusiones, líneas futuras y licencias

**[GRUPO]** Conclusiones y líneas futuras: esta parte debe escribirla el grupo.

**Imágenes:** los productos y parte de la galería vienen de Wikipedia y Wikimedia Commons, con uso académico sin fin comercial (`docs/datos/imagenes-productos.md`, A-50). Las de ambientación de la portada están generadas con IA.
