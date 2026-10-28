# Proyecto de Stitch

| Dato | Valor |
|---|---|
| Proyecto | **JuegAlmi · Sistema Cartucho** · ID `7116997598018930573` (privado, en la cuenta de Google de Oier) |
| Sistema de diseño claro | «Cartucho · Claro» · `assets/6384458578186399009` |
| Sistema de diseño oscuro | «Cartucho · Oscuro» · `assets/16111119555952102661` |
| Fecha | 2026-10-28 |
| Herramienta | Stitch (MCP) desde Claude Code · modelo `GEMINI_3_8_FLASH` · dispositivo `MOBILE` (390 px) |
| Exportación | `screens/<nn>-<nombre>-light.png` y `-dark.png`, a 1× (390 px de ancho, 256 colores). Resúmenes: `screens/00-resumen-light.png` y `00-resumen-dark.png` |

> Para reabrirlo: entra en stitch.withgoogle.com con la cuenta del proyecto → proyecto «JuegAlmi · Sistema Cartucho». Desde Claude Code con el MCP de Stitch: `get_project` con `projects/7116997598018930573` y `list_screens`.
> El HTML de cada pantalla (Tailwind) se puede descargar con `download_file` (campo `htmlCode.name` de `list_screens`). Es **solo de referencia**: el código real usa los tokens generados, no las clases de Tailwind de Stitch.

## Pantallas definitivas (las que se exportaron)

