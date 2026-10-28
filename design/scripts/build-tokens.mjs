// Genera el tema de Ionic y los recursos de Android a partir de design/tokens.json.
// Uso: npm run tokens:build   (desde design/)
// Sin dependencias: solo Node 18+. Los ficheros generados NO se editan a mano.
//
// Salida (design/generated/):
//   ionic/theme/variables.scss          → copiar a ionic/src/theme/variables.scss
//   ionic/theme/cartucho.scss           → copiar a ionic/src/theme/ e importar en global.scss
//   android/res/values/…                → copiar a android/app/src/main/res/ (app nativa)
//                                          y a ionic/android/app/src/main/res/ (APK de Capacitor)
//
// Con --ionic <ruta> y/o --android <ruta> escribe además directamente en esas carpetas
// (p. ej. npm run tokens:build -- --ionic ../ionic/src/theme --android ../android/app/src/main/res).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const t = JSON.parse(readFileSync(join(raiz, 'tokens.json'), 'utf8'));
const CABECERA = 'GENERADO desde design/tokens.json con npm run tokens:build. No editar a mano.';

// ---------- utilidades ----------
const hex = (v) => v.$value;
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ');
// Android usa #AARRGGBB; los tokens usan #RRGGBBAA
const androidHex = (h) => (h.length === 9 ? `#${h.slice(7, 9)}${h.slice(1, 7)}` : h).toUpperCase();
const snake = (s) => s.replace(/-/g, '_');
// Mezcla para los tonos shade/tint que pide Ionic (shade = 12 % negro, tint = 10 % blanco)
const mezcla = (h, con, peso) => '#' + [1, 3, 5].map((i) => {
  const a = parseInt(h.slice(i, i + 2), 16);
  return Math.round(a * (1 - peso) + con * peso).toString(16).padStart(2, '0');
}).join('');

function escribir(rel, contenido, destinoExtra) {
  const ruta = join(raiz, 'generated', rel);
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, contenido);
  if (destinoExtra) {
    mkdirSync(dirname(destinoExtra), { recursive: true });
    writeFileSync(destinoExtra, contenido);
  }
  console.log('  ✓', rel);
}

const args = process.argv.slice(2);
const destino = (flag) => { const i = args.indexOf(flag); return i >= 0 ? resolve(args[i + 1]) : null; };
const dIonic = destino('--ionic');
const dAndroid = destino('--android');

// ---------- IONIC ----------
// Colores de Ionic (--ion-color-*) ← tokens. Cada uno necesita base, contrast, shade y tint.
const ionMapa = {
  primary: ['primario', 'sobre-primario'],
  secondary: ['marca', 'sobre-marca'],
  tertiary: ['alquiler', 'superficie'],
  success: ['exito', 'superficie'],
  warning: ['aviso', 'superficie'],
  danger: ['error', 'superficie'],
  medium: ['texto-2', 'superficie'],
  light: ['superficie-2', 'texto'],
  dark: ['texto', 'superficie'],
};

