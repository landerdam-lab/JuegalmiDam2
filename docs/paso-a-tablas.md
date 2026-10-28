# Paso a tablas (E-R → modelo relacional) – JuegAlmi (v5, 2026-10-28)

Diagrama: `er-juegalmi.drawio` (página 1 = E-R, página 2 = modelo relacional). Imágenes: `er-juegalmi.png` y `relacional-juegalmi.png`. Motor: **MariaDB**.
Notación: **negrita** = clave primaria (PK) · `campo → TABLA` = clave foránea (FK) · `(nulo)` = puede ser NULL · UQ = único.

**Ningún dato se guarda dos veces** (ADR-023 de la bóveda). v4: USUARIO se especializa en CLIENTE y TRABAJADOR (ADR-032) y SERVICIO pasa a tener `linea` (ADR-030). v5: LINEA_PEDIDO es una entidad que se especializa en COMPRA y ALQUILER (ADR-033).

## Reglas aplicadas

1. **Cada entidad → una tabla.** Sus atributos son las columnas y su identificador la PK.
2. **Relación 1:N → la PK del lado 1 pasa como FK al lado N.** Si el lado 1 es (1,1), la FK es **NOT NULL**; si es (0,1), admite nulo (`trabajador.departamento_id`, porque el admin no tiene departamento).
3. **Relación N:M → tabla nueva** con las dos FK y los atributos de la relación. (v5: ya no queda ninguna. La antigua N:M PEDIDO–PRODUCTO es ahora la entidad LINEA_PEDIDO con dos 1:N, porque solo una entidad se puede especializar.)
4. **Especialización (ES UN) total y disjunta → una tabla para el supertipo y una por subtipo.** El subtipo usa como PK la PK del supertipo, que a la vez es FK hacia él (`ON DELETE CASCADE`). El supertipo lleva `tipo` (discriminador de Doctrine). Se aplica tres veces: PRODUCTO, USUARIO y LINEA_PEDIDO.
5. **Atributo compuesto → una columna por componente** (`ubicacion` → `latitud`, `longitud`).
6. **Atributo multivaluado con atributos propios → tabla aparte** (fotos de la tienda → `foto_tienda`).
7. **Atributo derivado → no se guarda** (total del pedido, estado del alquiler, copias disponibles): se calcula en la consulta.
8. **Sin redundancia:** el departamento de una reparación no se guarda: se obtiene con `JOIN trabajador`.

### El camino USUARIO → CLIENTE → REPARACION → TRABAJADOR → USUARIO
No es un ciclo de datos repetidos: las flechas ES UN no son relaciones, sino "es un tipo de". Como la especialización es **disjunta**, el cliente y el técnico de una reparación son siempre personas distintas, y ningún dato se puede obtener por dos caminos diferentes.

## Relaciones → claves foráneas

| Relación (E-R) | Cardinalidades | Tipo | Resultado en tablas | Regla |
|---|---|---|---|---|
| *inicia* | USUARIO (1,1) — (1,N) TOKEN | 1:N | `token.usuario_id → USUARIO` (CASCADE) | 2 |
| *registra* | USUARIO (1,1) — (1,N) REGISTRO_UBICACION | 1:N | `registro_ubicacion.usuario_id → USUARIO` (CASCADE) | 2 |
| *realiza* | CLIENTE (1,1) — (1,N) PEDIDO | 1:N | `pedido.cliente_id → CLIENTE` | 2 |
| *solicita* | CLIENTE (1,1) — (1,N) REPARACION | 1:N | `reparacion.cliente_id → CLIENTE` | 2 |
| *asignada* | TRABAJADOR (1,1) — (1,N) REPARACION | 1:N | `reparacion.tecnico_id → TRABAJADOR` (solo `puesto = tecnico`) | 2 |
| *pertenece* | DEPARTAMENTO (0,1) — (1,N) TRABAJADOR | 1:N | `trabajador.departamento_id → DEPARTAMENTO` (nulo en el admin) | 2 |
| *contiene* | PEDIDO (1,1) — (1,N) LINEA_PEDIDO | 1:N | `linea_pedido.pedido_id → PEDIDO` (CASCADE) | 2 |
| *incluye* | PRODUCTO (1,1) — (1,N) LINEA_PEDIDO | 1:N | `linea_pedido.producto_id → PRODUCTO` | 2 |
| *fabrica* | MARCA (1,1) — (1,N) PRODUCTO | 1:N | `producto.marca_id → MARCA` | 2 |
| *es de* | PLATAFORMA (1,1) — (1,N) VIDEOJUEGO | 1:N | `videojuego.plataforma_id → PLATAFORMA` | 2 |
| *muestra* | TIENDA (1,1) — (1,N) FOTO_TIENDA | 1:N | `foto_tienda.tienda_id → TIENDA` (CASCADE) | 2, 6 |
| **ES UN** | USUARIO → CLIENTE / TRABAJADOR | total y disjunta | `cliente.id`, `trabajador.id` → USUARIO (CASCADE) + `usuario.tipo` | 4 |
| **ES UN** | LINEA_PEDIDO → COMPRA / ALQUILER | total y disjunta | `compra.id`, `alquiler.id` → LINEA_PEDIDO (CASCADE) + `linea_pedido.tipo` | 4 |
| **ES UN** | PRODUCTO → VIDEOJUEGO / MOVIL / CONSOLA | total y disjunta | `videojuego.id`, `movil.id`, `consola.id` → PRODUCTO (CASCADE) + `producto.tipo` | 4 |

