# JuegAlmi · Sistema de diseño «Cartucho»

> **Estado: APROBADO** (v1.0.0, 2026-10-28) → ADR-022 en la bóveda (`10-Decisiones/ADR-022 Sistema de diseno Cartucho.md`). Se irá ajustando al desarrollar cada sección: ver §14 «Cómo se ajusta».
>
> **Regla:** toda la interfaz de Android y de Ionic sigue este documento y consume `design/tokens.json` (a través de los ficheros generados). **Prohibido** poner colores, fuentes o espaciados a mano en el código.

| Fichero | Para qué |
|---|---|
| `tokens.json` | **Fuente única** de colores, tipografía, espaciado, radios, muesca, elevación, movimiento y tamaños (claro y oscuro) |
| `scripts/build-tokens.mjs` | `npm run tokens:build` → genera el tema de Ionic y los recursos de Android en `generated/` |
| `scripts/check-contrast.mjs` | `npm run tokens:check` → comprueba el contraste WCAG AA de todas las parejas de color |
| `SCREEN-MAP.md` | Pantalla `PT-xx` → página de Ionic → vista de Android → componentes → tokens → estados |
| `STITCH.md` | Proyecto de Stitch: ID, pantallas, prompts y cómo regenerarlo |
| `screens/` | Exportación de cada pantalla (PNG + HTML) en claro y oscuro |

---

## 1. Concepto

**«Cartucho»: una tienda de barrio con alma de consola.** Cada pieza de la interfaz *se inserta, encaja y se carga*.

Personalidad: **cercana · juguetona · fiable**.
- *Cercana*: papel cálido, lenguaje de tú, la tienda física siempre a un toque (Ubicación, Historia).
- *Juguetona*: la muesca, la barra de vida y el «ticket» con números monoespaciados.
- *Fiable*: estados que se entienden sin leer, precios claros y nada inventado.

### La idea única: la muesca
La **esquina superior derecha** de tarjetas, banners, hojas inferiores, el drawer y las miniaturas va **cortada a 45°**. Es la forma de un **cartucho**, de una **tarjeta SD** y de una **SIM**: las tres líneas de negocio de JuegAlmi (videojuegos, consolas y telefonía) comparten esa silueta. No es un adorno: es la forma del producto.
- Android: nativo de Material Components → `cornerFamilyTopRight = cut` (`ShapeAppearance.JuegAlmi.Muesca`).
- Ionic: `clip-path` → clase `.ja-muesca` / mixin `muesca()` (`generated/ionic/theme/cartucho.scss`).

### La segunda firma: la barra de vida
Todo progreso de un proceso de la tienda (reparación, alquiler, pedido, carga) se muestra como una **barra segmentada**, como la vida de un videojuego: 3 segmentos para el pedido, 4 para la reparación y 5 para el alquiler y las copias disponibles. Los segmentos se rellenan **a saltos** (no de forma continua).

---

## 2. Principios

1. **El dato manda.** Solo se muestra lo que existe en el modelo de datos (17 tablas). Nada de valoraciones, favoritos ni etiquetas inventadas (A-08).
2. **Una acción principal por pantalla.** Solo hay un botón amarillo; el resto es secundario (contorno) o de texto.
3. **El estado se ve sin leer, pero nunca solo con color.** Siempre van juntos el color, el icono y el texto.
4. **La misma pieza en todas partes.** Una tarjeta de producto se ve igual en Inicio, en el catálogo y en la búsqueda, y en Android igual que en Ionic.
5. **Ligero por defecto.** Sin degradados, desenfoques ni sombras pesadas: placeholder en las imágenes y esqueletos de carga (CPU mínima, requisito del enunciado).