function bloqueIonic(modo) {
  const c = t.color[modo];
  const l = [];
  for (const [ion, [base, contraste]] of Object.entries(ionMapa)) {
    const b = hex(c[base]);
    const k = hex(c[contraste]).slice(0, 7);
    l.push(`  --ion-color-${ion}: ${b};`, `  --ion-color-${ion}-rgb: ${rgb(b)};`,
      `  --ion-color-${ion}-contrast: ${k};`, `  --ion-color-${ion}-contrast-rgb: ${rgb(k)};`,
      `  --ion-color-${ion}-shade: ${mezcla(b, 0, 0.12)};`, `  --ion-color-${ion}-tint: ${mezcla(b, 255, 0.1)};`);
  }
  const fondo = hex(c.fondo), texto = hex(c.texto);
  l.push('', '  // Base de Ionic',
    `  --ion-background-color: ${fondo};`, `  --ion-background-color-rgb: ${rgb(fondo)};`,
    `  --ion-text-color: ${texto};`, `  --ion-text-color-rgb: ${rgb(texto)};`,
    `  --ion-item-background: ${hex(c.superficie)};`,
    `  --ion-card-background: ${hex(c.superficie)};`,
    `  --ion-toolbar-background: ${fondo};`,
    `  --ion-tab-bar-background: ${fondo};`,
    `  --ion-border-color: ${hex(c.borde)};`,
    `  --ion-placeholder-color: ${hex(c['texto-3'])};`,
    `  --ion-backdrop-color: ${hex(c.velo).slice(0, 7)};`,
    `  --ion-backdrop-opacity: ${(parseInt(hex(c.velo).slice(7, 9), 16) / 255).toFixed(2)};`);
  // Pasos de color de Ionic 8 (sustituyen a --ion-color-step-*):
  // background-step-N va del fondo hacia el texto; text-step-N va del texto hacia el fondo.
  const mezclaHex = (a, b, p) => '#' + [1, 3, 5].map((i) => {
    const x = parseInt(a.slice(i, i + 2), 16), y = parseInt(b.slice(i, i + 2), 16);
    return Math.round(x + (y - x) * p).toString(16).padStart(2, '0');
  }).join('');
  for (let i = 50; i <= 950; i += 50) {
    l.push(`  --ion-background-color-step-${i}: ${mezclaHex(fondo, texto, i / 1000)};`,
      `  --ion-text-color-step-${i}: ${mezclaHex(texto, fondo, i / 1000)};`);
  }
  l.push('', '  // Tokens propios (prefijo --ja-)');
  for (const [k, v] of Object.entries(c)) l.push(`  --ja-${k}: ${hex(v)};`);
  return l.join('\n');
}

function variablesScss() {
  const f = t.fuente;
  const l = [`// ${CABECERA}`, `// Sistema «${t.meta.nombre}» v${t.meta.version} (${t.meta.estado})`, '',
    '// Fuentes: se cargan en src/index.html (Google Fonts) o desde assets/fonts.',
    ':root {', bloqueIonic('light'), '',
    `  --ion-font-family: '${f.texto.$value}', system-ui, sans-serif;`,
    `  --ja-fuente-titulos: '${f.titulos.$value}', '${f.texto.$value}', sans-serif;`,
    `  --ja-fuente-texto: '${f.texto.$value}', system-ui, sans-serif;`,
    `  --ja-fuente-ticket: '${f.ticket.$value}', ui-monospace, monospace;`, ''];
  for (const [k, v] of Object.entries(t.espacio)) if (!k.startsWith('$')) l.push(`  --ja-espacio-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(t.radio)) l.push(`  --ja-radio-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(t.muesca)) if (!k.startsWith('$')) l.push(`  --ja-muesca-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(t.elevacion)) if (!k.startsWith('$')) l.push(`  --ja-elevacion-${k}: ${v.css};`);
  for (const [k, v] of Object.entries(t.borde)) l.push(`  --ja-borde-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(t.movimiento.duracion)) l.push(`  --ja-duracion-${k}: ${v}ms;`);
  for (const [k, v] of Object.entries(t.movimiento.curva)) l.push(`  --ja-curva-${k}: ${v};`);
  for (const [k, v] of Object.entries(t.tamano)) l.push(`  --ja-tamano-${k}: ${v}px;`);
  for (const [n, tp] of Object.entries(t.tipografia)) {
    l.push(`  --ja-tipo-${n}: ${tp.peso} ${tp.tamano}px/${tp.altoLinea}px var(--ja-fuente-${tp.fuente});`,
      `  --ja-tipo-${n}-espaciado: ${tp.espaciado}em;`);
  }
  l.push('}', '',
    '// Modo oscuro (Ionic 8): la app añade la clase .ion-palette-dark a <html> según el sistema',
    '// (prefers-color-scheme) o la preferencia de Perfil. NO importes los palettes/dark.*.css de Ionic:',
    '// esta paleta oscura sustituye a la suya. Selector con :root para ganar en especificidad.',
    '// En oscuro no hay sombras: la elevación se marca con superficies más claras.',
    ':root.ion-palette-dark {', bloqueIonic('dark'),
    ...['1', '2', '3'].map((n) => `  --ja-elevacion-${n}: none;`), '}', '');
  return l.join('\n');
}

