# Modelo de datos JuegAlmi (v5, 2026-10-28)

Diagrama: `er-juegalmi.drawio` (abrir en https://app.diagrams.net → *Abrir desde dispositivo*).
Página 1 = diagrama E-R; página 2 = modelo relacional (las tablas que creará Doctrine en **MariaDB**).
`er-juegalmi.png` es la vista previa de la página 1 y `relacional-juegalmi.png` la de la página 2.
Paso a tablas: `paso-a-tablas.md`. Ningún dato se guarda dos veces. **v4:** `usuario` se especializa en `cliente` y `trabajador` (ADR-032) y `servicio` pasa a tener `linea` (ADR-030). **v5:** `linea_pedido` se especializa en `compra` y `alquiler` (ADR-033). 20 tablas. Detalle completo (tipos, CHECK, triggers, índices): bóveda `04-Datos/`.

## Decisiones

| Decisión | Por qué |
|---|---|
| `usuario` + especialización **total y disjunta** `cliente` / `trabajador` (JOINED) | Un único login para todos. Solo un **cliente** hace pedidos y pide reparaciones (`dni`, `foto`); un **trabajador** es técnico (con departamento) o admin (`puesto`). El rol sale del subtipo: ya no hay columna `rol`. |
| `producto` + especialización **total y disjunta** `videojuego` / `movil` / `consola` (JOINED) | Un solo carrito y un solo pedido valen para todo. `movil.formato` distingue móvil y tablet (no `tipo`, que es el discriminador). |
| `linea_pedido` (entidad: pedido 1:N línea N:1 producto) + especialización **total y disjunta** `compra` / `alquiler` (JOINED) | Cada tipo de línea tiene solo sus datos: la compra `cantidad` y `precio_unitario`; el alquiler `precio_dia`, `fecha_fin` y `fecha_devolucion`. Sin columnas vacías ni CHECK de "solo si es alquiler". Se guarda el precio de ese día; el total **no** se guarda. |
| El **alquiler es una línea del pedido** (subtipo `alquiler`, de una copia) | Con una entidad `alquiler` aparte había un ciclo usuario–pedido–producto–videojuego–alquiler–usuario. Así un carrito puede comprar y alquilar a la vez; el alquiler empieza en la fecha del pedido y `precio_dia` es el precio por día. Un trigger impide alquilar algo que no sea videojuego o superar las copias. |
| `reparacion` N:1 `trabajador` (obligatoria, solo técnicos); `trabajador` N:1 `departamento` (nulo en el admin) | Al crear la reparación la API asigna un técnico del departamento elegido. El departamento de la reparación se saca del técnico: no se guarda dos veces. Los técnicos entran en la web y ven las reparaciones de su departamento. |
| `servicio` con `linea` (videojuegos / consolas / telefonia), sin relación con `departamento` | Contenido de las 3 pestañas de "Servicios" de la tienda (ADR-030). |
| `plataforma` como catálogo (una por videojuego) | Filtro principal sin valores repetidos escritos de formas distintas. |
| Ubicación **solo** en `registro_ubicacion` | El enunciado exige la ubicación del usuario en **cualquier consulta**: las apps envían `X-Latitud`/`X-Longitud` y la API registra cada petición (también pedidos y reparaciones). Guardarla además en pedido o reparación sería redundante. |
| `activo` (baja lógica) en `producto` y `usuario` | No se puede borrar un producto o un usuario con historial (RESTRICT), pero sí desactivarlo: con `false` desaparece y con `true` vuelve a aparecer. Videojuego, móvil y consola lo heredan de `producto` (no se repite). |
| `tienda` + `foto_tienda` | Datos de la parte Android: ubicación, galería e historia. |
| `token` guardado como hash SHA-256 | Autenticación por token (nivel 5 de la rúbrica); si se filtra la BBDD, los tokens no sirven. |
| Pedidos con recogida en tienda | No hay dirección de envío: estados `pendiente → preparado → entregado` o `cancelado`. |

## Pendiente de decidir en grupo
- Los diseños beta muestran valoración (★), favoritos y "Exclusivo", que no están en el modelo (aviso A-08 de la bóveda).
