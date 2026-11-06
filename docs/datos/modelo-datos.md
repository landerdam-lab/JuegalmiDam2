# Modelo de datos JuegAlmi (v7, 2026-11-06)

Diagrama: `er-juegalmi.drawio` (abrir en https://app.diagrams.net → *Abrir desde dispositivo*).
Página 1 = diagrama E-R; página 2 = modelo relacional (las tablas que creará Doctrine en **MariaDB**).
`er-juegalmi.png` es la vista previa de la página 1 y `relacional-juegalmi.png` la de la página 2.
Paso a tablas: `paso-a-tablas.md`. Ningún dato se guarda dos veces. **v4:** `usuario` se especializa en `cliente` y `trabajador` (ADR-032) y `servicio` pasa a tener `linea` (ADR-030). **v6:** `compra` y `alquiler` cuelgan directamente del pedido (ADR-034). **v7:** `proveedor` y `producto_proveedor` (ADR-042). **21 tablas**, SQL probado en MariaDB 11.4. Detalle completo (tipos, CHECK, triggers, índices): bóveda `04-Datos/`.

## Decisiones

| Decisión | Por qué |
|---|---|
| `usuario` + especialización **total y disjunta** `cliente` / `trabajador` (JOINED) | Un único login para todos. Solo un **cliente** hace pedidos y pide reparaciones (`dni`, `foto`); un **trabajador** es técnico (con departamento) o admin (`puesto`). El rol sale del subtipo: ya no hay columna `rol`. |
| `producto` + especialización **total y disjunta** `videojuego` / `movil` / `consola` (JOINED) | Un solo carrito y un solo pedido valen para todo. `movil.formato` distingue móvil y tablet (no `tipo`, que es el discriminador). |
| `compra` (N:M `pedido`–`producto`: `cantidad`, `precio_unitario`) y `alquiler` (N:M `pedido`–`videojuego`: `precio_dia`, `fecha_fin`, `fecha_devolucion`), con `id` + UNIQUE | Un carrito puede comprar y alquilar a la vez. Cada tabla tiene solo sus datos (sin columnas vacías) y la **FK a `videojuego`** garantiza que solo se alquilan videojuegos. Se guarda el precio de ese día; el total **no** se guarda. Los alquileres de un pedido **cancelado** no ocupan copia. |
| El **alquiler cuelga del pedido** (una copia por fila) | Con una entidad `alquiler` aparte había un ciclo usuario–pedido–producto–videojuego–alquiler–usuario. Así un carrito puede comprar y alquilar a la vez; el alquiler empieza en la fecha del pedido y `precio_dia` es el precio por día. Un trigger impide alquilar algo que no sea videojuego o superar las copias. |
| `reparacion` N:1 `trabajador` (obligatoria, solo técnicos); `trabajador` N:1 `departamento` (nulo en el admin) | Al crear la reparación la API asigna un técnico del departamento elegido. El departamento de la reparación se saca del técnico: no se guarda dos veces. Los técnicos entran en la web y ven las reparaciones de su departamento. |
| `servicio` con `linea` (videojuegos / consolas / telefonia), sin relación con `departamento` | Contenido de las 3 pestañas de "Servicios" de la tienda (ADR-030). |
| `plataforma` como catálogo (una por videojuego) | Filtro principal sin valores repetidos escritos de formas distintas. |
| Ubicación **solo** en `registro_ubicacion` | El enunciado exige la ubicación del usuario en **cualquier consulta**: las apps envían `X-Latitud`/`X-Longitud` y la API registra cada petición (también pedidos y reparaciones). Guardarla además en pedido o reparación sería redundante. (El punto de entrega de un pedido a domicilio es otro dato: **adónde** se envía, no desde dónde se pidió.) |
| `activo` (baja lógica) en `producto` y `usuario` | No se puede borrar un producto o un usuario con historial (RESTRICT), pero sí desactivarlo: con `false` desaparece y con `true` vuelve a aparecer. Videojuego, móvil y consola lo heredan de `producto` (no se repite). |
| `tienda` + `foto_tienda` | Datos de la parte Android: ubicación, galería e historia. |
| `proveedor` + `producto_proveedor` (N:M con `precio_coste`, `id` + UNIQUE de la pareja) (ADR-042) | A quién compra la tienda cada producto y cuánto le cuesta. No es la `marca` (quien lo **fabrica**): el proveedor se lo **vende** a la tienda, y un mismo producto puede tener varios proveedores con precios distintos. Solo lo ve el admin en la web; el catálogo y las apps no muestran nunca el precio de coste. Un proveedor que sirve productos no se borra (RESTRICT); al borrar un producto se borran sus filas (CASCADE). |
| `token` guardado como hash SHA-256 | Autenticación por token (nivel 5 de la rúbrica); si se filtra la BBDD, los tokens no sirven. |
| Pedidos con **recogida en tienda o envío a domicilio** (ADR-038) | `pedido.entrega` ∈ {tienda, domicilio}. A domicilio se guardan la dirección que escribe el cliente y el punto que marca en el mapa (`latitud_entrega`, `longitud_entrega`); un CHECK obliga a los tres o a ninguno. El envío es gratis, así que el total no cambia. Estados: `pendiente → preparado → entregado` o `cancelado`. |

## Pendiente de decidir en grupo
- Los diseños beta muestran valoración (★), favoritos y "Exclusivo", que no están en el modelo (aviso A-08 de la bóveda).
