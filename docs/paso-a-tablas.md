# Paso a tablas (E-R → modelo relacional) – JuegAlmi (v2, 2026-10-28)

Diagrama: `er-juegalmi.drawio` (página 1 = E-R, página 2 = modelo relacional). Motor: **MariaDB**.
Notación: **negrita** = clave primaria (PK) · `campo → TABLA` = clave foránea (FK) · `(nulo)` = puede ser NULL · UQ = único.

## Reglas aplicadas

1. **Cada entidad → una tabla.** Sus atributos son las columnas y su identificador la PK.
2. **Relación 1:N → la PK del lado 1 pasa como FK al lado N.** Si la participación del lado N es opcional (mínimo 0), la FK admite nulo.
3. **Relación N:M → tabla nueva** con las dos FK y los atributos de la relación. Su clave natural es la pareja de FK; en Doctrine se implementa como `id` propio + `UNIQUE(pareja)`, que es equivalente (la pareja sigue siendo clave candidata).
4. **Especialización (ES UN) total y disjunta → una tabla para el supertipo y una por subtipo.** El subtipo usa como PK la PK del supertipo, que a la vez es FK hacia él (`ON DELETE CASCADE`). El supertipo lleva `tipo` (discriminador de Doctrine).
5. **Dos relaciones entre las mismas entidades → dos FK con nombres distintos** (`cliente_id`, `tecnico_id`).
6. **Atributo compuesto → una columna por componente** (`ubicacion` → `latitud`, `longitud`).
7. **Atributo multivaluado con atributos propios → tabla aparte** (fotos de la tienda → `foto_tienda`).
8. **Atributo derivado → no se guarda** (total del pedido, estado del alquiler, copias disponibles): se calcula en la consulta.

## Tablas (17)

| Tabla | Columnas | Regla |
|---|---|---|
| DEPARTAMENTO | (**id**, nombre UQ) | 1 |
| SERVICIO | (**id**, nombre, descripcion, precio_orientativo (nulo), `departamento_id → DEPARTAMENTO`) | 1, 2 – *ofrece* 1:N |
| USUARIO | (**id**, nombre, email UQ, password, telefono, dni UQ, rol, foto (nulo), `departamento_id → DEPARTAMENTO` (nulo)) | 1, 2 – *trabaja en* N:1, opcional (solo técnicos) |
| TOKEN | (**id**, token_hash UQ, fecha_creacion, fecha_expira, `usuario_id → USUARIO`) | 2 – *inicia* 1:N |
| REGISTRO_UBICACION | (**id**, fecha, latitud, longitud, metodo, ruta, `usuario_id → USUARIO`) | 2 – *registra* 1:N; 6 |
| MARCA | (**id**, nombre UQ) | 1 |
| PLATAFORMA | (**id**, nombre UQ) | 1 |
| PRODUCTO | (**id**, nombre, descripcion, precio, stock, imagen, activo, tipo, `marca_id → MARCA`) | 2 – *fabrica* 1:N; 4 – `tipo` |
| VIDEOJUEGO | (**`id → PRODUCTO`**, genero, pegi, precio_alquiler, copias_alquiler, `plataforma_id → PLATAFORMA`) | 4; 2 – *es de* 1:N |
| MOVIL | (**`id → PRODUCTO`**, formato, pantalla_pulgadas, ram_gb, almacenamiento_gb) | 4 |
| CONSOLA | (**`id → PRODUCTO`**, modelo, almacenamiento_gb) | 4 |
| PEDIDO | (**id**, fecha, estado, metodo_pago, latitud, longitud, `usuario_id → USUARIO`) | 2 – *realiza* 1:N; 6 |
| LINEA_PEDIDO | (**id**, `pedido_id → PEDIDO`, `producto_id → PRODUCTO`, cantidad, precio_unitario) + UQ(pedido_id, producto_id) | 3 – *contiene* N:M |
| ALQUILER | (**id**, fecha_inicio, fecha_fin, fecha_devolucion (nulo), precio, latitud, longitud, `usuario_id → USUARIO`, `videojuego_id → VIDEOJUEGO`) | 2 – *alquila* y *es alquilado*; 6 |
| REPARACION | (**id**, dispositivo, problema, estado, fecha_entrada, fecha_salida (nulo), presupuesto (nulo), foto (nulo), latitud, longitud, `cliente_id → USUARIO`, `tecnico_id → USUARIO` (nulo), `departamento_id → DEPARTAMENTO`) | 2 y 5 – *solicita*, *repara*, *atiende*; 6 |
| TIENDA | (**id**, nombre, direccion, latitud, longitud, historia) | 1; 6 |
| FOTO_TIENDA | (**id**, imagen, descripcion, `tienda_id → TIENDA`) | 2 – *muestra* 1:N; 7 |

