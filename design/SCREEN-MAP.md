# Mapa de pantallas → implementación (Ionic + Android)

> **Estado: PROPUESTA.** Complementa a la lista maestra `08-Diseno-UI/Mapa de pantallas.md` de la bóveda: allí está **qué** muestra cada pantalla; aquí, **cómo** se construye con el sistema «Cartucho».
> Diseños: `screens/<nn>-<nombre>-light.png` y `-dark.png` (+ `.html` de referencia de Stitch). Las rutas de Ionic y los nombres de Android son una **propuesta** que sigue `07-Ionic/Ionic - vision general.md` y `06-Android/Android - vision general.md`.

**Comunes a todas las pantallas:**
- Barra superior `ion-toolbar` / `MaterialToolbar`.
- Drawer según el rol (`n1-menu-lateral`).
- Estados de carga, vacío y error (`e1-estados-carga-vacio-error`).
- Snackbar o toast para confirmar.
- «Agitar para refrescar» en las listas.

**Tokens base:** `fondo`, `superficie`, `texto`, `texto-2`, `borde`, `espacio.4` (margen lateral), `muesca.tarjeta`.

**Leyenda de componentes:**
- **TP** = tarjeta de producto (`ion-card.ja-tarjeta` / `MaterialCardView` + `Widget.JuegAlmi.Tarjeta`)
- **BV** = barra de vida (`.ja-vida` / `LinearLayout` de segmentos)
- **PE** = pastilla de estado (`.ja-estado--*` / `TextView` con fondo)
- **BP** = botón principal (`ion-button color="primary"` / `Widget.JuegAlmi.Boton`)