// Clases de utilidad para la firma visual (muesca, barra de vida, etiqueta de precio, estados)
function cartuchoScss() {
  const tipos = Object.keys(t.tipografia).map((n) =>
    `.ja-${n} { font: var(--ja-tipo-${n}); letter-spacing: var(--ja-tipo-${n}-espaciado); }`).join('\n');
  const estados = [];
  for (const [grupo, valores] of Object.entries(t.estado)) {
    if (grupo.startsWith('$')) continue;
    for (const [valor, rol] of Object.entries(valores)) {
      estados.push(`.ja-estado--${grupo}-${valor} { color: var(--ja-${rol}); background: var(--ja-${rol}-suave); }`);
    }
  }
  return `// ${CABECERA}
// Firma del sistema «Cartucho». Importar en src/global.scss: @use './theme/cartucho';

// ── Tipografía ──
${tipos}

// ── Muesca: esquina superior derecha cortada a 45° ──
// clip-path recorta también la sombra: si la tarjeta lleva sombra, pon la sombra en un
// contenedor exterior con filter: drop-shadow(...) (la sigue la forma recortada).
@mixin muesca($corte: var(--ja-muesca-tarjeta), $radio: var(--ja-radio-l)) {
  border-radius: $radio;
  clip-path: polygon(0 0, calc(100% - #{$corte}) 0, 100% #{$corte}, 100% 100%, 0 100%);
}
.ja-muesca { @include muesca(); }
.ja-muesca--destacada { @include muesca(var(--ja-muesca-destacada), var(--ja-radio-l)); }
.ja-sombra { filter: drop-shadow(0 2px 6px rgba(28, 21, 48, .10)); }
.ion-palette-dark .ja-sombra { filter: none; }

// ion-card con muesca (equivale a MaterialCardView con ShapeAppearance.JuegAlmi.Muesca)
ion-card.ja-tarjeta {
  @include muesca();
  margin: 0;
  box-shadow: none;
  border: var(--ja-borde-fino) solid var(--ja-borde);
  background: var(--ja-superficie);
}

// ── Etiqueta de precio (ticket) ──
.ja-precio {
  font: var(--ja-tipo-precio);
  letter-spacing: var(--ja-tipo-precio-espaciado);
  font-variant-numeric: tabular-nums;
  color: var(--ja-texto);
}
.ja-chip-alquiler {
  display: inline-flex; align-items: center; gap: var(--ja-espacio-1);
  padding: 2px var(--ja-espacio-2);
  border-radius: var(--ja-radio-completo);
  font: var(--ja-tipo-etiqueta-s);
  color: var(--ja-alquiler); background: var(--ja-alquiler-suave);
}

// ── Barra de vida (progreso por segmentos) ──
// <div class="ja-vida" style="--color: var(--ja-aviso)" role="progressbar" aria-valuenow="2" aria-valuemax="4">
//   <span class="lleno"></span><span class="lleno"></span><span></span><span></span>
// </div>
// Android: un LinearLayout horizontal con N View de peso 1 (o una vista propia que dibuje N rectángulos).
.ja-vida {
  --color: var(--ja-marca);
  display: flex;
  gap: var(--ja-espacio-1);
}
.ja-vida > span {
  flex: 1;
  height: var(--ja-tamano-segmento-vida);
  border-radius: 2px;
  background: var(--ja-superficie-3);
  transition: background-color var(--ja-duracion-base) var(--ja-curva-estandar);
}
.ja-vida > span.lleno { background: var(--color); }
// Se rellenan uno detrás de otro, a saltos (como una barra de vida)
@for $i from 2 through 5 {
  .ja-vida > span:nth-child(#{$i}) { transition-delay: calc(#{$i - 1} * 80ms); }
}

// ── Pastillas de estado (color + icono + texto; nunca solo color) ──
.ja-estado {
  display: inline-flex; align-items: center; gap: var(--ja-espacio-1);
  min-height: 24px; padding: 2px var(--ja-espacio-2);
  border-radius: var(--ja-radio-completo);
  font: var(--ja-tipo-etiqueta-s);
}
${estados.join('\n')}

// ── Botones ──
ion-button {
  --border-radius: var(--ja-radio-m);
  min-height: var(--ja-tamano-boton-alto);
  font: var(--ja-tipo-etiqueta);
  text-transform: none;
  letter-spacing: var(--ja-tipo-etiqueta-espaciado);
}

// ── Foco visible ──
:focus-visible { outline: var(--ja-borde-foco) solid var(--ja-foco); outline-offset: 2px; }

// ── Movimiento: «insertar» al añadir al carrito ──
@keyframes ja-insertar {
  0% { transform: translateY(0); }
  40% { transform: translateY(4px) scale(.98); }
  100% { transform: translateY(0) scale(1); }
}
.ja-insertar { animation: ja-insertar var(--ja-duracion-lenta) var(--ja-curva-insertar); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
`;
}