### Anti-patrones (no se hacen)
- ❌ **Amarillo como texto sobre fondo claro** (contraste 1,5:1). El amarillo es relleno y, en oscuro, también texto.
- ❌ **Neones, degradados y efectos glass**, el «look gamer» genérico de los diseños beta. Gastan CPU y envejecen mal.
- ❌ **Bottom navigation bar.** La navegación es Drawer + pestañas (lo pide el enunciado). Dos sistemas de navegación a la vez confunden.
- ❌ Muesca en botones, campos o chips: solo la llevan los **contenedores**.
- ❌ Estrellas, corazones, «Exclusivo» u horarios que no están en la BBDD.

---

## 3. Color

Todos los valores están en `tokens.json → color.light / color.dark`. El nombre del token es el mismo en Ionic (`--ja-<token>`) y en Android (`@color/ja_<token>`).

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `fondo` | `#FBF8F3` | `#120D20` | Fondo de la app («papel de caja» / «noche de consola») |
| `superficie` | `#FFFFFF` | `#1C1630` | Tarjetas, hojas, drawer |
| `superficie-2` | `#F1ECF8` | `#272042` | Campos, chips, placeholders de imagen |
| `superficie-3` | `#E6DEF3` | `#352C55` | Segmentos vacíos de la barra de vida |
| `borde` | `#D8D0E5` | `#3E355E` | Borde de las tarjetas (decorativo) |
| `borde-campo` | `#857D9C` | `#7D73A3` | Borde de campos, casillas e interruptores (≥ 3:1) |
| `texto` | `#1C1530` | `#F4F0FB` | Tinta principal |
| `texto-2` | `#574E6E` | `#BDB4D2` | Secundario |
| `texto-3` | `#6E6685` | `#A097B8` | Ayudas y placeholders |
| `primario` | `#FFC629` | `#FFC629` | **Amarillo moneda**: el botón principal, insignias y foco en oscuro |
| `sobre-primario` | `#1C1530` | `#1C1530` | Texto sobre amarillo |
| `marca` | `#5B2EC2` | `#B9A0FF` | **Violeta**: enlaces, pestaña activa, selección y botón secundario |
| `marca-suave` | `#EDE5FF` | `#2E2552` | Fondo de la selección (chip, elemento del drawer) |
| `alquiler` / `-suave` | `#0B6E78` / `#DDF4F5` | `#5BD5DE` / `#103A40` | Todo lo relacionado con alquilar |
| `exito` / `-suave` | `#1A7A49` / `#DDF3E6` | `#5BD594` / `#123A26` | Entregado, en stock, obtenido |
| `aviso` / `-suave` | `#8F5300` / `#FFEDC7` | `#FFBE5C` / `#40300F` | Pendiente, en reparación, últimas unidades |
| `error` / `-suave` | `#BE2636` / `#FDE3E5` | `#FF7A86` / `#45161D` | Errores, retrasado, cancelada |
| `info` / `-suave` | `#2450C8` / `#E2E9FF` | `#8AAEFF` / `#1B2A55` | Preparado, lista, avisos informativos |
| `neutro-estado` / `-suave` | `#5E5872` / `#ECE9F1` | `#B4ADC7` / `#2C2640` | Recibida, devuelto, agotado, cancelado (pedido) |
| `velo` | tinta 40 % | negro 64 % | Fondo de modales y del drawer |
| `foco` | `#5B2EC2` | `#FFC629` | Anillo de foco (3 px) |

**Por qué estos colores:** el violeta y el amarillo vienen de los diseños beta del grupo y del logotipo («Almi» en amarillo), así que la marca no cambia. Lo que cambia es **cómo se usan**: el amarillo pasa a ser solo el botón principal, el violeta se encarga de la interacción y el cian queda reservado para el alquiler, para que alquilar y comprar no se confundan nunca.

### Colores de estado (los mismos en BBDD, API y apps)
| Enumerado | Valor → rol de color |
|---|---|
| `reparacion.estado` | `recibida` → neutro · `en_reparacion` → aviso · `lista` → info · `entregada` → éxito · `cancelada` → error |
| `pedido.estado` | `pendiente` → aviso · `preparado` → info · `entregado` → éxito · `cancelado` → neutro |
| alquiler (derivado) | activo → alquiler · retrasado → error · devuelto → neutro |
| stock (derivado) | disponible → éxito · ≤ 2 uds. → aviso · 0 → neutro («Agotado») |