| Fichero | PT | Claro (screen id) | Oscuro (screen id) |
|---|---|---|---|
| `01-splash` | PT-01 | `6b6bb1277f544da493573e61e2aee5ad` | `6f22d79f958c43fc8b2736e9809096e2` |
| `02-login` | PT-02 | `a050401211c64ea5b5f57d32016c2ee1` | `8c8573e0ff164a5b826dbc2efe4473bd` |
| `03-registro` | PT-03 | `a167ae4692ad4498b1568fec3a73d84b` | `8e40646afddd461d900a7a9ecc6458e9` |
| `04-inicio` | PT-04 | `4aa72a3f0eb943058a7e6bea4f9a03c6` | `a4e3305a168e48579334eb898a3aff72` |
| `05-catalogo-videojuegos` | PT-05 | `deaadcf7c7694456af2072bed0d0ab2c` | `11de23a00c6d4a0ea140ee6fa8785e09` |
| `06-detalle-videojuego` | PT-06 | `181786d9ce4a4032b04f16af231f600f` | `65315bed385844308cefef1df93db312` |
| `07-catalogo-moviles` | PT-07 | `cffa2636513c499cb347cec14c041f06` | `e0dfcd6162224f41a2c69903b46abded` |
| `08-detalle-movil` | PT-08 (+ PT-10) | `206b1bd5c7734ae18b88259edad76c80` | `b371b265b7fd4783aa4cbf08a4733f69` |
| `09-catalogo-consolas` | PT-09 | `6fb0bb3e5a18445dbed07be346a4e008` | `b5db3a0d66494d21ae76f8051477a6fd` |
| `11-carrito` | PT-11 | `cc0d229c4ae84d61ba3bfbd0332ec03d` | `4b643425247741bebee4708a151c8bce` |
| `12-confirmar-pedido` | PT-12 | `96f73dfb8c084e3183e60fa50a4011e2` | `3840ea96456447f587f25bf4a871622d` |
| `12b-pedido-realizado` | PT-12 (éxito) | `13f22c10539f4ffeb4a6fcf864ca6ff8` | `dac8a89895db4c18a712a348428f54f8` |
| `13-mis-pedidos` | PT-13 | `6e99ce5c1974457aaaf13b989e36a1e3` | `47763c6731764702a6db2aa78ee161ad` |
| `14-detalle-pedido` | PT-14 | `8288dcce31794190a76b90338151af3e` | `ba9dcd12b0ff47b0afc04e47ba750a0a` |
| `15-alquilar` | PT-15 | `2369f5011ba140d4b46be4ef49771596` | `5276f8134f8848ce9712bb9f985b5a04` |
| `16-mis-alquileres` | PT-16 | `da5e1bdf1fa3440ebeefdb558b0972e3` | `2ce2c6aa8ee1402faa481b382479016a` |
| `17-solicitar-reparacion` | PT-17 | `6ac8314c5b5545dbb257043e4048787e` | `b6cc6422b08c48859480776eb83a237b` |
| `18-mis-reparaciones` | PT-18 | `27a9df5d335d4fff9f5744a309fd33b6` | `b310fad02b72409c98487a981cd89d68` |
| `19-panel-tecnico` | PT-19 | `4d9cbaec00234ae0b68cf861710f4be9` | `fb1d597417344786bc0decf12a7e5257` |
| `20-gestionar-reparacion` | PT-20 | `a030694da9084e63bd6542815e585d5a` | `2ac0edab7bbb441bb650e73b7eb2aa67` |
| `21-perfil` | PT-21 | `928eb61184e64a708b3179e8a9c4ff97` | `1a9772c3f42647639fff95e46d85355f` |
| `22-admin-productos` | PT-22 | `047ec170869242338956e844f4879383` | `fb143ae9f3394ce7b6706fbd132dae0a` |
| `23-admin-usuarios` | PT-23 | `1d11cc6c634a46afb0c94fe13c161eae` | `b98006f68c8f4c909cd34e398cf3959b` |
| `24-la-tienda` | PT-24 | `4ae65f7bcc5f4471a4a1fd82647ae189` | `b48ccaf9f9694c848d590ab3dd8dea88` |
| `25-servicios` | PT-25 | `918391fa01c44792b4169fbc73ca4aba` | `49ab48f262b849ab83dcb769326c4ec7` |
| `26-ubicacion` | PT-26 | `a6a6871e6d5541d19015f4fbd5e7f0b4` | `4b9a60c3275e43aba3fa325abfae5de0` |
| `27-galeria` | PT-27 | `2887a19943664e3eae592fdee841d150` | `e99f872cf2b34d77bd6b892935aa1593` |
| `28-historia` | PT-28 | `f5924e5d21874679a5e37306306e1d47` | `62b39aa7312147868a4df8f697e518c5` |
| `29-busqueda-voz` | PT-29 | `22a4e589569447e2b3ecd2f02336fa31` | `8d1466dc19414a15b814797f72d93493` |
| `n1-menu-lateral` | común (drawer) | `88dd6c4bbfdf41b89d71039cbfafc8d7` | `727d9164cd894f0483b3b22df1cef932` |
| `e1-estados-carga-vacio-error` | común | `0bfe7bbf0cf04287b21cb02f74d1e44c` | `a7b0c0afc9954605b61cf5cf00dc5b9a` |
| `c1-componentes-1` | sistema | `2c8907b8b197494f976cbd1c35949d87` | `b00753589e0a46f4bef13e95f77817ab` |
| `c2-componentes-2` | sistema | `df70fc98f6064cc8ab24f807e82c1dda` | `b4a72723e20545558923895d701cec84` |

Stitch titula el drawer «PT-37» y los estados «PT-38». Esos IDs **no existen** en el Mapa de pantallas: en el repo se llaman `n1-…` y `e1-…`. En el proyecto también quedan versiones antiguas (las de la iteración 1) con el mismo título; las válidas son las de esta tabla.

