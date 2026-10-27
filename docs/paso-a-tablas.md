# Paso a tablas (E-R → modelo relacional) – JuegAlmi

Notación: **negrita** = clave primaria (PK) · `campo → TABLA` = clave foránea (FK) · `(nulo)` = puede ser NULL.

## Reglas aplicadas

1. **Cada entidad → una tabla.** Sus atributos son las columnas y su identificador la PK.
2. **Relación 1:N → la PK del lado 1 pasa como FK al lado N.** Si la participación es opcional, la FK admite nulo.
3. **Relación N:M → tabla nueva.** Su PK es la suma de las dos PK (cada una FK) y lleva los atributos de la relación.
4. **Especialización (ES UN) → una tabla para el supertipo y una por subtipo.** El subtipo usa como PK la misma PK del supertipo, que a la vez es FK hacia él. En el supertipo se añade `tipo` para saber de qué subtipo es (Doctrine lo llama *discriminador*).
5. **Dos relaciones entre las mismas entidades → dos FK con nombres distintos** (`cliente_id`, `tecnico_id`).

## Tablas

| Tabla | Columnas | Regla |
|---|---|---|
| DEPARTAMENTO | (**id**, nombre) | 1 |
| USUARIO | (**id**, nombre, email, password, telefono, dni, rol, foto (nulo), `departamento_id → DEPARTAMENTO` (nulo)) | 1, 2 – *trabaja en* N:1, opcional (solo técnicos) |
| TOKEN | (**id**, token, fecha_expira, `usuario_id → USUARIO`) | 2 – *tiene* 1:N |
| MARCA | (**id**, nombre) | 1 |
| PRODUCTO | (**id**, nombre, descripcion, precio, stock, imagen, tipo, `marca_id → MARCA`) | 2 – *fabrica* 1:N; 4 – `tipo` |
| VIDEOJUEGO | (**`id → PRODUCTO`**, plataforma, genero, pegi, precio_alquiler, copias_alquiler) | 4 |
| MOVIL | (**`id → PRODUCTO`**, tipo, pantalla, ram, almacenamiento) | 4 |
| CONSOLA | (**`id → PRODUCTO`**, modelo, almacenamiento) | 4 |
| PEDIDO | (**id**, fecha, estado, metodo_pago, latitud, longitud, `usuario_id → USUARIO`) | 2 – *realiza* 1:N |
| LINEA_PEDIDO | (**`pedido_id → PEDIDO`**, **`producto_id → PRODUCTO`**, cantidad, precio_unitario) | 3 – *contiene* N:M |
| ALQUILER | (**id**, fecha_inicio, fecha_fin, fecha_devolucion (nulo), precio, latitud, longitud, `usuario_id → USUARIO`, `videojuego_id → VIDEOJUEGO`) | 2 – *alquila* y *es alquilado* |
| REPARACION | (**id**, dispositivo, problema, estado, fecha_entrada, fecha_salida (nulo), presupuesto (nulo), foto (nulo), latitud, longitud, `cliente_id → USUARIO`, `tecnico_id → USUARIO` (nulo), `departamento_id → DEPARTAMENTO`) | 2 y 5 – *solicita*, *repara*, *atiende* |
| TIENDA | (**id**, nombre, direccion, latitud, longitud, historia) | 1 |
| FOTO_TIENDA | (**id**, imagen, descripcion, `tienda_id → TIENDA`) | 2 – *tiene* 1:N |

**Total: 14 tablas** (13 entidades + 1 tabla de la relación N:M).

## Restricciones

- **Únicos:** `usuario.email`, `token.token`, `departamento.nombre`, `marca.nombre`.
- **Valores permitidos:** `usuario.rol` ∈ {cliente, tecnico, admin}; `producto.tipo` ∈ {videojuego, movil, consola}; `movil.tipo` ∈ {movil, tablet}.
- **Positivos:** precios, stock, cantidad y copias ≥ 0.
- **Borrado:** no se puede borrar un usuario o producto que tenga pedidos, alquileres o reparaciones (`ON DELETE RESTRICT`); al borrar un pedido se borran sus líneas (`ON DELETE CASCADE`).

## Nota para Symfony (Doctrine)

- La herencia de la regla 4 es `#[ORM\InheritanceType('JOINED')]` + `#[ORM\DiscriminatorColumn(name: 'tipo')]` en `Producto`.
- Doctrine trabaja mejor con un `id` propio: en `LineaPedido` se pone **id** + `UNIQUE(pedido_id, producto_id)`, que es equivalente a la PK compuesta.
