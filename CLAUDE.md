# CLAUDE.md — JuegAlmi (Reto 2 · DAM2 · ALMI · curso 25-26)

Instrucciones para Claude Code, compartidas por los **3 integrantes** del grupo. Responde siempre en **español**.

**Estructura de trabajo de cada integrante** (Claude Code se abre desde la carpeta raíz, que **no** es un repo):
```
<carpeta raíz>/                 ← aquí se abre Claude Code
├── CLAUDE.md                   ← mínimo: importa este archivo (plantilla en docs/CLAUDE-raiz.md)
├── CLAUDE.local.md             ← personal, no se comparte (ver sección 9)
├── contexto (…) - Acceso directo.lnk   ← acceso directo a la bóveda (usa la ruta UNC, no el .lnk)
└── JuegalmiDam2/               ← ESTE repo git. Las rutas api/, docs/… de este archivo son relativas a él
```
- Los comandos `git` se ejecutan **dentro de `JuegalmiDam2/`** (o con `git -C JuegalmiDam2 …`).
- No crees archivos del proyecto en la carpeta raíz: todo lo que se comparte va en el repo o en la bóveda.

---

## 0. ANTES DE HACER NADA: lee el contexto (obligatorio)

La **fuente de verdad** del proyecto es la bóveda de Obsidian de la carpeta compartida:

```
\\192.168.2.214\contexto          (en Git Bash: //192.168.2.214/contexto)
```

Al empezar **cada** sesión o tarea, lee en este orden:

1. `00 - INICIO.md`: mapa de la bóveda y protocolo de lectura
2. `00-Inicio/Estado actual.md`: qué está hecho, qué falta y quién está con qué
3. `00-Inicio/Avisos e inconsistencias.md`: trampas conocidas (A-xx)
4. `10-Decisiones/Pendientes de decidir.md`: preguntas abiertas (P-xx)
5. `10-Decisiones/Decisiones.md`: decisiones tomadas (ADR)
6. **Las notas del área de la tarea** (la tabla de `00 - INICIO.md` dice cuáles). Como mínimo:
   - BBDD → `04-Datos/Modelo relacional.md`, `04-Datos/Reglas de negocio.md`, `04-Datos/Tablas/<tabla>.md`
   - API → `05-API/*.md`, `03-Arquitectura/Seguridad y autenticacion.md`, `03-Arquitectura/Roles y permisos.md`
   - Android → `06-Android/*.md`, `08-Diseno-UI/Mapa de pantallas.md`
   - Ionic → `07-Ionic/*.md`, `08-Diseno-UI/Mapa de pantallas.md`
   - Docs o entrega → `01-Reto/Rubrica.md`, `11-Calidad/Checklist de entrega.md`

**Si la carpeta no es accesible** (p. ej. fuera de la red del centro): **avisa al usuario en tu primera respuesta**, trabaja solo con `docs/` del repo, no inventes decisiones y deja anotado qué habría que actualizar en la bóveda cuando vuelva a estar disponible.

---

## 1. El proyecto en 10 líneas

- **Cliente ficticio:** JuegAlmi, tienda que **vende y alquila videojuegos**, **vende y repara consolas** y **vende y repara móviles/tablets**.
- **Entregamos una demo** con tres piezas en un monorepo (`github.com/landerdam-lab/JuegalmiDam2`):
  - `api/`: **API REST en Symfony + MySQL + Doctrine**, con **tokens** y **HTTPS**
  - `android/`: **app Android nativa** (Volley + Retrofit, Glide, RecyclerView/CardView, Tabs + Navigation Drawer) **+ sección "La tienda"** estilo Google Play (Servicios en pestañas, Ubicación, Galería, Historia)
  - `ionic/`: **app híbrida Ionic + Angular** (iOS / "Windows Phone"), **con el mismo diseño** que la de Android
  - `docs/`: enunciado, E-R (`er-juegalmi.drawio/.png`), modelo de datos, propuesta del Hito 1, dossier y presentación
- **Innegociable:** geolocalizar al usuario, datos de ejemplo precargados, carga rápida y asíncrona, placeholder en las imágenes, CPU mínima.
- **Hitos:** Hito 1 (propuesta) en la semana 5 · Hito 2 (entrega + presentación de ≤ 15 min + 5 de preguntas) en la semana 11.
- **Modelo de datos:** 14 tablas (ver `04-Datos/` en la bóveda). Herencia JOINED `producto` → `videojuego` / `movil` / `consola`.

---

## 2. Jerarquía de fuentes (si algo se contradice)