En Ionic: `class="ja-estado ja-estado--reparacion-en_reparacion"`. En Android: el adaptador asigna `@color/ja_aviso` al texto y `@color/ja_aviso_suave` al fondo.

### Accesibilidad del color (verificada)
`npm run tokens:check` comprueba **34 parejas en claro y en oscuro**: todo el texto supera **4,5:1** y los bordes de componente y el foco superan **3:1** (WCAG 2.1 AA). El resultado más justo es `exito` sobre `exito-suave` en claro (4,60:1).

---

## 4. Tipografía

| Familia | Rol | Licencia |
|---|---|---|
| **Bricolage Grotesque** | Titulares y nombres de producto. Tiene carácter («hecho a mano») sin perder legibilidad | OFL (Google Fonts) |
| **DM Sans** | Texto, etiquetas y botones | OFL |
| **JetBrains Mono** | **Solo** precios, referencias (`#PED-0042`), fechas en tickets y cuentas atrás: el «ticket de caja». Las cifras tabulares hacen que los importes se alineen en columna | OFL |

| Nivel | Fuente | Tamaño / línea | Peso | Uso |
|---|---|---|---|---|
| `display` | Bricolage | 36/40 | 800 | Splash, éxito |
| `titular-l` | Bricolage | 28/34 | 700 | Título de la ficha |
| `titular-m` | Bricolage | 22/28 | 700 | Título de pantalla y de sección destacada |
| `titulo` | Bricolage | 18/24 | 600 | Títulos de sección y de tarjeta grande |
| `subtitulo` | DM Sans | 16/22 | 600 | Nombre en listas densas |
| `cuerpo-l` | DM Sans | 16/24 | 400 | Descripciones e Historia |
| `cuerpo` | DM Sans | 14/20 | 400 | Texto general |
| `etiqueta` | DM Sans | 14/20 | 600 | Botones, pestañas y chips |
| `etiqueta-s` | DM Sans | 12/16 | 600 | Pastillas de estado y ayudas |
| `precio` | JetBrains Mono | 18/24 | 700 | Precio en tarjetas y fichas |
| `precio-s` | JetBrains Mono | 14/20 | 700 | Importes en líneas de pedido |
| `codigo` | JetBrains Mono | 12/16 | 500 | Referencias y coordenadas |

Android: `sp` (respeta el tamaño de letra del sistema) y `TextAppearance.JuegAlmi.<Nivel>`. Ionic: `.ja-<nivel>` o `font: var(--ja-tipo-<nivel>)`.

---

## 5. Espaciado, radios, muesca, elevación y bordes

- **Espaciado** (base 4): `0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64` → `espacio.0 … espacio.16`. El margen lateral de pantalla es `espacio.4` (16), entre tarjetas va `espacio.3` (12) y entre secciones `espacio.6` (24).
- **Radios:** `xs 6 · s 8 · m 12 · l 16 · xl 24 · completo`. Los botones y campos usan `m`, las tarjetas `l`, las hojas `xl` y los chips y pastillas `completo`.
- **Muesca:** `tarjeta 16 · destacada 24 · chip-precio 6`. La miniatura que va dentro de una tarjeta repite la muesca de su tarjeta.
- **Elevación:** en claro es una sombra suave (`1` tarjetas al pulsar, `2` FAB y snackbar, `3` diálogos). En oscuro **no hay sombra**: se sube un nivel de superficie (`superficie` → `superficie-2`). Las tarjetas en reposo **no tienen sombra**, solo el borde de 1 px.
- **Bordes:** `fino 1` (tarjetas) · `grueso 2` (selección, error) · `foco 3`.

---

## 6. Iconografía e ilustración

