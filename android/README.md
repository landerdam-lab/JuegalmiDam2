# App Android nativa · Almi Companion (JuegAlmi)

App **solo para clientes** (ADR-024) en **Java + XML**: catálogo, carrito, pedidos, alquileres, reparaciones, perfil y la sección **La tienda** (Servicios, Ubicación, Galería, Historia). Pantallas `PT-01` a `PT-29` del Mapa de pantallas de la bóveda.

- Paquete `com.juegalmi.app` · minSdk 26 · targetSdk/compileSdk 37 · AGP 9.3.3 · Gradle 9.5.0
- Librerías y versiones: `gradle/libs.versions.toml`

## 1. Abrir y ejecutar

1. Android Studio → **Open** → carpeta `android/` (no la raíz del repo). Android Studio crea `local.properties` con la ruta del SDK (no se sube).
2. La app ya apunta a la API de AWS con HTTPS (`https://symfony.3-208-228-110.sslip.io/api/`; tiene que estar encendido el laboratorio). La URL está en **un solo sitio**: `app/src/main/res/values/api.xml`. Para usar otra API, cámbiala **solo en local**:
   - Emulador con la API en el PC: `http://10.0.2.2:8000/api/`
   - Por `http://` solo funciona en **debug** y con los dominios de `app/src/debug/res/xml/network_security_config.xml` (`10.0.2.2` y la VM del aula). La release solo admite HTTPS.
   - Si en Windows el puerto 8000 está ocupado por `wslrelay` (WSL/Docker), el emulador se queda colgado: usad otro puerto (p. ej. 8081) y cambiad `api.xml` **solo en local** (aviso A-36).
3. **Run** (o `./gradlew installDebug`). Usuarios de ejemplo: `cliente1@juegalmi.test` … `cliente4@juegalmi.test` / `demo1234` (solo los **clientes** pueden entrar).
4. **Android 17 (targetSdk 37):** para hablar con una API de la **red local** (`10.0.2.2`, `192.168.x.x`) la app necesita el permiso **Dispositivos cercanos** (`ACCESS_LOCAL_NETWORK`). Lo pide sola al abrirse (`util/RedLocal`); si se deniega, la conexión se queda esperando y da «No hay conexión». Con la API en AWS no se pide.

Desde la terminal hace falta el JDK de Android Studio:

```bash
# Git Bash en Windows
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
./gradlew assembleDebug                 # APK de prueba en app/build/outputs/apk/debug/
```

## 2. Pruebas

```bash
./gradlew testDebugUnitTest             # JUnit en el PC: validaciones, formatos, fechas, subtotales del carrito y red local
./gradlew connectedDebugAndroidTest     # en el emulador o el móvil: FotoService en otro proceso
```

## 3. APK firmada para la entrega

La APK de entrega es la **release** firmada con una clave del grupo. **Ni la clave (`*.jks`) ni sus contraseñas se suben a Git.**

1. Crear la clave **una sola vez** (guardadla bien: con otra clave, la app no se puede actualizar encima):
   ```bash
   keytool -genkeypair -v -keystore almi-companion.jks -alias almi -keyalg RSA -keysize 2048 -validity 10000
   ```
   (`keytool` está en `"$JAVA_HOME/bin"`). Guardad el `.jks` fuera del repo o en `android/` (está ignorado).
2. Crear `android/keystore.properties` (ignorado por Git) con:
   ```properties
   storeFile=almi-companion.jks
   storePassword=...
   keyAlias=almi
   keyPassword=...
   ```
   `storeFile` es relativo a `android/` (o una ruta absoluta).
3. Generar la APK: `./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release.apk`.
   Sin `keystore.properties`, la release sale **sin firmar** y no se puede instalar.
   (También desde Android Studio: **Build → Generate Signed App Bundle or APK → APK**.)
4. Comprobar la firma: `apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk` (`apksigner` está en `build-tools/` del SDK).
5. Instalar en el móvil:
   - Con cable: activar **Opciones de desarrollador → Depuración USB** y `adb install -r app-release.apk`.
   - Sin cable: copiar la APK al móvil, abrirla y permitir **instalar apps de origen desconocido**.
6. Antes de la entrega: la URL de `api.xml` tiene que ser la del servidor (AWS) y no la del emulador.

## 4. Cómo está hecho (para la defensa)

| Tema | Dónde | Resumen |
|---|---|---|
| Vista separada de los datos | `ui/` → `data/repository/` → `data/api/` | Las pantallas solo hablan con los repositorios; no saben si se usa Volley o Retrofit |
| Volley (lecturas) y Retrofit (escrituras) | `data/api/VolleyClient`, `RetrofitClient` | Las dos ponen las mismas cabeceras (`CabecerasApi`): token + `X-Latitud`/`X-Longitud` |
| Sesión y 401 | `session/SessionManager`, `data/api/SesionCaducada` | SharedPreferences; ante un 401 se borra la sesión y se vuelve al login |
| Varios hilos | Volley, Retrofit (`enqueue`), Glide y el `Executor` de `FotoService` | Nada de red ni de imágenes en el hilo principal. AsyncTask no se usa (obsoleta, A-12) |
| **Varios procesos** (ADR-039) | `data/FotoService` (`android:process=":fotos"`) | La foto de la cámara se reduce en otro proceso; vuelve por un `ResultReceiver` (Binder). En Logcat, el PID de «Foto reducida» no es el de la app |
| Permisos en tiempo de ejecución | `MainActivity`, `ui/auth/AuthActivity`, `util/RedLocal` | Ubicación (con explicación previa) y, en Android 17, red local solo si la API está en la LAN |
| Interfaz adaptativa | `res/values-w600dp`, `-w840dp`, `-w1200dp` (`adaptativo.xml`) | Al girar o en tablet: listas en 2-4 columnas y formularios en una columna centrada |
| Sensores | `util/UbicacionHelper`, `util/Camara`, `util/AgitarDetector`, voz en Inicio | GPS, cámara (`TakePicture` + FileProvider), acelerómetro (agitar para refrescar) y reconocimiento de voz |
| Diseño «Cartucho» | `res/values/ja_*.xml` (generados desde `design/tokens.json`) | Nada de colores, fuentes ni espacios a mano |