// ---------- ANDROID ----------
function coloresXml(modo) {
  const c = t.color[modo];
  const l = ['<?xml version="1.0" encoding="utf-8"?>', `<!-- ${CABECERA} -->`, '<resources>'];
  for (const [k, v] of Object.entries(c)) l.push(`    <color name="ja_${snake(k)}">${androidHex(hex(v))}</color>`);
  l.push('</resources>', '');
  return l.join('\n');
}

function dimensXml() {
  const l = ['<?xml version="1.0" encoding="utf-8"?>', `<!-- ${CABECERA} -->`, '<resources>'];
  for (const [k, v] of Object.entries(t.espacio)) if (!k.startsWith('$')) l.push(`    <dimen name="ja_espacio_${k}">${v}dp</dimen>`);
  for (const [k, v] of Object.entries(t.radio)) l.push(`    <dimen name="ja_radio_${snake(k)}">${v}dp</dimen>`);
  for (const [k, v] of Object.entries(t.muesca)) if (!k.startsWith('$')) l.push(`    <dimen name="ja_muesca_${snake(k)}">${v}dp</dimen>`);
  for (const [k, v] of Object.entries(t.elevacion)) if (!k.startsWith('$')) l.push(`    <dimen name="ja_elevacion_${k}">${v.android}dp</dimen>`);
  for (const [k, v] of Object.entries(t.borde)) l.push(`    <dimen name="ja_borde_${k}">${v}dp</dimen>`);
  for (const [k, v] of Object.entries(t.tamano)) l.push(`    <dimen name="ja_tamano_${snake(k)}">${v}dp</dimen>`);
  for (const [n, tp] of Object.entries(t.tipografia)) l.push(`    <dimen name="ja_texto_${snake(n)}">${tp.tamano}sp</dimen>`);
  l.push('</resources>', '');
  return l.join('\n');
}

function integersXml() {
  const l = ['<?xml version="1.0" encoding="utf-8"?>', `<!-- ${CABECERA} -->`, '<resources>'];
  for (const [k, v] of Object.entries(t.movimiento.duracion)) l.push(`    <integer name="ja_duracion_${k}">${v}</integer>`);
  l.push('</resources>', '');
  return l.join('\n');
}

