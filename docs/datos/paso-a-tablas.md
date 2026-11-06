# Paso a tablas (E-R → modelo relacional) – JuegAlmi (v7, 2026-11-06)

Diagrama: `er-juegalmi.drawio` (página 1 = E-R, página 2 = modelo relacional). Imágenes: `er-juegalmi.png`, `er-juegalmi.svg` y `relacional-juegalmi.png`. Motor: **MariaDB**.
Notación: **negrita** = clave primaria (PK) · `campo → TABLA` = clave foránea (FK) · `(nulo)` = puede ser NULL · UQ = único.

**Ningún dato se guarda dos veces** (ADR-023 de la bóveda). v4: USUARIO se especializa en CLIENTE y TRABAJADOR (ADR-032) y SERVICIO pasa a tener `linea` (ADR-030). v6: el pedido tiene dos relaciones N:M, *compra* (con PRODUCTO) y *alquila* (con VIDEOJUEGO), que sustituyen a la línea de pedido con subtipos de la v5 (ADR-034). v7: PROVEEDOR y la relación N:M *suministra* con PRODUCTO, con el precio de coste (ADR-042). SQL probado en MariaDB 11.4.

## Reglas aplicadas

1. **Cada entidad → una tabla.** Sus atributos son las columnas y su identificador la PK.
2. **Relación 1:N → la PK del lado 1 pasa como FK al lado N.** Si el lado 1 es (1,1), la FK es **NOT NULL**; si es (0,1), admite nulo (`trabajador.departamento_id`, porque el admin no tiene departamento).
3. **Relación N:M → tabla nueva** con las dos FK y los atributos de la relación. Su clave natural es la pareja de FK; en Doctrine se implementa como `id` propio + `UNIQUE` de la pareja, que es equivalente (sigue siendo clave candidata). Se aplica tres veces: *compra* → `compra`, *alquila* → `alquiler` y *suministra* → `producto_proveedor`.
4. **Especialización (ES UN) total y disjunta → una tabla para el supertipo y una por subtipo.** El subtipo usa como PK la PK del supertipo, que a la vez es FK hacia él (`ON DELETE CASCADE`). El supertipo lleva `tipo` (discriminador de Doctrine). Se aplica dos veces: PRODUCTO y USUARIO.
5. **Atributo compuesto → una columna por componente** (`ubicacion` → `latitud`, `longitud`).
6. **Atributo multivaluado con atributos propios → tabla aparte** (fotos de la tienda → `foto_tienda`).
7. **Atributo derivado → no se guarda** (total del pedido, estado del alquiler, copias disponibles): se calcula en la consulta.
8. **Sin redundancia:** el departamento de una reparación no se guarda: se obtiene con `JOIN trabajador`.

### Los caminos cerrados que pasan por un ES UN
USUARIO → CLIENTE → REPARACION → TRABAJADOR → USUARIO y PEDIDO → *compra* → PRODUCTO → VIDEOJUEGO → *alquila* → PEDIDO no son ciclos de datos repetidos: las flechas ES UN no son relaciones, sino "es un tipo de", y ningún dato se puede obtener por dos caminos diferentes. (El cliente y el técnico de una reparación son siempre personas distintas porque la especialización es **disjunta**; comprar y alquilar el mismo juego son dos hechos distintos.)

## Relaciones → claves foráneas

| Relación (E-R) | Cardinalidades | Tipo | Resultado en tablas | Regla |
|---|---|---|---|---|
| *inicia* | USUARIO (1,1) — (1,N) TOKEN | 1:N | `token.usuario_id → USUARIO` (CASCADE) | 2 |
| *registra* | USUARIO (1,1) — (1,N) REGISTRO_UBICACION | 1:N | `registro_ubicacion.usuario_id → USUARIO` (CASCADE) | 2 |
| *realiza* | CLIENTE (1,1) — (1,N) PEDIDO | 1:N | `pedido.cliente_id → CLIENTE` | 2 |
| *solicita* | CLIENTE (1,1) — (1,N) REPARACION | 1:N | `reparacion.cliente_id → CLIENTE` | 2 |
| *asignada* | TRABAJADOR (1,1) — (1,N) REPARACION | 1:N | `reparacion.tecnico_id → TRABAJADOR` (solo `puesto = tecnico`) | 2 |
| *pertenece* | DEPARTAMENTO (0,1) — (1,N) TRABAJADOR | 1:N | `trabajador.departamento_id → DEPARTAMENTO` (nulo en el admin) | 2 |
| *compra* | PEDIDO (1,N) — (0,N) PRODUCTO | **N:M** | Tabla nueva `compra` (`cantidad`, `precio_unitario`) | 3 |
| *alquila* | PEDIDO (1,N) — (0,N) VIDEOJUEGO | **N:M** | Tabla nueva `alquiler` (`precio_dia`, `fecha_fin`, `fecha_devolucion`) | 3 |
| *suministra* | PROVEEDOR (0,N) — (0,N) PRODUCTO | **N:M** | Tabla nueva `producto_proveedor` (`precio_coste`) | 3 |
| *fabrica* | MARCA (1,1) — (1,N) PRODUCTO | 1:N | `producto.marca_id → MARCA` | 2 |
| *es de* | PLATAFORMA (1,1) — (1,N) VIDEOJUEGO | 1:N | `videojuego.plataforma_id → PLATAFORMA` | 2 |
| *muestra* | TIENDA (1,1) — (1,N) FOTO_TIENDA | 1:N | `foto_tienda.tienda_id → TIENDA` (CASCADE) | 2, 6 |
| **ES UN** | USUARIO → CLIENTE / TRABAJADOR | total y disjunta | `cliente.id`, `trabajador.id` → USUARIO (CASCADE) + `usuario.tipo` | 4 |
| **ES UN** | PRODUCTO → VIDEOJUEGO / MOVIL / CONSOLA | total y disjunta | `videojuego.id`, `movil.id`, `consola.id` → PRODUCTO (CASCADE) + `producto.tipo` | 4 |

