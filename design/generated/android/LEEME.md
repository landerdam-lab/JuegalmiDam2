# Recursos de Android generados (GENERADO desde design/tokens.json con npm run tokens:build. No editar a mano.)

Copia el contenido de `res/` en:
- App nativa: `android/app/src/main/res/`
- APK de Ionic (Capacitor): `ionic/android/app/src/main/res/` (después de `npx cap add android`)

## Qué hay
| Fichero | Contenido |
|---|---|
| `values/ja_colores.xml` · `values-night/ja_colores.xml` | Colores claro/oscuro (`@color/ja_*`) |
| `values/ja_colores_fijos.xml` | Colores del icono y el splash (no cambian con el modo) |
| `values/ja_dimens.xml` | Espaciado, radios, muesca, elevación, tamaños y tamaños de letra |
| `values/ja_integers.xml` | Duraciones de animación (ms) |
| `values/ja_tipos.xml` | `TextAppearance.JuegAlmi.*` (12 niveles) |
| `values/ja_formas.xml` | La muesca (`ShapeAppearance.JuegAlmi.Muesca`) y los estilos de tarjeta, botones, campo, chip y pestañas |
| `values/themes.xml` · `values-night/themes.xml` | `Theme.JuegAlmi` (Material 3, edge-to-edge) y `Theme.JuegAlmi.Splash` |
| `interpolator/ja_*.xml` | Curvas de movimiento |
| `drawable/ic_launcher_foreground.xml` · `mipmap-anydpi-v26/ic_launcher*.xml` | Icono adaptativo (cartucho con muesca) |

## Requisitos
- Dependencias: `com.google.android.material:material` (1.12 o superior, para Material 3) y `androidx.core:core-splashscreen`.
- **Fuentes** en `res/font/` (Google Fonts, licencia OFL): `bricolage_grotesque.ttf`, `dm_sans.ttf`, `jetbrains_mono.ttf`
  (o sus variantes por peso con un `font-family` XML). Sin ellas, la compilación falla porque los estilos las referencian.
- Los nombres de fichero llevan el prefijo `ja_` para no pisar los `colors.xml`/`themes.xml` que crea Android Studio:
  borra los colores y el tema por defecto del proyecto y deja solo estos.
