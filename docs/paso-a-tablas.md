# Paso a tablas (E-R → modelo relacional) – JuegAlmi (v3 definitiva, 2026-10-28)

Diagrama: `er-juegalmi.drawio` (página 1 = E-R, página 2 = modelo relacional). Imágenes: `er-juegalmi.png` y `relacional-juegalmi.png`. Motor: **MariaDB**.
Notación: **negrita** = clave primaria (PK) · `campo → TABLA` = clave foránea (FK) · `(nulo)` = puede ser NULL · UQ = único.

El E-R **no tiene ciclos** (es un árbol) y **ningún dato se guarda dos veces** (ADR-023 de la bóveda).

## Reglas aplicadas

1. **Cada entidad → una tabla.** Sus atributos son las columnas y su identificador la PK.
2. **Relación 1:N → la PK del lado 1 pasa como FK al lado N.** Como en todas las relaciones el lado 1 es (1,1), la FK es **NOT NULL**.
3. **Relación N:M → tabla nueva** con las dos FK y los atributos de la relación. Su clave natural es la combinación de FK (+ `modalidad`); en Doctrine se implementa como `id` propio + `UNIQUE`, que es equivalente (sigue siendo clave candidata).
4. **Especialización (ES UN) total y disjunta → una tabla para el supertipo y una por subtipo.** El subtipo usa como PK la PK del supertipo, que a la vez es FK hacia él (`ON DELETE CASCADE`). El supertipo lleva `tipo` (discriminador de Doctrine).
5. **Atributo compuesto → una columna por componente** (`ubicacion` → `latitud`, `longitud`).
6. **Atributo multivaluado con atributos propios → tabla aparte** (fotos de la tienda → `foto_tienda`).
7. **Atributo derivado → no se guarda** (total del pedido, estado del alquiler, copias disponibles): se calcula en la consulta.
8. **Sin ciclos → sin redundancia:** cada FK es el único camino entre dos tablas. Por ejemplo, el departamento de una reparación no se guarda: se obtiene con `JOIN tecnico`.

## Relaciones → claves foráneas

| Relación (E-R) | Cardinalidades | Tipo | Resultado en tablas | Regla |
|---|---|---|---|---|
| *inicia* | USUARIO (1,1) — (1,N) TOKEN | 1:N | `token.usuario_id → USUARIO` (CASCADE) | 2 |
| *registra* | USUARIO (1,1) — (1,N) REGISTRO_UBICACION | 1:N | `registro_ubicacion.usuario_id → USUARIO` (CASCADE) | 2 |
| *realiza* | USUARIO (1,1) — (1,N) PEDIDO | 1:N | `pedido.usuario_id → USUARIO` | 2 |
| *solicita* | USUARIO (1,1) — (1,N) REPARACION | 1:N | `reparacion.cliente_id → USUARIO` | 2 |
| *asignada* | TECNICO (1,1) — (1,N) REPARACION | 1:N | `reparacion.tecnico_id → TECNICO` | 2 |
| *pertenece* | DEPARTAMENTO (1,1) — (1,N) TECNICO | 1:N | `tecnico.departamento_id → DEPARTAMENTO` | 2 |
| *ofrece* | DEPARTAMENTO (1,1) — (1,N) SERVICIO | 1:N | `servicio.departamento_id → DEPARTAMENTO` | 2 |
| *contiene* | PEDIDO (1,N) — (1,N) PRODUCTO | **N:M** | Tabla nueva `linea_pedido` (compras **y** alquileres) | 3 |
| *fabrica* | MARCA (1,1) — (1,N) PRODUCTO | 1:N | `producto.marca_id → MARCA` | 2 |
| *es de* | PLATAFORMA (1,1) — (1,N) VIDEOJUEGO | 1:N | `videojuego.plataforma_id → PLATAFORMA` | 2 |
| *muestra* | TIENDA (1,1) — (1,N) FOTO_TIENDA | 1:N | `foto_tienda.tienda_id → TIENDA` (CASCADE) | 2, 6 |
| **ES UN** | PRODUCTO → VIDEOJUEGO / MOVIL / CONSOLA | total y disjunta | `videojuego.id`, `movil.id`, `consola.id` → PRODUCTO (CASCADE) + `producto.tipo` | 4 |

## Tablas (17)

| Tabla | Columnas | Regla |
|---|---|---|
| DEPARTAMENTO | (**id**, nombre UQ) | 1 |
| SERVICIO | (**id**, nombre, descripcion, precio_orientativo (nulo), `departamento_id → DEPARTAMENTO`) | 1, 2 |
| TECNICO | (**id**, nombre, telefono, `departamento_id → DEPARTAMENTO`) | 1, 2 |
| USUARIO | (**id**, nombre, apellidos, email UQ, password, telefono, dni UQ, rol, foto (nulo), activo) | 1 |
| TOKEN | (**id**, token_hash UQ, fecha_creacion, fecha_expira, `usuario_id → USUARIO`) | 1, 2 |
| REGISTRO_UBICACION | (**id**, fecha, latitud, longitud, metodo, ruta, `usuario_id → USUARIO`) | 1, 2, 5 |
| MARCA | (**id**, nombre UQ) | 1 |
| PLATAFORMA | (**id**, nombre UQ) | 1 |
| PRODUCTO | (**id**, nombre, descripcion, precio, stock, imagen, activo, tipo, `marca_id → MARCA`) | 1, 2, 4 |
| VIDEOJUEGO | (**`id → PRODUCTO`**, genero, pegi, precio_alquiler, copias_alquiler, `plataforma_id → PLATAFORMA`) | 4, 2 |
| MOVIL | (**`id → PRODUCTO`**, formato, pantalla_pulgadas, ram_gb, almacenamiento_gb) | 4 |
| CONSOLA | (**`id → PRODUCTO`**, modelo, almacenamiento_gb) | 4 |
| PEDIDO | (**id**, fecha, estado, metodo_pago, `usuario_id → USUARIO`) | 1, 2 |
| LINEA_PEDIDO | (**id**, `pedido_id → PEDIDO`, `producto_id → PRODUCTO`, modalidad, cantidad, precio_unitario, fecha_fin (nulo), fecha_devolucion (nulo)) + UQ(pedido_id, producto_id, modalidad) | 3 |
| REPARACION | (**id**, dispositivo, problema, estado, fecha_entrada, fecha_salida (nulo), presupuesto (nulo), foto (nulo), `cliente_id → USUARIO`, `tecnico_id → TECNICO`) | 1, 2 |
| TIENDA | (**id**, nombre, direccion, latitud, longitud, historia) | 1, 5 |
| FOTO_TIENDA | (**id**, imagen, descripcion, `tienda_id → TIENDA`) | 2, 6 |