SERVICIO no participa en ninguna relación (ADR-030): su `linea` es la pestaña de la tienda.
En *compra* y *alquila* el mínimo del lado del producto es 0 porque un pedido puede tener solo compras o solo alquileres; que tenga **al menos una de las dos** lo comprueba la API.
En *suministra* los dos mínimos son 0: un producto recién dado de alta puede no tener proveedor todavía, y un proveedor nuevo puede no servir nada aún. PROVEEDOR no es MARCA: la marca **fabrica** el producto y el proveedor se lo **vende** a la tienda (un mismo juego puede comprarse a dos distribuidores con precios distintos).

## Tablas (21)

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
| PEDIDO | (**id**, fecha, estado, metodo_pago, entrega, direccion_entrega (nulo), latitud_entrega (nulo), longitud_entrega (nulo), `cliente_id → CLIENTE`) | 1, 2 |
| COMPRA | (**id**, `pedido_id → PEDIDO`, `producto_id → PRODUCTO`, cantidad, precio_unitario) + UQ(pedido_id, producto_id) | 3 |
| ALQUILER | (**id**, `pedido_id → PEDIDO`, `videojuego_id → VIDEOJUEGO`, precio_dia, fecha_fin, fecha_devolucion (nulo)) + UQ(pedido_id, videojuego_id) | 3 |
| REPARACION | (**id**, dispositivo, problema, estado, fecha_entrada, fecha_salida (nulo), presupuesto (nulo), foto (nulo), `cliente_id → CLIENTE`, `tecnico_id → TRABAJADOR`) | 1, 2 |
| TIENDA | (**id**, nombre, direccion, latitud, longitud, historia) | 1, 5 |
| FOTO_TIENDA | (**id**, imagen, descripcion, `tienda_id → TIENDA`) | 2, 6 |
| PROVEEDOR | (**id**, nombre, cif UQ, telefono, email, direccion (nulo)) | 1 |
| PRODUCTO_PROVEEDOR | (**id**, `producto_id → PRODUCTO`, `proveedor_id → PROVEEDOR`, precio_coste) + UQ(producto_id, proveedor_id) | 3 |

**Total: 21 tablas** = 18 entidades (contando los 5 subtipos) + 3 tablas de relaciones N:M.

### Cómo se guarda un pedido
Un pedido puede **comprar y alquilar a la vez**:
- cada producto comprado es una fila de `compra`: `cantidad` y `precio_unitario` del día (histórico);
- cada juego alquilado es una fila de `alquiler`: **una copia**, `precio_dia` del día, empieza en `pedido.fecha` y termina en `fecha_fin`; `fecha_devolucion` nula = todavía no devuelto. Que solo se alquilen videojuegos lo garantiza la FK a VIDEOJUEGO;
- el total no se guarda: Σ cantidad × precio_unitario + Σ precio_dia × días;
- **los alquileres de un pedido cancelado no ocupan copia** (no cuentan para las copias disponibles).

## Restricciones