SERVICIO no participa en ninguna relación (ADR-030): su `linea` es la pestaña de la tienda.

## Tablas (20)

| Tabla | Columnas | Regla |
|---|---|---|
| DEPARTAMENTO | (**id**, nombre UQ) | 1 |
| SERVICIO | (**id**, nombre, descripcion, precio_orientativo (nulo), linea) + UQ(linea, nombre) | 1 |
| USUARIO | (**id**, nombre, apellidos, email UQ, password, telefono, activo, tipo) | 1, 4 |
| CLIENTE | (**`id → USUARIO`**, dni UQ, foto (nulo)) | 4 |
| TRABAJADOR | (**`id → USUARIO`**, puesto, `departamento_id → DEPARTAMENTO` (nulo)) | 4, 2 |
| TOKEN | (**id**, token_hash UQ, fecha_creacion, fecha_expira, `usuario_id → USUARIO`) | 1, 2 |
| REGISTRO_UBICACION | (**id**, fecha, latitud, longitud, metodo, ruta, `usuario_id → USUARIO`) | 1, 2, 5 |
| MARCA | (**id**, nombre UQ) | 1 |
| PLATAFORMA | (**id**, nombre UQ) | 1 |
| PRODUCTO | (**id**, nombre, descripcion, precio, stock, imagen, activo, tipo, `marca_id → MARCA`) | 1, 2, 4 |
| VIDEOJUEGO | (**`id → PRODUCTO`**, genero, pegi, precio_alquiler, copias_alquiler, `plataforma_id → PLATAFORMA`) | 4, 2 |
| MOVIL | (**`id → PRODUCTO`**, formato, pantalla_pulgadas, ram_gb, almacenamiento_gb) | 4 |
| CONSOLA | (**`id → PRODUCTO`**, modelo, almacenamiento_gb) | 4 |
| PEDIDO | (**id**, fecha, estado, metodo_pago, `cliente_id → CLIENTE`) | 1, 2 |
| LINEA_PEDIDO | (**id**, `pedido_id → PEDIDO`, `producto_id → PRODUCTO`, tipo) + UQ(pedido_id, producto_id, tipo) | 1, 2, 4 |
| COMPRA | (**`id → LINEA_PEDIDO`**, cantidad, precio_unitario) | 4 |
| ALQUILER | (**`id → LINEA_PEDIDO`**, precio_dia, fecha_fin, fecha_devolucion (nulo)) | 4 |
| REPARACION | (**id**, dispositivo, problema, estado, fecha_entrada, fecha_salida (nulo), presupuesto (nulo), foto (nulo), `cliente_id → CLIENTE`, `tecnico_id → TRABAJADOR`) | 1, 2 |
| TIENDA | (**id**, nombre, direccion, latitud, longitud, historia) | 1, 5 |
| FOTO_TIENDA | (**id**, imagen, descripcion, `tienda_id → TIENDA`) | 2, 6 |

**Total: 20 tablas** = 20 entidades (contando los 7 subtipos). No queda ninguna relación N:M.

### Cómo se guarda un alquiler
Un alquiler es una **línea del pedido** de tipo `alquiler`: una fila en `linea_pedido` (pedido y videojuego) y otra en `alquiler` con lo suyo:
- es de **una copia** (no tiene `cantidad`);
- empieza en `pedido.fecha` y termina en `fecha_fin` (devolución prevista);
- `fecha_devolucion` nula = todavía no devuelto;
- `precio_dia` es el precio **por día** de ese momento (histórico); el total se calcula con los días.

Una compra es una fila en `linea_pedido` y otra en `compra` (`cantidad`, `precio_unitario`). Ninguna de las dos tiene columnas vacías "porque no le tocan".

## Restricciones