## Cómo se hizo (iteraciones)
1. **Sistema:** `create_design_system` con la paleta, las fuentes y el brief de `stitch/design-system-stitch.md` (muesca, barra de vida, prohibiciones).
2. **Iteración 1:** 33 pantallas en claro con `generate_screen_from_text`, una por PT. Cada prompt repite los tokens y describe la pantalla con datos reales del modelo (campos de las 17 tablas).
3. **Iteración 2 (coherencia global):** `edit_screens` por lotes. Se quitan las barras inferiores, los chips seleccionados pasan a violeta suave, la barra de vida usa un solo color por estado, la muesca va en todas las tarjetas, se elimina lo inventado y se pasa a formato móvil.
4. **Iteración 3 (correcciones puntuales):** `generate_variants` (REFINE) en PT-04 (muesca en las tarjetas, sin «TOP CATÁLOGO»), PT-07 (un solo elemento amarillo), PT-13 (sin barra inferior) y PT-16 (sin recargos ni botones inventados).
5. **Modo oscuro:** `generate_variants` (COLOR_SCHEME, REFINE) de cada pantalla definitiva con los tokens de `color.dark`.

**Lo que aprendimos de la herramienta (para regenerar):**
- `generate_variants` y `edit_screens` con **varias** pantallas solo procesan **una**. Hay que hacer una llamada por pantalla.
- `edit_screens` «en sitio» a veces **no actualiza** la captura ni el HTML exportables. Las correcciones fiables son con `generate_variants` (crean una pantalla nueva).
- Las llamadas dan *timeout* en el cliente, pero terminan en el servidor: se comprueba con `list_screens`.

### Prompt base (resumen)
> «PT-xx "<nombre>" — LIGHT mode, "Cartucho" system (bg #FBF8F3; white cards 1px border #D8D0E5 with TOP-RIGHT corner cut at 45° 16px; ink #1C1530; violet #5B2EC2; yellow #FFC629 primary with ink text; prices JetBrains Mono bold; Bricolage Grotesque headings; DM Sans body). Spanish copy. NO bottom navigation. <contenido de la pantalla con los campos del modelo>. No ratings, no hearts, no gradients.»
>
> Oscuro: «DARK MODE of exactly the same screen (only colours change): bg #120D20, surfaces #1C1630 + border #3E355E, … No shadows, no gradients. Title = same name + " · Oscuro".»

## ⚠️ Notas de revisión: lo que hay que IGNORAR de las pantallas
Stitch rellena con textos de ejemplo. Al implementar, **manda el modelo de datos**, no la imagen:

| Dónde | Ignorar | Motivo |
|---|---|---|
| Varias | Etiquetas «PT-xx» dentro de la interfaz (cabecera de 02, 03, 12b, 16, 24-28) | Son anotaciones de Stitch |
| 03, 11, 12, 14 | Horarios («10:00-20:30»), «Listo en 2 horas», «envíos 24/48 h», «Tienda física en Madrid», «Gratis», «Inmediato», «IVA (21 %)» | No están en la BBDD; los pedidos son de **recogida en tienda** (ADR-015 en la bóveda) |
| 08, 09, 12, 13, 22 | «Garantía 3 años / activa», «3 años de garantía y plan Renove» | No existe la garantía en el modelo |
| 15, 16 | «Fianza reembolsable», «Socio VIP», «Factura #ALQ-…», recargos por retraso | Sin fianza, socios ni recargos (P-27 recomienda que no haya recargo) |
| 14 | «Código de retirada / QR» | No existe |
| 19, 20 | «Mesa 02», «Taller central · Puesto 03», «Almacén de repuestos», «Diagnóstico preliminar» | No existen |
| 22 | «Buscar por EAN o SKU», «Salud de catálogo», «En oferta» | No hay EAN/SKU ni ofertas |
| 24, 26, 28 | Dirección concreta, teléfono, «Est. 1998», «Tienda oficial» | Salen de la tabla `tienda` (datos de ejemplo de la API) |
| 25 | Etiquetas de los servicios («Mantenimiento», «Repuesto original») | `servicio` solo tiene nombre, descripción y precio orientativo |
| 05 | Banner «Tu último alquiler activo» | No está en el Mapa de pantallas; opcional |
| 12b oscuro | El ticket se queda en blanco con texto claro (poco contraste) | Al implementar, el ticket usa `superficie` y `texto` de cada modo |
| 06, 08 | «Devolución flexible», «Nuevo y precintado» | No están en el modelo |
