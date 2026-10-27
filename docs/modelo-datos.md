# Modelo de datos JuegAlmi

Diagrama: `er-juegalmi.drawio` (abrir en https://app.diagrams.net → *Abrir desde dispositivo*).
Página 1 = diagrama E-R; página 2 = modelo relacional (las tablas que creará Doctrine).
`er-juegalmi.png` es una vista previa rápida de la página 1.

## Decisiones

| Decisión | Por qué |
|---|---|
| Un solo `usuario` con `rol` (cliente / tecnico / admin) | Un único login; el menú cambia según el rol. Los técnicos tienen `departamento_id`. |
| `producto` + especialización `videojuego` / `movil` / `consola` | Un solo carrito y un solo pedido valen para todo; lo propio de cada tipo va en su tabla. `movil.tipo` distingue móvil y tablet. |
| `pedido` N:M `producto` → `linea_pedido(cantidad, precio_unitario)` | Un pedido tiene varios productos; se guarda el precio de ese día. El total **no** se guarda: se calcula (sin redundancia). |
| `alquiler` como entidad propia | Un juego se alquila muchas veces; hay que saber quién, cuándo y si lo ha devuelto (`fecha_devolucion` nula = no devuelto). |
| `reparacion` con `departamento` y `tecnico` | Los dos departamentos de soporte (Telefonía, Consolas). El técnico se asigna después (puede ser nulo). |
| `latitud` / `longitud` en pedido, alquiler y reparación | El enunciado exige saber la localización del usuario en cada consulta. |
| `tienda` + `foto_tienda` | Datos de la parte Android: ubicación, galería e historia. |
| `token` | Autenticación por token (nivel 5 de la rúbrica de Acceso a datos y PSP). |

## Pendiente de decidir en grupo
- ¿Un videojuego puede estar en varias plataformas? (ahora: una; si no, tabla `plataforma` N:M).
- ¿Se alquilan también consolas? (ahora: solo videojuegos).
- Valores exactos de `estado` en pedido y reparación.
