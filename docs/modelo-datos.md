# Modelo de datos JuegAlmi (v3, 2026-10-28)

Diagrama: `er-juegalmi.drawio` (abrir en https://app.diagrams.net → *Abrir desde dispositivo*).
Página 1 = diagrama E-R; página 2 = modelo relacional (las tablas que creará Doctrine en **MariaDB**).
`er-juegalmi.png` es la vista previa de la página 1 y `relacional-juegalmi.png` la de la página 2.
Paso a tablas: `paso-a-tablas.md`. **v3: el E-R no tiene ciclos** (es un árbol) y ningún dato se guarda dos veces. Detalle completo (tipos, CHECK, triggers, índices): bóveda `04-Datos/`.

## Decisiones

| Decisión | Por qué |
|---|---|
| Un solo `usuario` con `rol` (cliente / admin) | Un único login; el menú cambia según el rol. Los técnicos no inician sesión: el admin gestiona las reparaciones. |
| `producto` + especialización **total y disjunta** `videojuego` / `movil` / `consola` (JOINED) | Un solo carrito y un solo pedido valen para todo. `movil.formato` distingue móvil y tablet (no `tipo`, que es el discriminador). |
| `pedido` N:M `producto` → `linea_pedido(cantidad, precio_unitario, modalidad, …)` con `id` + UNIQUE | Se guarda el precio de ese día. El total **no** se guarda: se calcula. |
| El **alquiler es una línea del pedido** (`modalidad = alquiler`, con `fecha_fin` y `fecha_devolucion`) | Con una entidad `alquiler` aparte había un ciclo usuario–pedido–producto–videojuego–alquiler–usuario. Así un carrito puede comprar y alquilar a la vez; el alquiler empieza en la fecha del pedido y `precio_unitario` es el precio por día. Un trigger impide alquilar algo que no sea videojuego o superar las copias. |
| `tecnico` como entidad propia (N:1 `departamento`); `reparacion` N:1 `tecnico` (obligatoria) | Al crear la reparación la API asigna un técnico del departamento elegido. El departamento de la reparación se saca del técnico: no se guarda dos veces y no hay ciclos (antes: usuario como cliente y como técnico + `atiende`). |
| `servicio` (1:N con `departamento`) | Contenido de las pestañas de "Servicios" de la tienda. |
| `plataforma` como catálogo (una por videojuego) | Filtro principal sin valores repetidos escritos de formas distintas. |
| Ubicación **solo** en `registro_ubicacion` | El enunciado exige la ubicación del usuario en **cualquier consulta**: las apps envían `X-Latitud`/`X-Longitud` y la API registra cada petición (también pedidos y reparaciones). Guardarla además en pedido o reparación sería redundante. |
| `producto.activo` (baja lógica) | No se puede borrar un producto con pedidos (RESTRICT), pero sí retirarlo del catálogo. |
| `tienda` + `foto_tienda` | Datos de la parte Android: ubicación, galería e historia. |
| `token` guardado como hash SHA-256 | Autenticación por token (nivel 5 de la rúbrica); si se filtra la BBDD, los tokens no sirven. |
| Pedidos con recogida en tienda | No hay dirección de envío: estados `pendiente → preparado → entregado` o `cancelado`. |

## Pendiente de decidir en grupo
- ¿Pestañas de Servicios: 2 (una por departamento) o 3? (P-07, preguntar al profesorado). El modelo vale para las dos opciones.
- Los diseños beta muestran valoración (★), favoritos y "Exclusivo", que no están en el modelo (aviso A-08 de la bóveda).