// Curvas de movimiento como interpoladores (res/anim no admite cubic-bezier directo: pathInterpolator sí)
function interpolador(nombre) {
  const m = t.movimiento.curva[nombre].match(/[-\d.]+/g);
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${CABECERA} -->
<pathInterpolator xmlns:android="http://schemas.android.com/apk/res/android"
    android:controlX1="${m[0]}" android:controlY1="${m[1]}"
    android:controlX2="${m[2]}" android:controlY2="${m[3]}" />
`;
}

const fuenteAndroid = { titulos: '@font/bricolage_grotesque', texto: '@font/dm_sans', ticket: '@font/jetbrains_mono' };

function tiposXml() {
  const l = ['<?xml version="1.0" encoding="utf-8"?>', `<!-- ${CABECERA} -->`,
    '<!-- Estilos de texto. Requieren las fuentes en res/font (ver design/generated/android/LEEME.md). -->', '<resources>'];
  for (const [n, tp] of Object.entries(t.tipografia)) {
    const nombre = n.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
    l.push(`    <style name="TextAppearance.JuegAlmi.${nombre}" parent="TextAppearance.Material3.BodyMedium">`,
      `        <item name="android:fontFamily">${fuenteAndroid[tp.fuente]}</item>`,
      `        <item name="fontFamily">${fuenteAndroid[tp.fuente]}</item>`,
      `        <item name="android:textSize">@dimen/ja_texto_${snake(n)}</item>`,
      `        <item name="android:letterSpacing">${tp.espaciado}</item>`,
      `        <item name="lineHeight">${tp.altoLinea}sp</item>`,
      `        <item name="android:textFontWeight">${tp.peso}</item>`,
      '    </style>');
  }
  l.push('</resources>', '');
  return l.join('\n');
}

function temaXml(modo) {
  const oscuro = modo === 'dark';
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${CABECERA} -->
<!-- Tema Material 3 de JuegAlmi (${oscuro ? 'oscuro: values-night' : 'claro: values'}). En el Manifest: android:theme="@style/Theme.JuegAlmi" -->
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.JuegAlmi" parent="Theme.Material3.${oscuro ? 'Dark' : 'Light'}.NoActionBar">
        <!-- Colores Material 3 ← tokens -->
        <item name="colorPrimary">@color/ja_primario</item>
        <item name="colorOnPrimary">@color/ja_sobre_primario</item>
        <item name="colorPrimaryContainer">@color/ja_primario</item>
        <item name="colorOnPrimaryContainer">@color/ja_sobre_primario</item>
        <item name="colorSecondary">@color/ja_marca</item>
        <item name="colorOnSecondary">@color/ja_sobre_marca</item>
        <item name="colorSecondaryContainer">@color/ja_marca_suave</item>
        <item name="colorOnSecondaryContainer">@color/ja_marca</item>
        <item name="colorTertiary">@color/ja_alquiler</item>
        <item name="colorTertiaryContainer">@color/ja_alquiler_suave</item>
        <item name="colorOnTertiaryContainer">@color/ja_alquiler</item>
        <item name="colorError">@color/ja_error</item>
        <item name="colorErrorContainer">@color/ja_error_suave</item>
        <item name="colorOnErrorContainer">@color/ja_error</item>
        <item name="android:colorBackground">@color/ja_fondo</item>
        <item name="colorOnBackground">@color/ja_texto</item>
        <item name="colorSurface">@color/ja_superficie</item>
        <item name="colorOnSurface">@color/ja_texto</item>
        <item name="colorSurfaceVariant">@color/ja_superficie_2</item>
        <item name="colorOnSurfaceVariant">@color/ja_texto_2</item>
        <item name="colorSurfaceContainerLowest">@color/ja_superficie</item>
        <item name="colorSurfaceContainerLow">@color/ja_superficie</item>
        <item name="colorSurfaceContainer">@color/ja_superficie_2</item>
        <item name="colorSurfaceContainerHigh">@color/ja_superficie_2</item>
        <item name="colorSurfaceContainerHighest">@color/ja_superficie_3</item>
        <item name="colorOutline">@color/ja_borde_campo</item>
        <item name="colorOutlineVariant">@color/ja_borde</item>

        <!-- Edge-to-edge: barras transparentes; el contenido aplica los insets (WindowInsetsCompat) -->
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
        <item name="android:windowLightStatusBar">${!oscuro}</item>
        <item name="android:windowLightNavigationBar" tools:targetApi="27">${!oscuro}</item>
        <item name="android:enforceNavigationBarContrast" tools:targetApi="29">false</item>

        <!-- Fuentes y formas -->
        <item name="fontFamily">@font/dm_sans</item>
        <item name="android:fontFamily">@font/dm_sans</item>
        <item name="shapeAppearanceCornerSmall">@style/ShapeAppearance.JuegAlmi.Pequena</item>
        <item name="shapeAppearanceCornerMedium">@style/ShapeAppearance.JuegAlmi.Media</item>
        <item name="shapeAppearanceCornerLarge">@style/ShapeAppearance.JuegAlmi.Muesca</item>
        <item name="materialCardViewStyle">@style/Widget.JuegAlmi.Tarjeta</item>
        <item name="materialButtonStyle">@style/Widget.JuegAlmi.Boton</item>
        <item name="textInputStyle">@style/Widget.JuegAlmi.Campo</item>
        <item name="chipStyle">@style/Widget.JuegAlmi.Chip</item>
    </style>

    <!-- Splash (API de SplashScreen, androidx.core:core-splashscreen) -->
    <style name="Theme.JuegAlmi.Splash" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/ja_fondo</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/ic_launcher_foreground</item>
        <item name="postSplashScreenTheme">@style/Theme.JuegAlmi</item>
    </style>
</resources>
`;
}