- **Material Symbols Rounded**, peso 500 y 24 px (20 en chips): **contorno** en reposo y **relleno** cuando está activo. Es el mismo set en las dos apps: en Android como *Vector Asset* y en Ionic exportado a SVG (`ion-icon src="assets/icons/<nombre>.svg"`). No se usan los Ionicons por defecto, porque cambiarían el aspecto entre plataformas.
- **Ilustración:** no hay ilustraciones pesadas. Los estados vacíos y de error usan una **baldosa de 96 px con muesca** (amarilla en vacío, roja suave en error) y un icono de 40 px. Cero dependencias y cero CPU.
- **Logo:** cartucho amarillo con muesca, etiqueta en tinta y 4 contactos, más el logotipo «Jueg» (tinta) + «Almi» (violeta en claro, amarillo en oscuro). Icono adaptativo en `generated/android/res/drawable/ic_launcher_foreground.xml`.
- **Imágenes de producto:** relación 4:3 (carrusel) o 3:4 (portada de juego). Mientras cargan se ve un placeholder `superficie-2` con el icono `image` en `borde-campo`; si fallan, el mismo con `broken_image` (Glide `placeholder()`/`error()`, `ion-img` + `ion-skeleton-text`).

---

## 7. Movimiento

| Token | Valor | Uso |
|---|---|---|
| `duracion.rapida` | 120 ms | Pulsar, cambiar de chip o interruptor |
| `duracion.base` | 200 ms | Aparecer o desaparecer, pestañas, segmento de la barra de vida |
| `duracion.lenta` | 320 ms | Hojas inferiores, drawer, «insertar» |
| `duracion.enfasis` | 450 ms | Imagen compartida al abrir una ficha, splash |
| `curva.estandar` | `cubic-bezier(.2,0,0,1)` | Por defecto |
| `curva.entrada` / `salida` | `(0,0,0,1)` / `(.3,0,1,1)` | Lo que entra decelera; lo que sale acelera |
| `curva.insertar` | `cubic-bezier(.34,1.56,.64,1)` | Rebote corto: **solo** al añadir al carrito y al confirmar |

**Microinteracciones clave**
1. **Insertar en el carrito:** la tarjeta baja 4 dp y vuelve con rebote (como un cartucho que encaja) y el número del carrito «salta». Es la animación de la rúbrica (RF-13).
2. **Barra de vida:** los segmentos se encienden de uno en uno, con 80 ms entre ellos.
3. **Abrir la ficha:** la portada viaja de la tarjeta a la ficha (*shared element* en Android, animación de Ionic en la web).
4. **Agitar para refrescar:** las tarjetas se sacuden 2° y aparece el esqueleto.
5. **Splash:** la barra de vida se llena mientras se valida el token.

Se respeta *reducir movimiento* (`prefers-reduced-motion` y la escala de animación de Android): se quitan los rebotes y los desplazamientos, y se mantienen los cambios de opacidad.

Todas las animaciones son de transformación u opacidad (las aplica la GPU). Nada anima `width`, `height` ni sombras.

---

## 8. Layout móvil

- **Primero el móvil**, de 360 a 430 dp de ancho. En tablet, los catálogos pasan a 3-4 columnas y la ficha se divide en dos (imagen | datos). No hay diseños específicos de tablet: el enunciado no los pide.
- **Edge-to-edge** en Android 15+: barras de estado y de navegación transparentes (`themes.xml`) y el contenido aplica los *insets* (`WindowInsetsCompat`). En Ionic: `env(safe-area-inset-*)`, que Ionic ya aplica en `ion-header` e `ion-footer`.
- **Zonas táctiles ≥ 48 dp**, también en iconos de 24 (con relleno) y en el *stepper*.
- **Navegación:** **Navigation Drawer** (con muesca, opciones según el rol) + **pestañas** de categoría (Videojuegos · Móviles y tablets · Consolas) + flecha atrás en las pantallas de detalle. El botón atrás del sistema cierra primero las hojas y el drawer.
- **Barra superior (64):** ☰ · logo · carrito con insignia amarilla · avatar. Debajo, el buscador (56) con el **micro amarillo** (voz, RF-15).
- **Acción principal:** botón amarillo de ancho completo **fijo abajo** en formularios y fichas, por encima de la barra de gestos.