**Total: 17 tablas** (16 entidades contando los 3 subtipos + 1 tabla de la relación N:M).

## Restricciones

- **Únicos:** `usuario.email`, `usuario.dni`, `token.token_hash`, `departamento.nombre`, `marca.nombre`, `plataforma.nombre`, `linea_pedido(pedido_id, producto_id)`.
- **Valores permitidos (CHECK):** `usuario.rol` ∈ {cliente, tecnico, admin} · `producto.tipo` ∈ {videojuego, movil, consola} · `movil.formato` ∈ {movil, tablet} · `videojuego.pegi` ∈ {3, 7, 12, 16, 18} · `pedido.estado` ∈ {pendiente, preparado, entregado, cancelado} · `pedido.metodo_pago` ∈ {tarjeta, bizum, paypal, en_tienda} · `reparacion.estado` ∈ {recibida, en_reparacion, lista, entregada, cancelada}.
- **Numéricas (CHECK):** precios, stock, copias y presupuesto ≥ 0 · `cantidad` ≥ 1 · pantalla, RAM y almacenamiento > 0 · latitud ∈ [-90, 90] y longitud ∈ [-180, 180].
- **Entre columnas (CHECK):** `rol = tecnico` ⇔ `departamento_id` no nulo · `fecha_fin ≥ fecha_inicio` · `fecha_devolucion` nula o ≥ `fecha_inicio` · `fecha_salida` no nula ⇔ `estado = entregada` · `fecha_salida ≥ fecha_entrada` · si la reparación no está `recibida` ni `cancelada`, tiene técnico · `fecha_expira > fecha_creacion`.
- **Entre tablas (triggers):** el técnico de una reparación tiene `rol = tecnico` y el mismo departamento · `producto.tipo` coincide con la subtabla (disjunción) · los alquileres activos de un juego no superan `copias_alquiler`.
- **Borrado:** `RESTRICT` en todo lo que es historial (usuario o producto con pedidos, alquileres o reparaciones; marca, plataforma y departamento en uso). `CASCADE`: pedido → líneas, usuario → tokens y registro de ubicación, tienda → fotos, producto → fila del subtipo. `ON UPDATE RESTRICT` en todas (las PK no cambian).
- **Baja lógica:** `producto.activo = 0` retira un producto del catálogo sin borrar su historial.

## Única desnormalización (justificada)

En `reparacion`, cuando hay técnico se cumple `tecnico_id → departamento_id`. Se guarda igualmente `departamento_id` porque hace falta mientras no hay técnico y porque es histórico. La coherencia la garantiza un trigger.

## Nota para Symfony (Doctrine)

- Herencia: `#[ORM\InheritanceType('JOINED')]` + `#[ORM\DiscriminatorColumn(name: 'tipo')]` en `Producto`.
- `LineaPedido`: `id` propio + `#[ORM\UniqueConstraint(columns: ['pedido_id', 'producto_id'])]`.
- Doctrine **no genera CHECK ni triggers**: se añaden a mano en una migración (`addSql`). Nunca crear el esquema con `doctrine:schema:create`/`update`.
- Diseño físico completo (tipos, CHECK, triggers, índices y SQL): bóveda `04-Datos/Diseno fisico MariaDB.md`.
