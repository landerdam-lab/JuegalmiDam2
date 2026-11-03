# API de JuegAlmi (Symfony 7.4 + MariaDB 11.4 + Doctrine)

API REST que usan las dos apps (solo clientes) y la web (parte pública + backoffice).
El contrato completo de endpoints está en la bóveda: `05-API/Endpoints.md`.

## Puesta en marcha

Requisitos: PHP 8.3 o superior (con `pdo_mysql`, `intl`, `mbstring`), Composer, Symfony CLI y MariaDB 11.4.

```bash
composer install
# 1) Crea api/.env.local (NO se sube a Git) con tu conexión:
#    DATABASE_URL="mysql://USUARIO:CONTRASEÑA@127.0.0.1:3306/almi_companion?serverVersion=11.4.0-MariaDB&charset=utf8mb4"
#    APP_SECRET=<cadena aleatoria>
php bin/console doctrine:database:create --if-not-exists   # BBDD almi_companion
php bin/console doctrine:migrations:migrate      # esquema v6: 19 tablas + 35 CHECK + 10 triggers
php bin/console doctrine:fixtures:load           # datos de ejemplo (borra lo que haya)
symfony server:start -d --allow-all-ip --port=8001   # https://127.0.0.1:8001/api
```

> ⚠️ **Nunca** `doctrine:schema:create` ni `doctrine:schema:update`: se saltarían los CHECK y los
> triggers (aviso A-09). El esquema sale **solo** de las migraciones de `src/Migrations/`.

Para HTTPS en local, una vez: `symfony server:ca:install`. Sin ella, la Symfony CLI sirve por HTTP.

### Pruebas automáticas

Usan otra BBDD, `almi_companion_test`, configurada en `api/.env.test.local` (mismo formato de `DATABASE_URL`;
Doctrine añade `_test` al nombre). Las migraciones y los datos de ejemplo se cargan solos.

```bash
php bin/phpunit          # 37 pruebas: login, catálogo, pedidos (con envío a domicilio), alquileres, reparaciones y permisos
```

### Otros comandos

```bash
php bin/console app:limpiar-tokens     # borra las sesiones caducadas (también se limpian en cada login)
php bin/console debug:router           # lista de rutas
```

## Usuarios de ejemplo

Todos con la contraseña de demo `demo1234` (inventada, solo para la demo).

| Email | Rol | Notas |
|---|---|---|
| `admin@juegalmi.test` | admin | Backoffice de la web |
| `tecnico.telefonia1@juegalmi.test`, `tecnico.telefonia2@…` | técnico | Departamento Telefonía |
| `tecnico.consolas1@juegalmi.test`, `tecnico.consolas2@…` | técnico | Departamento Consolas |
| `cliente1@juegalmi.test` … `cliente3@…` | cliente | Usan las apps (cliente3 tiene NIE) |
| `cliente4@juegalmi.test` | cliente | **Desactivado**: no puede entrar |

Los datos de ejemplo están pensados para la demo: un juego con las 2 copias alquiladas (Gran Turismo 7),
un alquiler retrasado, un pedido cancelado que no ocupa copia, un producto agotado, una consola retirada,
reparaciones en los 5 estados y una marca sin productos (Nokia) que se puede borrar.

## Cómo se usa

- Todas las rutas empiezan por `/api`. JSON en camelCase, fechas ISO 8601 en UTC.
- `POST /api/login {email, password}` → `{token, expira, usuario}`. El token dura **2 horas**
  (`TOKEN_TTL_HORAS` en `.env`). Después, en cada petición: `Authorization: Bearer <token>`.
- Las apps mandan además `X-Latitud` y `X-Longitud` en **todas** las peticiones: se guardan en
  `registro_ubicacion`. Sin ellas, `POST /api/pedidos` y `POST /api/reparaciones` responden 422.
- **Entrega del pedido (ADR-038):** `POST /api/pedidos` acepta `entrega` = `tienda` (por defecto) o `domicilio`.
  A domicilio son obligatorios `direccionEntrega` (texto) y `latitudEntrega`/`longitudEntrega` (el punto que el
  cliente marca en el mapa); si faltan, 422 con `direccionEntrega` o `ubicacionEntrega`. El envío es gratis.
  El pedido devuelve `entrega`, `direccionEntrega`, `latitudEntrega` y `longitudEntrega` (null si es en tienda).
- Sin token solo funcionan `login`, `registro` y los `GET` de catálogo y tienda (web pública, ADR-028).
  Sin token no se envía el stock exacto, solo `disponible` (y `alquilable` en los videojuegos).
- Listados largos paginados: `?page=1&limit=20` → `{items, page, limit, total}`.
  Los catálogos cortos (marcas, plataformas, departamentos, servicios, tiendas) devuelven una lista.
- Imágenes: primero `POST /api/imagenes` (multipart: `imagen` + `carpeta`) → `{ruta, url}`; después se
  manda esa `url` (o la `ruta`) en el JSON del recurso. En la BBDD se guarda la ruta (ADR-019).

### Errores (siempre el mismo formato)

```json
{"error": {"codigo": "VALIDACION", "mensaje": "Hay campos incorrectos", "campos": {"dni": "La letra del DNI o NIE no es correcta."}}}
```

| HTTP | `codigo` |
|---|---|
| 400 | `PETICION_INVALIDA` |
| 401 | `NO_AUTENTICADO`, `TOKEN_CADUCADO`, `CREDENCIALES_INCORRECTAS`, `CUENTA_DESACTIVADA` → la app vuelve al login |
| 403 | `PROHIBIDO` |
| 404 | `NO_ENCONTRADO` |
| 409 | `STOCK_INSUFICIENTE`, `SIN_COPIAS`, `EMAIL_REPETIDO`, `DNI_REPETIDO`, `EN_USO`, `SIN_TECNICOS`, `DUPLICADO` |
| 422 | `VALIDACION` (con `campos`: un mensaje por campo del formulario) |
| 500 | `ERROR_INTERNO` |

## Organización del código

```
src/
├── Controller/Api/   Controladores finos: leen la petición, comprueban permisos y llaman a un Service
├── Service/          Lógica de negocio: PedidoService (stock, copias, estados), ReparacionService,
│                     UsuarioService, SesionService (login), Presentador (entidad → JSON), Imagenes…
├── Entity/           19 entidades = 19 tablas (herencia JOINED en Producto y Usuario)
├── Enum/             Enumerados con los mismos valores que los CHECK de la BBDD
├── Repository/       Consultas (listados con filtros, copias ocupadas, técnico con menos carga…)
├── Security/         TokenHandler (valida el Bearer) y respuestas 401/403 en JSON
├── EventListener/    RegistroUbicacionListener (ubicación de cada petición) y ApiExceptionListener (errores)
├── Http/             Utilidades: Datos (lee el JSON), Paginacion, Ubicacion, ApiException
├── Migrations/       Esquema (generado) + CHECK y triggers (escrita a mano)
└── DataFixtures/     Datos de ejemplo
```

Reglas de negocio importantes (detalle en la bóveda, `04-Datos/Reglas de negocio.md`):
- El pedido se crea en **una transacción** con bloqueo de filas: si falta stock o copias, no se guarda nada.
- El precio de cada línea lo pone la API (precio del día). El total del pedido se calcula, no se guarda.
- Alquiler: solo videojuegos, de 1 a 14 días, 1 copia. Cancelar un pedido devuelve el stock y libera las copias.
- La reparación se asigna al técnico del departamento con menos reparaciones abiertas.
- La BBDD repite las reglas clave con CHECK y triggers; si salta una, la API la traduce a su error en español.