1. Enunciado y rúbrica (`docs/enunciado-retoJuegAlmi.pdf` · bóveda `01-Reto/`) y lo que diga el profesorado
2. ADR de `10-Decisiones/`
3. Notas de la bóveda con `estado: decidido`
4. `docs/` del repo
5. Código
6. Notas con `estado: propuesta`

Si encuentras una contradicción, **no elijas tú**: díselo al usuario y añádela a `00-Inicio/Avisos e inconsistencias.md`.

---

## 3. Reglas de oro

1. **No cierres pendientes por tu cuenta.** Si la tarea depende de un P-xx abierto (lenguaje de Android, formato de las imágenes, nombre de `movil.tipo`…), dilo, da tu recomendación argumentada y **pregunta** antes de seguir.
2. **Respeta los estados.** Lo marcado como `propuesta` (endpoints, pantallas, librerías, plan) es una sugerencia: antes de implementarlo, avisa de que es una propuesta. Si el usuario lo aprueba, cambia la nota a `decidido` y crea un ADR.
3. **Las dos apps deben ser iguales** (la rúbrica lo exige). Toda pantalla tiene un ID `PT-xx` en `08-Diseno-UI/Mapa de pantallas.md`. Si cambias una pantalla en una app, indica qué hay que cambiar en la otra.
4. **La API es el contrato.** Las apps nunca acceden a MySQL directamente. Si cambias un endpoint o el JSON, actualiza `05-API/Endpoints.md` y avisa del impacto en Android **y** en Ionic.
5. **Todo con token**, salvo `POST /api/login` y `POST /api/registro` (nivel 5 de la rúbrica). Comprueba también el rol y que el recurso sea del usuario.
6. **Nada bloquea el hilo principal**: red, imágenes y procesado siempre en segundo plano.
7. **Separa la vista de los datos**: vista → repositorio/servicio → cliente HTTP.
8. **La lógica de negocio vive en la API** (stock, copias disponibles, precios, permisos). Las apps validan para avisar antes, pero quien decide es la API.
9. **Piensa en la rúbrica.** Antes de dar algo por terminado, mira qué fila de `01-Reto/Rubrica.md` cubre y si cumple `02-Equipo/Definicion de terminado.md`.
10. **Es una demo académica:** soluciones simples y explicables. Nada de sobreingeniería ni de librerías "por si acaso".
11. **Todos deben entender todo** (se pregunta en la presentación). Cuando generes código, **explica brevemente qué hace y por qué**, sobre todo lo que no sea evidente, para que cualquier integrante pueda defenderlo.
12. **Documentación de librerías:** antes de usar una API de Symfony, Doctrine, Android, Ionic, Angular o Capacitor, consulta la documentación **actual** (Context7 si está disponible). Las versiones cambian.

---

## 4. Git (resumen; detalle en `02-Equipo/Flujo de trabajo Git.md`)

- Ramas: `main` (estable, **solo por PR**) · `api` · `android` · `ionic` · `docs`. Opcional: ramas de tarea `area-descripcion` (p. ej. `api-login-token`). ⚠️ **Nunca `area/descripcion`**: Git no permite que convivan la rama `api` y `api/algo`.
- ⚠️ Las ramas `api`, `android` e `ionic` se crearon antes que los docs: **la primera vez, haz `git merge origin/main`**.
- **No hagas commit, push ni PR si el usuario no lo pide.** Nunca push directo a `main`. Nunca `--force` sobre ramas compartidas.
- Commits en **español**, cortos y descriptivos, con los IDs de requisito cuando los haya: `Añade login con token (RT-04)`.
- **Nunca se suben:** `.env.local`, credenciales, tokens, `vendor/`, `node_modules/`, `build/`, `*.apk`, `*.jks`, `local.properties`, `CLAUDE.local.md`.
- Cada uno trabaja en **su carpeta**. Si la tarea obliga a tocar el área de otra persona, avísalo.
- Las **migraciones de Doctrine** solo las genera quien lleva la API, y nunca se edita una que ya está en `main`.

---

## 5. Convenciones clave (detalle en `02-Equipo/Convenciones.md`)

- Dominio en **español sin tildes** en el código y la BBDD (`Usuario`, `precioAlquiler`, `linea_pedido`); términos técnicos del framework en inglés (`Controller`, `Repository`, `Adapter`).
- BBDD `snake_case` · PHP y JSON `camelCase` (JSON pendiente de confirmar: P-13) · rutas `/api/<recurso-en-plural-kebab>`.
- Enumerados **idénticos** en BBDD, API y apps: `rol` ∈ {cliente, tecnico, admin} · `producto.tipo` ∈ {videojuego, movil, consola} · departamentos `Telefonía`, `Consolas`.
- Errores de la API: `{"error": {"codigo", "mensaje", "campos"}}` con 400/401/403/404/409/422 (ver `05-API/Formato JSON y errores.md`). Ante un **401**, las apps cierran la sesión y vuelven al login.
- Fechas ISO 8601 · dinero `DECIMAL(10,2)` · coordenadas `DECIMAL(10,7)`.
- Textos visibles al usuario en español; en Android, en `strings.xml`.
- La URL base de la API se define en **un solo sitio** por app.