function formasXml() {
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${CABECERA} -->
<!-- Formas y componentes del sistema «Cartucho» (comunes a claro y oscuro). -->
<resources>
    <!-- LA MUESCA: esquina superior derecha cortada (cut) y el resto redondeado -->
    <style name="ShapeAppearance.JuegAlmi.Muesca" parent="">
        <item name="cornerFamily">rounded</item>
        <item name="cornerSize">@dimen/ja_radio_l</item>
        <item name="cornerFamilyTopRight">cut</item>
        <item name="cornerSizeTopRight">@dimen/ja_muesca_tarjeta</item>
    </style>
    <style name="ShapeAppearance.JuegAlmi.MuescaDestacada" parent="ShapeAppearance.JuegAlmi.Muesca">
        <item name="cornerSizeTopRight">@dimen/ja_muesca_destacada</item>
    </style>
    <style name="ShapeAppearance.JuegAlmi.Media" parent="">
        <item name="cornerFamily">rounded</item>
        <item name="cornerSize">@dimen/ja_radio_m</item>
    </style>
    <style name="ShapeAppearance.JuegAlmi.Pequena" parent="">
        <item name="cornerFamily">rounded</item>
        <item name="cornerSize">@dimen/ja_radio_s</item>
    </style>
    <style name="ShapeAppearance.JuegAlmi.Pastilla" parent="">
        <item name="cornerFamily">rounded</item>
        <item name="cornerSize">50%</item>
    </style>

    <!-- Tarjeta con muesca (CardView de la rúbrica) -->
    <style name="Widget.JuegAlmi.Tarjeta" parent="Widget.Material3.CardView.Outlined">
        <item name="shapeAppearance">@style/ShapeAppearance.JuegAlmi.Muesca</item>
        <item name="strokeColor">@color/ja_borde</item>
        <item name="strokeWidth">@dimen/ja_borde_fino</item>
        <item name="cardBackgroundColor">@color/ja_superficie</item>
        <item name="cardElevation">@dimen/ja_elevacion_0</item>
    </style>

    <!-- Botón principal: amarillo, texto tinta -->
    <style name="Widget.JuegAlmi.Boton" parent="Widget.Material3.Button">
        <item name="backgroundTint">@color/ja_primario</item>
        <item name="android:textColor">@color/ja_sobre_primario</item>
        <item name="android:minHeight">@dimen/ja_tamano_boton_alto</item>
        <item name="shapeAppearance">@style/ShapeAppearance.JuegAlmi.Media</item>
        <item name="android:textAppearance">@style/TextAppearance.JuegAlmi.Etiqueta</item>
        <item name="android:textAllCaps">false</item>
    </style>
    <!-- Botón secundario: contorno violeta -->
    <style name="Widget.JuegAlmi.Boton.Secundario" parent="Widget.Material3.Button.OutlinedButton">
        <item name="android:textColor">@color/ja_marca</item>
        <item name="strokeColor">@color/ja_marca</item>
        <item name="android:minHeight">@dimen/ja_tamano_boton_alto</item>
        <item name="shapeAppearance">@style/ShapeAppearance.JuegAlmi.Media</item>
        <item name="android:textAppearance">@style/TextAppearance.JuegAlmi.Etiqueta</item>
        <item name="android:textAllCaps">false</item>
    </style>
    <!-- Botón de texto -->
    <style name="Widget.JuegAlmi.Boton.Texto" parent="Widget.Material3.Button.TextButton">
        <item name="android:textColor">@color/ja_marca</item>
        <item name="android:textAppearance">@style/TextAppearance.JuegAlmi.Etiqueta</item>
        <item name="android:textAllCaps">false</item>
    </style>
    <!-- Botón de alquilar: cian -->
    <style name="Widget.JuegAlmi.Boton.Alquilar" parent="Widget.JuegAlmi.Boton.Secundario">
        <item name="android:textColor">@color/ja_alquiler</item>
        <item name="strokeColor">@color/ja_alquiler</item>
    </style>

    <!-- Campo de texto (TextInputLayout) -->
    <style name="Widget.JuegAlmi.Campo" parent="Widget.Material3.TextInputLayout.FilledBox">
        <item name="boxBackgroundColor">@color/ja_superficie_2</item>
        <item name="boxStrokeColor">@color/ja_marca</item>
        <item name="boxStrokeErrorColor">@color/ja_error</item>
        <item name="errorTextColor">@color/ja_error</item>
        <item name="hintTextColor">@color/ja_marca</item>
        <item name="shapeAppearance">@style/ShapeAppearance.JuegAlmi.Media</item>
    </style>

    <!-- Chip de filtro -->
    <style name="Widget.JuegAlmi.Chip" parent="Widget.Material3.Chip.Filter">
        <item name="shapeAppearance">@style/ShapeAppearance.JuegAlmi.Pastilla</item>
        <item name="chipBackgroundColor">@color/ja_superficie_2</item>
        <item name="android:textAppearance">@style/TextAppearance.JuegAlmi.Etiqueta</item>
        <item name="chipStrokeWidth">0dp</item>
    </style>

    <!-- Pestañas: indicador violeta de 3dp -->
    <style name="Widget.JuegAlmi.Pestanas" parent="Widget.Material3.TabLayout">
        <item name="tabIndicatorColor">@color/ja_marca</item>
        <item name="tabIndicatorHeight">3dp</item>
        <item name="tabSelectedTextColor">@color/ja_marca</item>
        <item name="tabTextColor">@color/ja_texto_2</item>
        <item name="tabTextAppearance">@style/TextAppearance.JuegAlmi.Etiqueta</item>
        <item name="android:background">@color/ja_fondo</item>
    </style>
</resources>
`;
}

// Icono adaptativo: cartucho amarillo con muesca y dos «píxeles» (zona segura 66dp de 108dp)
function iconoForeground() {
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${CABECERA} -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <!-- Cartucho con la muesca arriba a la derecha -->
    <path android:fillColor="@color/ja_primario_fijo"
        android:pathData="M34,30 L66,30 L78,42 L78,74 Q78,78 74,78 L34,78 Q30,78 30,74 L30,34 Q30,30 34,30 Z" />
    <!-- Etiqueta del cartucho -->
    <path android:fillColor="@color/ja_tinta_fija"
        android:pathData="M38,38 L62,38 L70,46 L70,58 L38,58 Z" />
    <!-- Contactos -->
    <path android:fillColor="@color/ja_tinta_fija"
        android:pathData="M40,66h4v8h-4z M48,66h4v8h-4z M56,66h4v8h-4z M64,66h4v8h-4z" />
</vector>
`;
}
function iconoXml() {
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${CABECERA} -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ja_icono_fondo" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`;
}
// Colores fijos (no cambian con el modo) para el icono y el splash
function coloresFijosXml() {
  const l = t.color.light;
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${CABECERA} -->
<resources>
    <color name="ja_primario_fijo">${hex(l.primario)}</color>
    <color name="ja_tinta_fija">${hex(l.texto)}</color>
    <color name="ja_icono_fondo">${hex(t.color.dark.fondo)}</color>
</resources>
`;
}

function leemeAndroid() {
  return `# Recursos de Android generados (${CABECERA})

Copia el contenido de \`res/\` en:
- App nativa: \`android/app/src/main/res/\`
- APK de Ionic (Capacitor): \`ionic/android/app/src/main/res/\` (después de \`npx cap add android\`)

## Qué hay
| Fichero | Contenido |
|---|---|
| \`values/ja_colores.xml\` · \`values-night/ja_colores.xml\` | Colores claro/oscuro (\`@color/ja_*\`) |
| \`values/ja_colores_fijos.xml\` | Colores del icono y el splash (no cambian con el modo) |
| \`values/ja_dimens.xml\` | Espaciado, radios, muesca, elevación, tamaños y tamaños de letra |
| \`values/ja_integers.xml\` | Duraciones de animación (ms) |
| \`values/ja_tipos.xml\` | \`TextAppearance.JuegAlmi.*\` (12 niveles) |
| \`values/ja_formas.xml\` | La muesca (\`ShapeAppearance.JuegAlmi.Muesca\`) y los estilos de tarjeta, botones, campo, chip y pestañas |
| \`values/themes.xml\` · \`values-night/themes.xml\` | \`Theme.JuegAlmi\` (Material 3, edge-to-edge) y \`Theme.JuegAlmi.Splash\` |
| \`interpolator/ja_*.xml\` | Curvas de movimiento |
| \`drawable/ic_launcher_foreground.xml\` · \`mipmap-anydpi-v26/ic_launcher*.xml\` | Icono adaptativo (cartucho con muesca) |

## Requisitos
- Dependencias: \`com.google.android.material:material\` (1.12 o superior, para Material 3) y \`androidx.core:core-splashscreen\`.
- **Fuentes** en \`res/font/\` (Google Fonts, licencia OFL): \`bricolage_grotesque.ttf\`, \`dm_sans.ttf\`, \`jetbrains_mono.ttf\`
  (o sus variantes por peso con un \`font-family\` XML). Sin ellas, la compilación falla porque los estilos las referencian.
- Los nombres de fichero llevan el prefijo \`ja_\` para no pisar los \`colors.xml\`/\`themes.xml\` que crea Android Studio:
  borra los colores y el tema por defecto del proyecto y deja solo estos.
`;
}

