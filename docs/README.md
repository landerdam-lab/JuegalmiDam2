# Documentación de JuegAlmi

Documentación del Reto 2 (DAM2 · ALMI · 25-26). La fuente de verdad del proyecto es la bóveda de contexto (`\\192.168.2.214\contexto`); aquí van los documentos que se entregan o se comparten en el repo.

| Carpeta | Contenido |
|---|---|
| `reto/` | `enunciado-retoJuegAlmi.pdf` (enunciado oficial) · `rubrica-seguimiento.xlsx` (seguimiento de la rúbrica; se edita con LibreOffice Calc, siempre `git pull` antes y commit justo después) |
| `datos/` | Modelo de datos **v6**: `modelo-datos.md` (decisiones), `paso-a-tablas.md` (E-R → tablas, restricciones y normalización), `er-juegalmi.drawio` (página 1 = E-R, página 2 = relacional; abrir en https://app.diagrams.net) y sus vistas previas `er-juegalmi.png`, `er-juegalmi.svg` y `relacional-juegalmi.png` |
| `datos/sql/` | `juegalmi-esquema.sql`: crea la base de datos completa en MariaDB 11.4 (19 tablas y 10 triggers; se puede ejecutar dos veces) · `juegalmi-datos-ejemplo.sql`: datos mínimos para probar, después del esquema. Se pueden importar tal cual en Adminer |
| `diseno/` | `beta-diseno-1.png`, `beta-diseno-2.png` (diseños beta, no definitivos) · `logos-juegalmi.jpg` (propuestas de logo) |
| `entrega/` | `dossier-especificacion-tecnica.pdf` (borrador; describe el modelo v2 y hay que actualizarlo, aviso A-30). Aquí irán también la propuesta del Hito 1 (`propuesta-hito1.*`), el anexo de desviaciones (`anexo-desviaciones.md`), el dossier final y la presentación |
| `equipo/` | `CLAUDE-raiz.md`: plantilla del `CLAUDE.md` de la carpeta raíz de cada integrante (la que contiene `JuegalmiDam2/`) |

## Normas
- Nombres de archivo en minúsculas, sin tildes, sin ñ y sin espacios (`kebab-case`).
- Si cambia el modelo de datos: se edita `datos/er-juegalmi.drawio`, se regeneran los PNG y el SVG, se actualizan `datos/paso-a-tablas.md`, `datos/modelo-datos.md` y el SQL (`04-Datos/Diseno fisico MariaDB.md` de la bóveda y `datos/sql/`).
- Cada cambio respecto a la propuesta del Hito 1 se apunta en `entrega/anexo-desviaciones.md`.