---

## 9. Componentes (con estados)

| Componente | Anatomía | Estados | Android | Ionic |
|---|---|---|---|---|
| **Botón principal** | 52 de alto, radio 12, amarillo, texto tinta en `etiqueta` | normal · pulsado (`primario-pulsado`) · desactivado (`superficie-3` + `texto-3`) · cargando (spinner tinta, sin texto) · foco | `Widget.JuegAlmi.Boton` | `ion-button color="primary" expand="block"` |
| **Botón secundario** | contorno violeta de 1,5 + texto violeta | igual que el principal | `.Boton.Secundario` | `fill="outline" color="secondary"` |
| **Botón alquilar** | contorno cian | igual | `.Boton.Alquilar` | `fill="outline" color="tertiary"` |
| **Botón de texto / destructivo** | violeta / rojo | igual | `.Boton.Texto` | `fill="clear"` |
| **FAB extendido** | amarillo, muesca de 12 | normal · pulsado · oculto al desplazarse | `ExtendedFloatingActionButton` | `ion-fab` |
| **Tarjeta de producto** | muesca 16, borde 1, imagen 4:3 con muesca, nombre (Bricolage), marca · plataforma, precio mono + chip de alquiler | normal · pulsada (elevación 1) · agotado (opacidad 60 % + pastilla) · esqueleto | `MaterialCardView` + `Widget.JuegAlmi.Tarjeta` | `ion-card.ja-tarjeta` |
| **Tarjeta horizontal (lista)** | miniatura 88×116 a la izquierda | igual | `RecyclerView` + `item_producto.xml` | `ion-list` + `ion-item` |
| **Campo de texto** | relleno `superficie-2`, 56, etiqueta flotante, línea inferior `borde-campo`, icono y ayuda | vacío · foco (2 violeta) · relleno · error (2 rojo + ayuda con icono) · válido (✓ verde) · desactivado | `TextInputLayout` + `Widget.JuegAlmi.Campo` | `ion-input fill="solid" label-placement="floating"` + `helperText`/`errorText` |
| **Chip de filtro** | pastilla, `superficie-2` | normal · seleccionado (`marca-suave` + texto `marca` + ✓) · desactivado | `Widget.JuegAlmi.Chip` | `ion-chip` |
| **Pastilla de estado** | icono + texto `etiqueta-s` sobre fondo `-suave` | un color por valor (§3) | `TextView` + fondo | `.ja-estado--…` |
| **Etiqueta de precio** | JetBrains Mono 700 | normal · tachado (antes) | `TextAppearance.JuegAlmi.Precio` | `.ja-precio` |
| **Barra de vida** | N segmentos de 8 con huecos de 4, radio 2 | vacío · parcial · completo · cancelado (contorno rojo) | `LinearLayout` con N `View` | `.ja-vida` |
| **Pestañas** | texto `etiqueta`, indicador violeta de 3 | activa · inactiva · pulsada | `Widget.JuegAlmi.Pestanas` | `ion-segment` |
| **Barra superior** | 64, `fondo`, sin sombra (línea `borde` al desplazar) | normal · desplazada | `MaterialToolbar` | `ion-toolbar` |
| **Drawer** | 300 de ancho, muesca 24, cabecera de usuario, grupos con título | elemento activo (`marca-suave`) · pulsado | `NavigationView` | `ion-menu` |
| **Interruptor / casilla / radio** | violeta activo, `borde-campo` inactivo | on · off · desactivado · foco | Material3 | `ion-toggle` / `ion-checkbox` / `ion-radio` |
| **Control segmentado** | pastilla `superficie-2`, opción activa blanca | — | `MaterialButtonToggleGroup` | `ion-segment` |
| **Selector (desplegable)** | campo con chevron | cerrado · abierto · error | `ExposedDropdownMenu` | `ion-select interface="popover"` |
| **Stepper de cantidad** | − n +, botones de 48 | límite alcanzado (desactivado + aviso) | `MaterialButton` ×2 | `ion-button` ×2 |
| **Aviso en línea** | muesca, fondo `-suave`, icono y texto fuerte | info · éxito · aviso · error | `MaterialCardView` | `ion-card` + `.ja-muesca` |
| **Snackbar / toast** | fondo tinta, texto blanco, acción amarilla, muesca de 8 | con acción · sin acción | `Snackbar` | `ion-toast` |
| **Diálogo** | `superficie`, muesca 24, título Bricolage | normal · destructivo (botón rojo relleno) | `MaterialAlertDialogBuilder` | `ion-alert` |
| **Hoja inferior** | radio superior 24 + muesca 24, asa | media · expandida | `BottomSheetDialogFragment` | `ion-modal [breakpoints]` |
| **Esqueleto** | bloques `superficie-2` con brillo | — | Shimmer o `ProgressBar` | `ion-skeleton-text animated` |
| **Vacío / error** | baldosa de 96 con muesca + título + texto + 1 botón | vacío · error · sin conexión | layout `estado_vacio.xml` | componente `estado-vacio` |