| PT | Pantalla | Diseño (`screens/`) | Ionic: ruta → página | Android: vista | Componentes Ionic | Tokens clave | Estados a cubrir |
|---|---|---|---|---|---|---|---|
| PT-01 | Splash | `01-splash` | `/` → `splash.page` (o splash de Capacitor + página) | `SplashActivity` con `Theme.JuegAlmi.Splash` | `ion-content`, logo SVG, BV de 5 | `primario`, `marca`, `superficie-3`, `display` | validando token · sin red (→ login con aviso) |
| PT-02 | Login | `02-login` | `/login` → `login.page` | `LoginFragment` | `ion-input fill="solid"`, `ion-button` BP, `ion-text` | `superficie-2`, `borde-campo`, `error`, `marca` | vacío · error por campo · enviando (BP cargando) · 401 credenciales |
| PT-03 | Registro | `03-registro` | `/registro` → `registro.page` | `RegistroFragment` | `ion-input` ×6, `ion-checkbox`, BV fuerza de la contraseña, BP fijo en `ion-footer` | `error`, `exito`, `aviso` | validación en vivo · email/DNI duplicado (409/422) · enviando |
| PT-04 | Inicio | `04-inicio` | `/tabs/inicio` → `inicio.page` | `InicioFragment` | `ion-searchbar` + botón de micro, `ion-segment` (categorías), hero `ion-card.ja-muesca--destacada`, carruseles (`swiper` o `overflow-x` + TP) | `primario`, `marca`, `alquiler`, `precio` | esqueleto de carruseles · error con reintentar · sin novedades |
| PT-05 | Catálogo de videojuegos | `05-catalogo-videojuegos` | `/catalogo/videojuegos` → `catalogo-videojuegos.page` | `CatalogoFragment` (pestaña 0) + `ProductoAdapter` | `ion-segment`, `ion-chip` (filtros), `ion-list` de TP horizontales, `ion-infinite-scroll` | `marca-suave`, `alquiler`, `exito`/`aviso`/`neutro-estado` | carga progresiva · sin resultados para el filtro · agotado |
| PT-06 | Detalle de videojuego | `06-detalle-videojuego` | `/producto/videojuego/:id` | `DetalleVideojuegoFragment` | `ion-img` con muesca, `ion-chip` info, caja de alquiler con BV de copias, BP «Comprar» + botón «Alquilar» (`color="tertiary"`) | `alquiler`, `alquiler-suave`, `precio`, `titular-l` | sin copias (BV vacía, «Alquilar» desactivado + motivo) · agotado · añadido (animación «insertar») |
| PT-07 | Catálogo de móviles y tablets | `07-catalogo-moviles` | `/catalogo/moviles` | `CatalogoFragment` (pestaña 1) | `ion-segment` Móviles/Tablets (`movil.formato`), `ion-chip` de marca, `ion-grid` de 2 columnas con TP | `superficie-2`, `precio` | carga · vacío · agotado |
| PT-08 | Detalle de móvil/tablet | `08-detalle-movil` | `/producto/movil/:id` | `DetalleMovilFragment` | galería `ion-img`, 3 baldosas de datos (pantalla, RAM, almacenamiento), *stepper*, BP fijo | `precio`, `aviso` | últimas unidades · cantidad > stock (aviso) · añadido |
| PT-09 | Catálogo de consolas | `09-catalogo-consolas` | `/catalogo/consolas` | `CatalogoFragment` (pestaña 2) | destacada `ja-muesca--destacada`, lista de TP, aviso de taller | `marca-suave` | carga · vacío · agotado |
| PT-10 | Detalle de consola | *(misma plantilla que `08-detalle-movil`: datos = `modelo`, `almacenamiento_gb`)* | `/producto/consola/:id` | `DetalleConsolaFragment` | igual que PT-08 | igual que PT-08 | igual que PT-08 |
| PT-11 | Carrito | `11-carrito` | `/carrito` → `carrito.page` | `CarritoFragment` | `ion-list` de líneas, *stepper*, selector de método de pago (`ion-radio-group` en tarjetas), ticket de resumen, BP fijo | `precio-s`, `marca` (selección), `aviso` | vacío («Tu carrito está vacío» + ir al catálogo) · límite de stock · línea eliminada (snackbar «Deshacer») |
| PT-12 | Confirmar pedido | `12-confirmar-pedido` + `12b-pedido-realizado` | `/pedido/confirmar` y `/pedido/:id/hecho` | `ConfirmarPedidoFragment` + `PedidoRealizadoFragment` | BV de 3 pasos, ticket, aviso de ubicación (`info`), `ion-checkbox`, BP | `info-suave`, `exito`, `codigo` | pidiendo permiso · permiso denegado (P-28: no se puede confirmar + motivo) · 409 sin stock · éxito |
| PT-13 | Mis pedidos | `13-mis-pedidos` | `/pedidos` | `PedidosFragment` + `PedidoAdapter` | `ion-chip` filtros, tarjetas con PE + BV de 3 | colores de `estado.pedido` | carga · vacío · error |
| PT-14 | Detalle de pedido | `14-detalle-pedido` | `/pedidos/:id` | `DetallePedidoFragment` | tarjeta de estado con BV etiquetada, líneas, ticket, mapa estático, botón «Cancelar» (solo si `pendiente`) | `info`/`aviso`/`exito`, `codigo` | pendiente (cancelar activo + diálogo) · otros (cancelar desactivado + motivo) |
| PT-15 | Alquilar | `15-alquilar` | modal `alquilar.modal` desde PT-06 | `AlquilarBottomSheet` | `ion-modal` con `breakpoints` + muesca, `ion-datetime` de rango, ticket, BV de copias, BP | `alquiler`, `alquiler-suave`, `precio` | fechas no válidas · 409 SIN_COPIAS · sin ubicación · éxito |
| PT-16 | Mis alquileres | `16-mis-alquileres` | `/alquileres` | `AlquileresFragment` + `AlquilerAdapter` | `ion-segment` Activos/Retrasados/Devueltos, tarjetas con cuenta atrás (mono) y BV de 5 que se vacía | `alquiler`, `aviso`, `error`, `neutro-estado` | carga · vacío (`e1`) · último día · retrasado |
| PT-17 | Solicitar reparación | `17-solicitar-reparacion` | `/reparaciones/nueva` | `NuevaReparacionFragment` | 2 tarjetas seleccionables (departamento), `ion-input`, `ion-textarea` con contador, selector de foto (cámara), fila de ubicación, BP | `marca-suave` (selección), `info-suave` | validación por paso · cámara denegada · sin ubicación · enviando · éxito |
| PT-18 | Mis reparaciones | `18-mis-reparaciones` | `/reparaciones` | `ReparacionesFragment` + `ReparacionAdapter` | tarjetas con PE + BV de 4 etiquetada, FAB «Nueva reparación» | colores de `estado.reparacion` | carga · vacío · cada uno de los 5 estados |
| PT-19 | Panel del técnico | `19-panel-tecnico` | `/taller` (guard `rol=tecnico`) | `PanelTecnicoFragment` | 4 baldosas KPI, `ion-chip` (Sin asignar/Mías/Todas), tarjetas con botón «Asignármela» | `codigo`, colores de estado | carga · vacío · 403 si no es técnico |
| PT-20 | Gestionar reparación | `20-gestionar-reparacion` | `/taller/:id` | `GestionarReparacionFragment` | foto ampliable, selector de estado como BV de 4 tocable, `ion-input` de presupuesto, BP | colores de estado, `precio` | transición no permitida (aviso) · cancelar (diálogo destructivo) · guardado (snackbar) |
| PT-21 | Perfil | `21-perfil` | `/perfil` | `PerfilFragment` | avatar + botón de cámara, `ion-input` (solo lectura en email y DNI), `ion-segment` del tema, `ion-toggle` ×2, cerrar sesión | `marca`, `error` | guardando · error de validación · cerrar sesión (diálogo) |
| PT-22 | Admin: productos | `22-admin-productos` | `/admin/productos` | `AdminProductosFragment` | `ion-segment` por tipo, `ion-searchbar`, filas con `ion-toggle` «Activo» (baja lógica), FAB, `ion-toast` con «Deshacer» | `neutro-estado` (retirado), `error` (sin stock) | carga · vacío · retirado · guardado |
| PT-23 | Admin: usuarios | `23-admin-usuarios` | `/admin/usuarios` | `AdminUsuariosFragment` | lista con PE de rol, `ion-modal` hoja «Nuevo técnico» con `ion-select` de departamento | `marca-suave`, `primario` (pastilla admin) | carga · email/DNI duplicado · creado |
| PT-24 | La tienda | `24-la-tienda` | `/tienda` | `TiendaFragment` | hero con muesca de 24 + `ion-grid` 2×2 de tarjetas grandes con tinte | `marca-suave`, `info-suave`, `alquiler-suave`, `primario` 20 % | carga del hero (placeholder) |
| PT-25 | Servicios | `25-servicios` | `/tienda/servicios` | `ServiciosFragment` (TabLayout + ViewPager2) | `ion-segment` con 2 o 3 pestañas (P-07), lista de servicios con precio orientativo («Consultar» si es null), BP | `marca`, `precio-s` | carga · departamento sin servicios |
| PT-26 | Ubicación | `26-ubicacion` | `/tienda/ubicacion` | `UbicacionFragment` | mapa (Leaflet/OSMDroid o Google Maps, P-23), marcador cartucho, hoja con «Cómo llegar» y «Llamar» | `primario` (marcador), `marca` (usuario) | sin permiso de ubicación (solo la tienda) · mapa sin red |
| PT-27 | Galería | `27-galeria` | `/tienda/galeria` | `GaleriaFragment` + `FotoTiendaAdapter` (`GridLayoutManager(3)`) | `ion-grid` de 3 columnas, baldosas con muesca de 8, placeholder + esqueleto, visor `ion-modal` a pantalla completa | `superficie-2`, `borde-campo` | carga (placeholder Glide / `ion-img`) · error de imagen · vacío |
| PT-28 | Historia | `28-historia` | `/tienda/historia` | `HistoriaFragment` (`CollapsingToolbarLayout`) | cabecera con foto + tarjeta superpuesta con muesca de 24, cita con barra amarilla | `cuerpo-l`, `primario` | carga |
| PT-29 | Búsqueda por voz | `29-busqueda-voz` | superpuesta en el buscador (`voz.service`) | `SpeechRecognizer` desde la `Toolbar` | barra de búsqueda enfocada, panel «Te escucho» con ecualizador (BV vertical), chips de comandos, resultados | `marca-suave`, `primario` (micro activo) | escuchando · no entendido («Prueba a decir…») · micro denegado · resultados |
| — | Menú lateral | `n1-menu-lateral` | `ion-menu` en `app.component` | `NavigationView` en `MainActivity` | cabecera de usuario, grupos con título, elemento activo `marca-suave`, cerrar sesión | `marca-suave`, `error` | menú por rol (cliente · técnico · admin) |
| — | Estados | `e1-estados-carga-vacio-error` | componente `shared/estado-vacio` + `ion-skeleton-text` | `layout/estado_vacio.xml`, Shimmer | baldosa de 96 con muesca + título + texto + 1 botón | `primario` (vacío), `error-suave` (error) | carga · vacío · error · sin conexión |
| — | Componentes | `c1-componentes-1`, `c2-componentes-2` | — | — | referencia visual de todos los componentes y sus estados | todos | — |

## Qué hay que igualar entre las dos apps (RP-03)
1. **Mismos tokens:** las dos apps usan solo `generated/` (`npm run tokens:build`).
2. **Mismos iconos:** Material Symbols Rounded (no Ionicons).
3. **Mismas fuentes:** Bricolage Grotesque, DM Sans y JetBrains Mono, incluidas en las dos apps (no las del sistema).
4. **Misma muesca:** `ShapeAppearance.JuegAlmi.Muesca` ↔ `.ja-muesca` con los mismos valores (`muesca.*`).
5. **Mismo modo `md`** en Ionic (`IonicModule.forRoot({ mode: 'md' })` o `provideIonicAngular({ mode: 'md' })`), para que iOS no cambie las pestañas, los botones ni los *toggles* al estilo de Apple.