- **Únicos:** `usuario.email`, `cliente.dni`, `token.token_hash`, `departamento.nombre`, `marca.nombre`, `plataforma.nombre`, `servicio(linea, nombre)`, `compra(pedido_id, producto_id)`, `alquiler(pedido_id, videojuego_id)`, `proveedor.cif`, `producto_proveedor(producto_id, proveedor_id)`.
- **Valores permitidos (CHECK):** `producto.activo` y `usuario.activo` ∈ {0, 1} · `usuario.tipo` ∈ {cliente, trabajador} · `trabajador.puesto` ∈ {tecnico, admin} · `servicio.linea` ∈ {videojuegos, consolas, telefonia} · `producto.tipo` ∈ {videojuego, movil, consola} · `movil.formato` ∈ {movil, tablet} · `videojuego.pegi` ∈ {3, 7, 12, 16, 18} · `pedido.estado` ∈ {pendiente, preparado, entregado, cancelado} · `pedido.metodo_pago` ∈ {tarjeta, bizum, paypal, en_tienda} · `reparacion.estado` ∈ {recibida, en_reparacion, lista, entregada, cancelada}.
- **Formato (CHECK):** `proveedor.cif` = letra + 7 cifras + cifra o letra de control.
- **Numéricas (CHECK):** precios (también `precio_coste`), stock, copias y presupuesto ≥ 0 · `cantidad` ≥ 1 · pantalla, RAM y almacenamiento > 0 · latitud ∈ [-90, 90] y longitud ∈ [-180, 180].
- **Entre columnas (CHECK):** `trabajador.departamento_id` no nulo ⇔ `puesto = tecnico` · `fecha_salida` no nula ⇔ `estado = entregada` · `fecha_salida ≥ fecha_entrada` · `fecha_expira > fecha_creacion`.
- **Entre tablas (triggers, 10):** `producto.tipo` y `usuario.tipo` coinciden con su subtabla (disjunción) y no cambian · `reparacion.tecnico_id` es un trabajador con `puesto = tecnico` · un alquiler no supera `copias_alquiler` (sin contar los pedidos cancelados) y su `fecha_fin` ≥ fecha del pedido.
- **Borrado:** `RESTRICT` en todo lo que es historial (cliente o producto con pedidos o reparaciones; trabajador con reparaciones; marca, plataforma, departamento y proveedor en uso). `CASCADE`: pedido → compras y alquileres, usuario → tokens, registro de ubicación y fila del subtipo, tienda → fotos, producto → fila del subtipo y sus filas de `producto_proveedor`. `ON UPDATE RESTRICT` en todas (las PK no cambian).
- **Baja lógica (`activo`):** en vez de borrar, se desactiva. `producto.activo = 0` retira del catálogo un videojuego, móvil o consola (los subtipos lo heredan de PRODUCTO, así que no se repite en sus tablas); `usuario.activo = 0` desactiva la cuenta de un cliente o un trabajador (no puede iniciar sesión ni aparece en los listados). Con `activo = 1` vuelven a aparecer. El historial (pedidos, reparaciones) se conserva.
- Las cardinalidades mínimas (1,N) del E-R no se pueden obligar en MariaDB (una FK no impide que un cliente no tenga pedidos): son reglas de negocio.

## Normalización

- **1FN:** atributos atómicos (`ubicacion` se separa en dos columnas; las fotos van en su tabla; los productos de un pedido van en `compra` y `alquiler`, no en columnas repetidas).
- **2FN:** las únicas claves compuestas son las candidatas `(pedido_id, producto_id)` de `compra` y `(pedido_id, videojuego_id)` de `alquiler` y `(producto_id, proveedor_id)` de `producto_proveedor`, y sus atributos dependen de la clave completa (el precio es el de ese pedido, no solo del producto; el coste es el de ese proveedor para ese producto).
- **3FN / FNBC:** cada determinante es clave candidata. No hay desnormalizaciones: el departamento de una reparación se obtiene del técnico y la ubicación del usuario solo está en `registro_ubicacion`.

## Nota para Symfony (Doctrine)

- Herencia `JOINED` dos veces: `#[ORM\InheritanceType('JOINED')]` + `#[ORM\DiscriminatorColumn(name: 'tipo')]` en `Producto` y en `Usuario` (`DiscriminatorMap`: `cliente` → `Cliente`, `trabajador` → `Trabajador`).
- `Usuario` (abstracta) implementa `UserInterface` y `PasswordAuthenticatedUserInterface`: clientes y trabajadores inician sesión con el mismo login. `getRoles()`: `ROLE_CLIENTE` en `Cliente`; `ROLE_TECNICO` o `ROLE_ADMIN` en `Trabajador` según `puesto`.
- `Compra` (`ManyToOne Pedido`, `ManyToOne Producto`) y `Alquiler` (`ManyToOne Pedido`, `ManyToOne Videojuego`), con `id` propio + `#[ORM\UniqueConstraint]` de la pareja. `Pedido` tiene `OneToMany` a las dos con `cascade: ['persist']`. `ProductoProveedor` (`ManyToOne Producto` con `onDelete: CASCADE`, `ManyToOne Proveedor`) sigue el mismo patrón.
- Doctrine **no genera CHECK ni triggers**: se añaden a mano en una migración (`addSql`). Nunca crear el esquema con `doctrine:schema:create`/`update`.
- Diseño físico completo (tipos, CHECK, triggers, índices, SQL y pruebas): bóveda `04-Datos/Diseno fisico MariaDB.md`.