Las hojas de componentes de Stitch (`screens/c1-componentes-*.png`, `c2-componentes-*.png`) muestran todos los estados.

---

## 10. Accesibilidad

- Contraste AA verificado por script (§3). El foco es visible: anillo de 3 (`foco`).
- Zonas táctiles ≥ 48 dp. Textos en `sp`, y la interfaz aguanta hasta un 200 % de tamaño de letra (las tarjetas crecen en alto, no se cortan).
- El estado nunca va solo con color (icono + texto). La barra de vida lleva su texto («3 de 5 copias disponibles») y en Android `contentDescription` / en Ionic `role="progressbar"` + `aria-valuenow`.
- Todas las imágenes tienen descripción (nombre del producto). Los iconos sin texto llevan `contentDescription` / `aria-label`.
- Errores de formulario **debajo del campo**, en español y diciendo **cómo corregirlo** (rúbrica Interfaces 2,5).
- Permisos (ubicación, cámara, micrófono): antes del permiso del sistema, una frase que explica **para qué** se usa.
- Se respetan *reducir movimiento* y el modo oscuro del sistema (y se puede elegir en Perfil).

---

## 11. Hacer / No hacer

| ✅ Hacer | ❌ No hacer |
|---|---|
| Usar `@color/ja_*` y `var(--ja-*)` | Escribir `#FFC629` en un layout o en un `.scss` de página |
| Un botón amarillo por pantalla | Dos botones amarillos que compiten |
| Muesca en contenedores (tarjeta, hoja, drawer, miniatura) | Muesca en botones, campos o chips |
| Precios con `ja-precio` (mono) | Precios en Bricolage o DM Sans |
| Estado = color + icono + texto | Puntos de color sin texto |
| Placeholder + esqueleto mientras carga | Pantalla en blanco o spinner a pantalla completa |
| Cian solo para el alquiler | Cian como color decorativo |
| Mostrar solo campos del modelo de datos | Valoraciones, favoritos, «Exclusivo», horarios |

---