// ---------- ejecución ----------
console.log(`Generando desde tokens.json (sistema «${t.meta.nombre}» v${t.meta.version})`);
escribir('ionic/theme/variables.scss', variablesScss(), dIonic && join(dIonic, 'variables.scss'));
escribir('ionic/theme/cartucho.scss', cartuchoScss(), dIonic && join(dIonic, 'cartucho.scss'));

const A = (rel, contenido) => escribir(`android/res/${rel}`, contenido, dAndroid && join(dAndroid, rel));
A('values/ja_colores.xml', coloresXml('light'));
A('values-night/ja_colores.xml', coloresXml('dark'));
A('values/ja_colores_fijos.xml', coloresFijosXml());
A('values/ja_dimens.xml', dimensXml());
A('values/ja_integers.xml', integersXml());
A('values/ja_tipos.xml', tiposXml());
A('values/ja_formas.xml', formasXml());
A('values/themes.xml', temaXml('light'));
A('values-night/themes.xml', temaXml('dark'));
for (const n of Object.keys(t.movimiento.curva)) A(`interpolator/ja_${n}.xml`, interpolador(n));
A('drawable/ic_launcher_foreground.xml', iconoForeground());
A('mipmap-anydpi-v26/ic_launcher.xml', iconoXml());
A('mipmap-anydpi-v26/ic_launcher_round.xml', iconoXml());
escribir('android/LEEME.md', leemeAndroid());
console.log('Hecho.');