**Total: 17 tablas** = 16 entidades (contando los 3 subtipos) + 1 tabla de la relación N:M.

### Cómo se guarda un alquiler
Un alquiler es una **línea del pedido** con `modalidad = 'alquiler'`:
- empieza en `pedido.fecha` y termina en `fecha_fin` (devolución prevista);
- `fecha_devolucion` nula = todavía no devuelto;
- `precio_unitario` es el precio **por día** de ese momento (histórico); el total se calcula con los días.

En las compras (`modalidad = 'compra'`), `fecha_fin` y `fecha_devolucion` son nulas.

## Restricciones

- **Únicos:** `usuario.email`, `usuario.dni`, `token.token_hash`, `departamento.nombre`, `marca.nombre`, `plataforma.nombre`, `linea_pedido(pedido_id, producto_id, modalidad)`.
- **Valores permitidos (CHECK):** `producto.activo` y `usuario.activo` ∈ {0, 1} · `usuario.rol` ∈ {cliente, admin} · `linea_pedido.modalidad` ∈ {compra, alquiler} · `producto.tipo` ∈ {videojuego, movil, consola} · `movil.formato` ∈ {movil, tablet} · `videojuego.pegi` ∈ {3, 7, 12, 16, 18} · `pedido.estado` ∈ {pendiente, preparado, entregado, cancelado} · `pedido.metodo_pago` ∈ {tarjeta, bizum, paypal, en_tienda} · `reparacion.estado` ∈ {recibida, en_reparacion, lista, entregada, cancelada}.
- **Numéricas (CHECK):** precios, stock, copias y presupuesto ≥ 0 · `cantidad` ≥ 1 · pantalla, RAM y almacenamiento > 0 · latitud ∈ [-90, 90] y longitud ∈ [-180, 180].
- **Entre columnas (CHECK):** `fecha_fin` no nula ⇔ `modalidad = alquiler` · `fecha_devolucion` solo en alquileres · `fecha_salida` no nula ⇔ `estado = entregada` · `fecha_salida ≥ fecha_entrada` · `fecha_expira > fecha_creacion`.
- **Entre tablas (triggers):** `producto.tipo` coincide con la subtabla (disjunción) y no cambia · solo se alquilan videojuegos, sin superar `copias_alquiler` y con `fecha_fin` ≥ fecha del pedido.
- **Borrado:** `RESTRICT` en todo lo que es historial (usuario o producto con pedidos o reparaciones; técnico con reparaciones; marca, plataforma y departamento en uso). `CASCADE`: pedido → líneas, usuario → tokens y registro de ubicación, tienda → fotos, producto → fila del subtipo. `ON UPDATE RESTRICT` en todas (las PK no cambian).
- **Baja lógica (`activo`):** en vez de borrar, se desactiva. `producto.activo = 0` retira del catálogo un videojuego, móvil o consola (los subtipos lo heredan de PRODUCTO, así que no se repite en sus tablas); `usuario.activo = 0` desactiva la cuenta (no puede iniciar sesión ni aparece en los listados). Con `activo = 1` vuelven a aparecer. El historial (pedidos, reparaciones) se conserva.
- Las cardinalidades mínimas (1,N) del E-R no se pueden obligar en MariaDB (una FK no impide que un usuario no tenga pedidos): son reglas de negocio.

## Normalización

- **1FN:** atributos atómicos (`ubicacion` se separa en dos columnas; las fotos van en su tabla).
- **2FN:** la única clave compuesta es la candidata `(pedido_id, producto_id, modalidad)` de `linea_pedido`, y sus atributos dependen de la clave completa.
- **3FN / FNBC:** cada determinante es clave candidata. No hay desnormalizaciones: el departamento de una reparación se obtiene del técnico y la ubicación del usuario solo está en `registro_ubicacion`.

## Nota para Symfony (Doctrine)

- Herencia: `#[ORM\InheritanceType('JOINED')]` + `#[ORM\DiscriminatorColumn(name: 'tipo')]` en `Producto`.
- `LineaPedido`: `id` propio + `#[ORM\UniqueConstraint(columns: ['pedido_id', 'producto_id', 'modalidad'])]`.
- `Tecnico` es una entidad normal (no implementa `UserInterface`: no inicia sesión).
- Doctrine **no genera CHECK ni triggers**: se añaden a mano en una migración (`addSql`). Nunca crear el esquema con `doctrine:schema:create`/`update`.
- Diseño físico completo (tipos, CHECK, triggers, índices y SQL): bóveda `04-Datos/Diseno fisico MariaDB.md`.