## 12. Decisiones tomadas (y por qué)

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| D-1 | Se mantienen el violeta y el amarillo de los diseños beta, pero sobre fondo claro cálido y con modo oscuro de verdad | Es la marca que el grupo ya enseñó. El beta solo tenía oscuro, y el amarillo sobre violeta oscuro no deja usar el amarillo para texto en claro | Partir de cero con otra paleta |
| D-2 | La muesca como firma | Une las 3 líneas de negocio (cartucho, SD, SIM) y en Android se hace **sin código** (`cornerFamily=cut`) | Bordes redondeados genéricos (aspecto de plantilla) |
| D-3 | Barra de vida segmentada | Hace legible el progreso de reparaciones y alquileres y encaja con el tema. En Android es un `LinearLayout`, en Ionic un `flex` | Barra de progreso continua de Material |
| D-4 | JetBrains Mono solo para cifras | Las cifras tabulares alinean los importes. El «ticket de caja» refuerza el concepto de tienda | Precios en la fuente de texto |
| D-5 | Drawer + pestañas, sin barra inferior | El enunciado pide Tabs + Navigation Drawer; añadir una barra inferior duplicaría la navegación (el beta la tenía) | Barra inferior de 4 opciones del beta |
| D-6 | Material Symbols Rounded en las dos apps | Iconos idénticos (rúbrica Interfaces 4: «exactamente igual») | Ionicons en Ionic y Material en Android |
| D-7 | Fuentes de Google con licencia OFL, 3 familias | Libres, disponibles en web y Android. Con 3 hay contraste de roles sin cargar de más | Poppins (beta): correcta, pero muy vista |
| D-8 | Sin valoraciones, favoritos ni «Exclusivo» | No existen en el modelo v2 (A-08). Si el grupo los quiere, primero hay que cambiar la BBDD | Mantenerlos del beta |
| D-9 | Servicios con pestañas configurables (2 o 3) | P-07 sigue abierto; el diseño vale para las dos opciones | Cerrar P-07 por nuestra cuenta |
| D-10 | El sistema vive en el repo (`design/`) y la bóveda enlaza a él | `tokens.json` lo consume el código y tiene historial en Git; la bóveda no tiene historial | Guardarlo solo en la carpeta de red |

## 13. Huecos y supuestos

- Las pantallas usan **datos y fotos de ejemplo** que genera Stitch (nombres de juegos, precios, Bilbao como ciudad y una dirección de prueba). Los reales saldrán de los datos de ejemplo de la API (`04-Datos/Datos de ejemplo.md`).
- **Mapa** (P-23 abierto): el diseño sirve tanto para OSMDroid/Leaflet como para Google Maps (solo cambian las teselas).
- **Alcance** (P-02): se diseñan las 29 pantallas para las dos apps; si se decide que Ionic no lleva «La tienda», PT-24…PT-28 son solo para Android.
- **Java o Kotlin** (P-01) y **XML o Compose** (P-03): los recursos generados son XML de `res/values`, que valen para Java y Kotlin. Si se elige Compose, habría que añadir un generador de `Color.kt`/`Theme.kt`.

## 14. Cómo se ajusta durante el desarrollo (ADR-022)

| Tipo de cambio | Dónde se hace | Requisitos |
|---|---|---|
| **Detalle de una pantalla** (orden, espaciado puntual, textos, un estado que falta) | Código de **las dos** apps (Android e Ionic) | Si cambia la receta, actualizar su fila en `SCREEN-MAP.md` y la columna AN/IO del Mapa de pantallas en la bóveda |
| **Valor del sistema** (color, tamaño, radio, fuente, duración) | **Solo** en `tokens.json` → `npm run tokens:check` → `npm run tokens:build` → copiar `generated/` a las dos apps | Apuntarlo en el registro de abajo (subir la versión menor: 1.1.0…) |
| **Componente nuevo** | `DESIGN.md` §9 (anatomía + estados) y, si hace falta, `cartucho.scss` / `ja_formas.xml` desde el generador | Igual en las dos apps |
| **Cambio estructural** (navegación, quitar la muesca, nueva paleta o tipografía) | ADR nuevo que sustituya a ADR-022 | Decisión del grupo |

Las imágenes de `screens/` son la **referencia del aprobado v1.0.0**: no se regeneran por cada ajuste. Si el código y la imagen difieren, mandan los tokens y este documento.

## 15. Registro de cambios del sistema
| Versión | Fecha | Quién | Cambio |
|---|---|---|---|
| 1.0.0 | 2026-10-28 | Oier (con Claude Code + Stitch) | Versión aprobada por el grupo (ADR-022) |
