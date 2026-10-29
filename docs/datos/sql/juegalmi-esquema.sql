-- =====================================================================
-- JuegAlmi · base de datos completa (esquema v6) · MariaDB 11.4
-- 19 tablas + 10 triggers. Probado en MariaDB 11.4.13 (2026-10-29).
-- Fuente: bóveda 04-Datos/Diseno fisico MariaDB.md (ADR-034). Si cambia el modelo, se regenera desde allí.
-- En Adminer: "Orden SQL" (pegar y Ejecutar) o "Importar" este archivo.
-- Se puede ejecutar dos veces sin error (IF NOT EXISTS / OR REPLACE).
-- =====================================================================

-- JuegAlmi · esquema v6 · MariaDB 11.4
CREATE DATABASE IF NOT EXISTS juegalmi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE juegalmi;

-- 1) Catálogos y tablas sin FK ------------------------------------------------
CREATE TABLE IF NOT EXISTS departamento (
  id     INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  CONSTRAINT pk_departamento PRIMARY KEY (id),
  CONSTRAINT uq_departamento_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS marca (
  id     INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL,
  CONSTRAINT pk_marca PRIMARY KEY (id),
  CONSTRAINT uq_marca_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plataforma (
  id     INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  CONSTRAINT pk_plataforma PRIMARY KEY (id),
  CONSTRAINT uq_plataforma_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tienda (
  id        INT NOT NULL AUTO_INCREMENT,
  nombre    VARCHAR(100) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  latitud   DECIMAL(10,7) NOT NULL,
  longitud  DECIMAL(10,7) NOT NULL,
  historia  TEXT NOT NULL,
  CONSTRAINT pk_tienda PRIMARY KEY (id),
  CONSTRAINT chk_tienda_latitud  CHECK (latitud  BETWEEN -90  AND 90),
  CONSTRAINT chk_tienda_longitud CHECK (longitud BETWEEN -180 AND 180)
) ENGINE=InnoDB;

-- 2) Tablas que dependen de los catálogos --------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
  id              INT NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(100) NOT NULL,
  apellidos       VARCHAR(150) NOT NULL,
  email           VARCHAR(180) NOT NULL,
  password        VARCHAR(255) NOT NULL,              -- hash (bcrypt/argon2), nunca en claro
  telefono        VARCHAR(20)  NOT NULL,
  activo          TINYINT(1) NOT NULL DEFAULT 1,      -- 0 = cuenta desactivada (baja lógica)
  tipo            VARCHAR(10)  NOT NULL,              -- discriminador de Doctrine (ADR-032)
  CONSTRAINT pk_usuario PRIMARY KEY (id),
  CONSTRAINT uq_usuario_email UNIQUE (email),
  CONSTRAINT chk_usuario_tipo CHECK (tipo IN ('cliente', 'trabajador')),
  CONSTRAINT chk_usuario_activo CHECK (activo IN (0, 1)),
  CONSTRAINT chk_usuario_email CHECK (email LIKE '%_@_%._%')
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS servicio (
  id                 INT NOT NULL AUTO_INCREMENT,
  nombre             VARCHAR(100) NOT NULL,
  descripcion        TEXT NOT NULL,
  precio_orientativo DECIMAL(10,2) NULL,              -- "desde X €"; NULL = consultar
  linea              VARCHAR(15) NOT NULL,            -- pestaña de PT-25 (ADR-030)
  CONSTRAINT pk_servicio PRIMARY KEY (id),
  CONSTRAINT uq_servicio_linea_nombre UNIQUE (linea, nombre),
  CONSTRAINT chk_servicio_linea CHECK (linea IN ('videojuegos', 'consolas', 'telefonia')),
  CONSTRAINT chk_servicio_precio CHECK (precio_orientativo >= 0)
) ENGINE=InnoDB;

-- Subtipos de usuario (ADR-032): especialización total y disjunta, como producto
CREATE TABLE IF NOT EXISTS cliente (
  id    INT NOT NULL,                                -- el mismo id que en usuario
  dni   CHAR(9) NOT NULL,                            -- DNI o NIE, en mayúsculas (lo normaliza la API)
  foto  VARCHAR(255) NULL,
  CONSTRAINT pk_cliente PRIMARY KEY (id),
  CONSTRAINT fk_cliente_usuario FOREIGN KEY (id)
    REFERENCES usuario (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT uq_cliente_dni UNIQUE (dni),
  CONSTRAINT chk_cliente_dni CHECK (dni REGEXP '^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$')
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trabajador (
  id              INT NOT NULL,                      -- el mismo id que en usuario
  puesto          VARCHAR(10) NOT NULL,
  departamento_id INT NULL,                          -- solo los técnicos
  CONSTRAINT pk_trabajador PRIMARY KEY (id),
  CONSTRAINT fk_trabajador_usuario FOREIGN KEY (id)
    REFERENCES usuario (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_trabajador_departamento FOREIGN KEY (departamento_id)
    REFERENCES departamento (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_trabajador_puesto CHECK (puesto IN ('tecnico', 'admin')),
  CONSTRAINT chk_trabajador_departamento CHECK ((puesto = 'tecnico') = (departamento_id IS NOT NULL))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS producto (
  id          INT NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  precio      DECIMAL(10,2) NOT NULL,
  stock       INT NOT NULL DEFAULT 0,                  -- unidades a la venta (no incluye copias de alquiler)
  imagen      VARCHAR(255) NOT NULL,
  activo      TINYINT(1) NOT NULL DEFAULT 1,           -- 0 = retirado del catálogo (baja lógica)
  tipo        VARCHAR(20) NOT NULL,                    -- discriminador de Doctrine
  marca_id    INT NOT NULL,
  CONSTRAINT pk_producto PRIMARY KEY (id),
  CONSTRAINT fk_producto_marca FOREIGN KEY (marca_id)
    REFERENCES marca (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_producto_precio CHECK (precio >= 0),
  CONSTRAINT chk_producto_stock  CHECK (stock >= 0),
  CONSTRAINT chk_producto_activo CHECK (activo IN (0, 1)),
  CONSTRAINT chk_producto_tipo   CHECK (tipo IN ('videojuego', 'movil', 'consola')),
  INDEX idx_producto_tipo_activo (tipo, activo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS foto_tienda (
  id          INT NOT NULL AUTO_INCREMENT,
  imagen      VARCHAR(255) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  tienda_id   INT NOT NULL,
  CONSTRAINT pk_foto_tienda PRIMARY KEY (id),
  CONSTRAINT fk_foto_tienda_tienda FOREIGN KEY (tienda_id)
    REFERENCES tienda (id) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 3) Tablas que dependen de usuario o producto ---------------------------------
CREATE TABLE IF NOT EXISTS token (
  id             INT NOT NULL AUTO_INCREMENT,
  token_hash     CHAR(64) NOT NULL,                    -- SHA-256 del token; el token en claro solo lo tiene la app
  fecha_creacion DATETIME NOT NULL,
  fecha_expira   DATETIME NOT NULL,
  usuario_id     INT NOT NULL,
  CONSTRAINT pk_token PRIMARY KEY (id),
  CONSTRAINT uq_token_hash UNIQUE (token_hash),
  CONSTRAINT fk_token_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT chk_token_fechas CHECK (fecha_expira > fecha_creacion),
  INDEX idx_token_fecha_expira (fecha_expira)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS registro_ubicacion (
  id         INT NOT NULL AUTO_INCREMENT,
  fecha      DATETIME NOT NULL,
  latitud    DECIMAL(10,7) NOT NULL,
  longitud   DECIMAL(10,7) NOT NULL,
  metodo     VARCHAR(7) NOT NULL,                      -- GET, POST, PUT, PATCH, DELETE
  ruta       VARCHAR(255) NOT NULL,                    -- p. ej. /api/videojuegos?plataforma=2
  usuario_id INT NOT NULL,
  CONSTRAINT pk_registro_ubicacion PRIMARY KEY (id),
  CONSTRAINT fk_registro_ubicacion_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT chk_registro_ubicacion_metodo CHECK (metodo IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  CONSTRAINT chk_registro_ubicacion_latitud  CHECK (latitud  BETWEEN -90  AND 90),
  CONSTRAINT chk_registro_ubicacion_longitud CHECK (longitud BETWEEN -180 AND 180),
  INDEX idx_registro_ubicacion_usuario_fecha (usuario_id, fecha)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS videojuego (
  id              INT NOT NULL,
  genero          VARCHAR(50) NOT NULL,
  pegi            SMALLINT NOT NULL,
  precio_alquiler DECIMAL(10,2) NOT NULL,              -- por día
  copias_alquiler INT NOT NULL DEFAULT 0,              -- copias dedicadas al alquiler
  plataforma_id   INT NOT NULL,
  CONSTRAINT pk_videojuego PRIMARY KEY (id),
  CONSTRAINT fk_videojuego_producto FOREIGN KEY (id)
    REFERENCES producto (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_videojuego_plataforma FOREIGN KEY (plataforma_id)
    REFERENCES plataforma (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_videojuego_pegi CHECK (pegi IN (3, 7, 12, 16, 18)),
  CONSTRAINT chk_videojuego_precio_alquiler CHECK (precio_alquiler >= 0),
  CONSTRAINT chk_videojuego_copias CHECK (copias_alquiler >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS movil (
  id                INT NOT NULL,
  formato           VARCHAR(10) NOT NULL,
  pantalla_pulgadas DECIMAL(3,1) NOT NULL,
  ram_gb            SMALLINT NOT NULL,
  almacenamiento_gb SMALLINT NOT NULL,
  CONSTRAINT pk_movil PRIMARY KEY (id),
  CONSTRAINT fk_movil_producto FOREIGN KEY (id)
    REFERENCES producto (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT chk_movil_formato CHECK (formato IN ('movil', 'tablet')),
  CONSTRAINT chk_movil_pantalla CHECK (pantalla_pulgadas > 0),
  CONSTRAINT chk_movil_ram CHECK (ram_gb > 0),
  CONSTRAINT chk_movil_almacenamiento CHECK (almacenamiento_gb > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS consola (
  id                INT NOT NULL,
  modelo            VARCHAR(80) NOT NULL,
  almacenamiento_gb SMALLINT NOT NULL,
  CONSTRAINT pk_consola PRIMARY KEY (id),
  CONSTRAINT fk_consola_producto FOREIGN KEY (id)
    REFERENCES producto (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT chk_consola_almacenamiento CHECK (almacenamiento_gb > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedido (
  id          INT NOT NULL AUTO_INCREMENT,
  fecha       DATETIME NOT NULL,
  estado      VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  metodo_pago VARCHAR(20) NOT NULL,
  cliente_id  INT NOT NULL,
  CONSTRAINT pk_pedido PRIMARY KEY (id),
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id)
    REFERENCES cliente (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_pedido_estado CHECK (estado IN ('pendiente', 'preparado', 'entregado', 'cancelado')),
  CONSTRAINT chk_pedido_metodo_pago CHECK (metodo_pago IN ('tarjeta', 'bizum', 'paypal', 'en_tienda')),
  INDEX idx_pedido_cliente_fecha (cliente_id, fecha)
) ENGINE=InnoDB;

-- 4) Tablas que dependen de pedido o videojuego ---------------------------------
-- Compra y alquiler cuelgan directamente del pedido (ADR-034). Un pedido puede tener las dos cosas.
CREATE TABLE IF NOT EXISTS compra (
  id              INT NOT NULL AUTO_INCREMENT,
  pedido_id       INT NOT NULL,
  producto_id     INT NOT NULL,
  cantidad        INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,              -- precio del día; lo pone la API
  CONSTRAINT pk_compra PRIMARY KEY (id),
  CONSTRAINT uq_compra_pedido_producto UNIQUE (pedido_id, producto_id),
  CONSTRAINT fk_compra_pedido FOREIGN KEY (pedido_id)
    REFERENCES pedido (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_compra_producto FOREIGN KEY (producto_id)
    REFERENCES producto (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_compra_cantidad CHECK (cantidad >= 1),
  CONSTRAINT chk_compra_precio CHECK (precio_unitario >= 0),
  INDEX idx_compra_producto (producto_id)
) ENGINE=InnoDB;

-- La FK a videojuego (no a producto) garantiza que solo se alquilan videojuegos. Siempre 1 copia.
CREATE TABLE IF NOT EXISTS alquiler (
  id               INT NOT NULL AUTO_INCREMENT,
  pedido_id        INT NOT NULL,
  videojuego_id    INT NOT NULL,
  precio_dia       DECIMAL(10,2) NOT NULL,             -- precio por día de ese momento; lo pone la API
  fecha_fin        DATE NOT NULL,                      -- devolución prevista (empieza en pedido.fecha)
  fecha_devolucion DATE NULL,                          -- NULL = no devuelto
  CONSTRAINT pk_alquiler PRIMARY KEY (id),
  CONSTRAINT uq_alquiler_pedido_videojuego UNIQUE (pedido_id, videojuego_id),
  CONSTRAINT fk_alquiler_pedido FOREIGN KEY (pedido_id)
    REFERENCES pedido (id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_alquiler_videojuego FOREIGN KEY (videojuego_id)
    REFERENCES videojuego (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT chk_alquiler_precio CHECK (precio_dia >= 0),
  INDEX idx_alquiler_videojuego_devolucion (videojuego_id, fecha_devolucion)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reparacion (
  id              INT NOT NULL AUTO_INCREMENT,
  dispositivo     VARCHAR(100) NOT NULL,               -- texto libre: "iPhone 13", "PS4 Pro"
  problema        TEXT NOT NULL,
  estado          VARCHAR(20) NOT NULL DEFAULT 'recibida',
  fecha_entrada   DATETIME NOT NULL,
  fecha_salida    DATETIME NULL,
  presupuesto     DECIMAL(10,2) NULL,
  foto            VARCHAR(255) NULL,
  cliente_id      INT NOT NULL,
  tecnico_id      INT NOT NULL,                       -- lo asigna la API al crearla (departamento elegido)
  CONSTRAINT pk_reparacion PRIMARY KEY (id),
  CONSTRAINT fk_reparacion_cliente FOREIGN KEY (cliente_id)
    REFERENCES cliente (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_reparacion_tecnico FOREIGN KEY (tecnico_id)
    REFERENCES trabajador (id) ON DELETE RESTRICT ON UPDATE RESTRICT,   -- R4: solo puesto = tecnico
  CONSTRAINT chk_reparacion_estado CHECK (estado IN ('recibida', 'en_reparacion', 'lista', 'entregada', 'cancelada')),
  CONSTRAINT chk_reparacion_salida_entregada CHECK ((estado = 'entregada') = (fecha_salida IS NOT NULL)),
  CONSTRAINT chk_reparacion_fechas CHECK (fecha_salida >= fecha_entrada),
  CONSTRAINT chk_reparacion_presupuesto CHECK (presupuesto >= 0),
  INDEX idx_reparacion_tecnico_estado (tecnico_id, estado)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Triggers (reglas que afectan a varias tablas)
-- ---------------------------------------------------------------------
DELIMITER //

-- R2. Especialización disjunta: la fila del subtipo coincide con producto.tipo
CREATE OR REPLACE TRIGGER trg_videojuego_tipo_bi BEFORE INSERT ON videojuego
FOR EACH ROW
BEGIN
  IF (SELECT tipo FROM producto WHERE id = NEW.id) <> 'videojuego' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no es de tipo videojuego';
  END IF;
END//

CREATE OR REPLACE TRIGGER trg_movil_tipo_bi BEFORE INSERT ON movil
FOR EACH ROW
BEGIN
  IF (SELECT tipo FROM producto WHERE id = NEW.id) <> 'movil' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no es de tipo movil';
  END IF;
END//

CREATE OR REPLACE TRIGGER trg_consola_tipo_bi BEFORE INSERT ON consola
FOR EACH ROW
BEGIN
  IF (SELECT tipo FROM producto WHERE id = NEW.id) <> 'consola' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no es de tipo consola';
  END IF;
END//

-- El tipo de un producto no cambia nunca (si no, la fila del subtipo quedaría huérfana)
CREATE OR REPLACE TRIGGER trg_producto_tipo_bu BEFORE UPDATE ON producto
FOR EACH ROW
BEGIN
  IF NEW.tipo <> OLD.tipo THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El tipo de un producto no se puede cambiar';
  END IF;
END//

-- R2 también para usuario (ADR-032): cliente y trabajador coinciden con usuario.tipo, que no cambia
CREATE OR REPLACE TRIGGER trg_cliente_tipo_bi BEFORE INSERT ON cliente
FOR EACH ROW
BEGIN
  IF (SELECT tipo FROM usuario WHERE id = NEW.id) <> 'cliente' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario no es de tipo cliente';
  END IF;
END//

CREATE OR REPLACE TRIGGER trg_trabajador_tipo_bi BEFORE INSERT ON trabajador
FOR EACH ROW
BEGIN
  IF (SELECT tipo FROM usuario WHERE id = NEW.id) <> 'trabajador' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario no es de tipo trabajador';
  END IF;
END//

CREATE OR REPLACE TRIGGER trg_usuario_tipo_bu BEFORE UPDATE ON usuario
FOR EACH ROW
BEGIN
  IF NEW.tipo <> OLD.tipo THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El tipo de un usuario no se puede cambiar';
  END IF;
END//

-- R4. La reparación se asigna a un técnico, nunca a un admin (ADR-032)
CREATE OR REPLACE TRIGGER trg_reparacion_tecnico_bi BEFORE INSERT ON reparacion
FOR EACH ROW
BEGIN
  IF (SELECT puesto FROM trabajador WHERE id = NEW.tecnico_id) <> 'tecnico' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La reparacion se asigna a un tecnico';
  END IF;
END//

CREATE OR REPLACE TRIGGER trg_reparacion_tecnico_bu BEFORE UPDATE ON reparacion
FOR EACH ROW
BEGIN
  IF NEW.tecnico_id <> OLD.tecnico_id
     AND (SELECT puesto FROM trabajador WHERE id = NEW.tecnico_id) <> 'tecnico' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La reparacion se asigna a un tecnico';
  END IF;
END//

-- R3. Alquiler: la fecha de fin no es anterior al pedido y quedan copias. Que sea un videojuego ya lo
-- garantiza la FK. Los alquileres de pedidos cancelados no ocupan copia (ADR-034). FOR UPDATE bloquea
-- la fila del videojuego para que dos alquileres simultáneos no pasen los dos la comprobación.
CREATE OR REPLACE TRIGGER trg_alquiler_bi BEFORE INSERT ON alquiler
FOR EACH ROW
BEGIN
  DECLARE v_copias INT;
  DECLARE v_activos INT;
  IF NEW.fecha_fin < (SELECT DATE(fecha) FROM pedido WHERE id = NEW.pedido_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de fin es anterior al pedido';
  END IF;
  IF NEW.fecha_devolucion IS NULL THEN
    SELECT copias_alquiler INTO v_copias FROM videojuego WHERE id = NEW.videojuego_id FOR UPDATE;
    SELECT COUNT(*) INTO v_activos FROM alquiler a JOIN pedido pe ON pe.id = a.pedido_id
      WHERE a.videojuego_id = NEW.videojuego_id AND a.fecha_devolucion IS NULL AND pe.estado <> 'cancelado';
    IF v_activos + 1 > v_copias THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No quedan copias disponibles de este videojuego';
    END IF;
  END IF;
END//

DELIMITER ;