---

## 6. Avisos que más errores van a evitar

- **A-03:** `producto.tipo` (discriminador de Doctrine) y `movil.tipo` chocan. No crees la entidad `Movil` con una propiedad `tipo` hasta que se decida P-12.
- **A-01:** `linea_pedido` usa `id` + `UNIQUE(pedido_id, producto_id)` según `paso-a-tablas.md`, pero el diagrama muestra la PK compuesta. Pendiente: P-09.
- **A-11:** Windows Phone ya no existe; iOS necesita un Mac. La app Ionic se compilará previsiblemente como APK (P-08).
- **A-12:** AsyncTask está obsoleta. Usar Executors/Handler o corrutinas y justificarlo.
- **A-13:** "Ubicación en cualquier consulta": pendiente de decidir el alcance (P-04).
- Emulador → API local en `10.0.2.2`. HTTP en claro bloqueado en Android 9+. CORS necesario para `ionic serve`. Más en `11-Calidad/Problemas comunes.md`.

---

## 7. Al terminar una tarea: actualiza el contexto

Mantener la bóveda al día **es parte de la tarea**. Antes de cerrar, propón (o haz, si el usuario lo acepta) estos cambios:

| Si has… | Actualiza |
|---|---|
| Terminado o empezado algo | `00-Inicio/Estado actual.md` |
| Cambiado código, una decisión o el contexto | Añadir una entrada **al final** de `00-Inicio/Registro de cambios.md` (`### AAAA-MM-DD — Autor`) |
| Creado o modificado un endpoint | `05-API/Endpoints.md` (estado ⚪/🟡/✅) |
| Cambiado una entidad o tabla | `04-Datos/Tablas/<tabla>.md` (+ el `.drawio` y `docs/paso-a-tablas.md` si cambia el modelo) |
| Creado o cambiado una pantalla | `08-Diseno-UI/Mapa de pantallas.md` (columnas AN/IO) |
| Tomado una decisión con el grupo | Nuevo ADR en `10-Decisiones/` + marcar el P-xx como ✅ |
| Encontrado una contradicción o un riesgo | `00-Inicio/Avisos e inconsistencias.md` |
| Resuelto un problema que costó tiempo | `11-Calidad/Problemas comunes.md` |
| Usado IA de forma relevante (código, pruebas, revisión) | `09-Transversal/Registro de uso de IA.md` (es una evidencia para la nota de Digitalización) |
| Cambiado algo respecto a la propuesta del Hito 1 | `docs/anexo-desviaciones.md` |

**Normas para editar la bóveda** (es una carpeta de red sin historial; varias personas la editan):
- **Vuelve a leer la nota justo antes de editarla** y haz **cambios pequeños y localizados**. No reescribas notas enteras.
- En los registros (cambios, IA, actas) **solo se añade al final**.
- Actualiza `actualizado:` en el frontmatter. Nombres de archivo sin tildes ni ñ. Enlaces con `[[Nota]]`.
- **Nunca** escribas en la bóveda ni en el repo contraseñas, tokens reales ni datos personales reales.

---

## 8. Comandos

> Los proyectos aún no están creados (2026-10-27). Cuando se creen, sustituye esta sección por los comandos reales y actualiza `03-Arquitectura/Entorno de desarrollo.md`.

```bash
# API (api/)
composer install
php bin/console doctrine:migrations:migrate
php bin/console doctrine:fixtures:load        # datos de ejemplo
symfony server:start                           # HTTPS local

# Ionic (ionic/)
npm install && ionic serve
ionic build && npx cap sync android            # APK vía Android Studio

# Android (android/)
./gradlew assembleDebug
```

---

## 9. Quién está usando Claude

Cada integrante tiene en su **carpeta raíz** (la que contiene `JuegalmiDam2/`, desde donde abre Claude Code) un **`CLAUDE.local.md`** personal, que no se comparte, con:

```markdown
Soy <nombre> (GitHub: <usuario>). Mi área principal es <api | android | ionic | docs>.
Firma mis entradas en la bóveda como "<nombre>".
```

Usa ese nombre para firmar las entradas de `Registro de cambios` y `Registro de uso de IA`, y ten en cuenta su área para avisar cuando una tarea toque la de otra persona.
