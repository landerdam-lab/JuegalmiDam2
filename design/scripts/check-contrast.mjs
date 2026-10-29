// Comprueba el contraste WCAG 2.1 de las parejas de color que usa la interfaz.
// Uso: node scripts/check-contrast.mjs   (sale con código 1 si alguna pareja no llega al mínimo)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(dir, '..', 'tokens.json'), 'utf8'));

// Luminancia relativa según WCAG 2.1
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// [texto, fondo, mínimo]. 4.5 = texto normal (AA); 3 = texto grande, iconos y bordes de componentes (AA)
const parejas = [
  ['texto', 'fondo', 4.5], ['texto', 'superficie', 4.5], ['texto', 'superficie-2', 4.5],
  ['texto-2', 'fondo', 4.5], ['texto-2', 'superficie', 4.5], ['texto-2', 'superficie-2', 4.5],
  ['texto-3', 'superficie', 4.5], ['texto-3', 'superficie-2', 4.5],
  ['sobre-primario', 'primario', 4.5], ['sobre-primario', 'primario-pulsado', 4.5],
  ['marca', 'fondo', 4.5], ['marca', 'superficie', 4.5], ['marca', 'marca-suave', 4.5],
  ['sobre-marca', 'marca', 4.5],
  ['alquiler', 'superficie', 4.5], ['alquiler', 'alquiler-suave', 4.5],
  ['exito', 'superficie', 4.5], ['exito', 'exito-suave', 4.5],
  ['aviso', 'superficie', 4.5], ['aviso', 'aviso-suave', 4.5],
  ['error', 'superficie', 4.5], ['error', 'error-suave', 4.5], ['error', 'fondo', 4.5],
  ['info', 'superficie', 4.5], ['info', 'info-suave', 4.5],
  ['neutro-estado', 'superficie', 4.5], ['neutro-estado', 'neutro-estado-suave', 4.5],
  ['primario', 'fondo', 1, 'solo relleno en claro; en oscuro se usa también como texto'],
  ['foco', 'fondo', 3], ['foco', 'superficie', 3],
  ['borde', 'superficie', 1, 'decorativo: solo separa tarjetas'],
  ['borde-campo', 'superficie', 3], ['borde-campo', 'fondo', 3], ['borde-campo', 'superficie-2', 3],
];

let fallos = 0;
for (const modo of ['light', 'dark']) {
  const c = tokens.color[modo];
  console.log(`\n== ${modo === 'light' ? 'CLARO' : 'OSCURO'} ==`);
  for (const [fg, bg, min, nota] of parejas) {
    const minimo = modo === 'dark' && fg === 'primario' ? 4.5 : min;
    const r = ratio(c[fg].$value.slice(0, 7), c[bg].$value.slice(0, 7));
    const ok = r >= minimo;
    if (!ok) fallos++;
    console.log(`${ok ? 'OK  ' : 'FALLA'} ${fg.padEnd(15)} sobre ${bg.padEnd(20)} ${r.toFixed(2).padStart(5)}:1 (mín. ${minimo})${nota ? ' · ' + nota : ''}`);
  }
}
console.log(fallos ? `\n${fallos} pareja(s) por debajo del mínimo` : '\nTodas las parejas cumplen WCAG 2.1 AA');
process.exit(fallos ? 1 : 0);