- **Únicos:** `usuario.email`, `cliente.dni`, `token.token_hash`, `departamento.nombre`, `marca.nombre`, `plataforma.nombre`, `servicio(linea, nombre)`, `linea_pedido(pedido_id, producto_id, tipo)`.
- **Valores permitidos (CHECK):** `producto.activo` y `usuario.activo` ∈ {0, 1} · `usuario.tipo` ∈ {cliente, trabajador} · `trabajador.puesto` ∈ {tecnico, admin} · `servicio.linea` ∈ {videojuegos, consolas, telefonia} · `linea_pedido.tipo` ∈ {compra, alquiler} · `producto.tipo` ∈ {videojuego, movil, consola} · `movil.formato` ∈ {movil, tablet} · `videojuego.pegi` ∈ {3, 7, 12, 16, 18} · `pedido.estado` ∈ {pendiente, preparado, entregado, cancelado} · `pedido.metodo_pago` ∈ {tarjeta, bizum, paypal, en_tienda} · `reparacion.estado` ∈ {recibida, en_reparacion, lista, entregada, cancelada}.
- **Numéricas (CHECK):** precios, stock, copias y presupuesto ≥ 0 · `cantidad` ≥ 1 · pantalla, RAM y almacenamiento > 0 · latitud ∈ [-90, 90] y longitud ∈ [-180, 180].
- **Entre columnas (CHECK):** `trabajador.departamento_id` no nulo ⇔ `puesto = tecnico` · `fecha_salida` no nula ⇔ `estado = entregada` · `fecha_salida ≥ fecha_entrada` · `fecha_expira > fecha_creacion`.
- **Entre tablas (triggers):** `producto.tipo`, `usuario.tipo` y `linea_pedido.tipo` coinciden con su subtabla (disjunción) y no cambian · `reparacion.tecnico_id` es un trabajador con `puesto = tecnico` · solo se alquilan videojuegos, sin superar `copias_alquiler` y con `fecha_fin` ≥ fecha del pedido.
- **Borrado:** `RESTRICT` en todo lo que es historial (cliente o producto con pedidos o reparaciones; trabajador con reparaciones; marca, plataforma y departamento en uso). `CASCADE`: pedido → líneas → fila de `compra` o `alquiler`, usuario → tokens, registro de ubicación y fila del subtipo, tienda → fotos, producto → fila del subtipo. `ON UPDATE RESTRICT` en todas (las PK no cambian).
- **Baja lógica (`activo`):** en vez de borrar, se desactiva. `producto.activo = 0` retira del catálogo un videojuego, móvil o consola (los subtipos lo heredan de PRODUCTO, así que no se repite en sus tablas); `usuario.activo = 0` desactiva la cuenta de un cliente o un trabajador (no puede iniciar sesión ni aparece en los listados). Con `activo = 1` vuelven a aparecer. El historial (pedidos, reparaciones) se conserva.
- Las cardinalidades mínimas (1,N) del E-R no se pueden obligar en MariaDB (una FK no impide que un cliente no tenga pedidos): son reglas de negocio.

## Normalización

- **1FN:** atributos atómicos (`ubicacion` se separa en dos columnas; las fotos van en su tabla).
- **2FN:** la única clave compuesta es la candidata `(pedido_id, producto_id, tipo)` de `linea_pedido`, que no tiene más atributos; los de la compra y el alquiler dependen de su `id`.
- **3FN / FNBC:** cada determinante es clave candidata. No hay desnormalizaciones: el departamento de una reparación se obtiene del técnico y la ubicación del usuario solo está en `registro_ubicacion`.

## Nota para Symfony (Doctrine)

- Herencia `JOINED` tres veces: `#[ORM\InheritanceType('JOINED')]` + `#[ORM\DiscriminatorColumn(name: 'tipo')]` en `Producto`, en `Usuario` y en `LineaPedido` (`compra` → `Compra`, `alquiler` → `Alquiler`) (`DiscriminatorMap`: `cliente` → `Cliente`, `trabajador` → `Trabajador`).
- `Usuario` (abstracta) implementa `UserInterface` y `PasswordAuthenticatedUserInterface`: clientes y trabajadores inician sesión con el mismo login. `getRoles()`: `ROLE_CLIENTE` en `Cliente`; `ROLE_TECNICO` o `ROLE_ADMIN` en `Trabajador` según `puesto`.
- `LineaPedido` (abstracta): `#[ORM\UniqueConstraint(columns: ['pedido_id', 'producto_id', 'tipo'])]`.
- Doctrine **no genera CHECK ni triggers**: se añaden a mano en una migración (`addSql`). Nunca crear el esquema con `doctrine:schema:create`/`update`.
- Diseño físico completo (tipos, CHECK, triggers, índices y SQL): bóveda `04-Datos/Diseno fisico MariaDB.md`.
