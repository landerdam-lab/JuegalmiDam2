<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Reglas de negocio en la BBDD (ADR-020, aviso A-09): los CHECK y los 10 triggers del esquema v6.
 *
 * Doctrine crea tablas, PK, FK, UNIQUE e índices (migración anterior), pero NO los CHECK ni los
 * triggers. Se copian a mano de 04-Datos/Diseno fisico MariaDB (bóveda). Como Doctrine no los ve al
 * comparar el esquema, tampoco los borrará en migraciones futuras.
 * En una migración cada CREATE TRIGGER va en su addSql(), sin DELIMITER.
 * Los mensajes de SIGNAL van sin tildes a propósito; la API los traduce (ApiExceptionListener).
 */
final class Version20261029120000 extends AbstractMigration
{
    /** [tabla, nombre, condición] */
    private const CHECKS = [
        ['tienda', 'chk_tienda_latitud', 'latitud BETWEEN -90 AND 90'],
        ['tienda', 'chk_tienda_longitud', 'longitud BETWEEN -180 AND 180'],
        ['usuario', 'chk_usuario_tipo', "tipo IN ('cliente', 'trabajador')"],
        ['usuario', 'chk_usuario_activo', 'activo IN (0, 1)'],
        ['usuario', 'chk_usuario_email', "email LIKE '%_@_%._%'"],
        ['servicio', 'chk_servicio_linea', "linea IN ('videojuegos', 'consolas', 'telefonia')"],
        ['servicio', 'chk_servicio_precio', 'precio_orientativo >= 0'],
        ['cliente', 'chk_cliente_dni', "dni REGEXP '^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$'"],
        ['trabajador', 'chk_trabajador_puesto', "puesto IN ('tecnico', 'admin')"],
        ['trabajador', 'chk_trabajador_departamento', "(puesto = 'tecnico') = (departamento_id IS NOT NULL)"],
        ['producto', 'chk_producto_precio', 'precio >= 0'],
        ['producto', 'chk_producto_stock', 'stock >= 0'],
        ['producto', 'chk_producto_activo', 'activo IN (0, 1)'],
        ['producto', 'chk_producto_tipo', "tipo IN ('videojuego', 'movil', 'consola')"],
        ['token', 'chk_token_fechas', 'fecha_expira > fecha_creacion'],
        ['registro_ubicacion', 'chk_registro_ubicacion_metodo', "metodo IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')"],
        ['registro_ubicacion', 'chk_registro_ubicacion_latitud', 'latitud BETWEEN -90 AND 90'],
        ['registro_ubicacion', 'chk_registro_ubicacion_longitud', 'longitud BETWEEN -180 AND 180'],
        ['videojuego', 'chk_videojuego_pegi', 'pegi IN (3, 7, 12, 16, 18)'],
        ['videojuego', 'chk_videojuego_precio_alquiler', 'precio_alquiler >= 0'],
        ['videojuego', 'chk_videojuego_copias', 'copias_alquiler >= 0'],
        ['movil', 'chk_movil_formato', "formato IN ('movil', 'tablet')"],
        ['movil', 'chk_movil_pantalla', 'pantalla_pulgadas > 0'],
        ['movil', 'chk_movil_ram', 'ram_gb > 0'],
        ['movil', 'chk_movil_almacenamiento', 'almacenamiento_gb > 0'],
        ['consola', 'chk_consola_almacenamiento', 'almacenamiento_gb > 0'],
        ['pedido', 'chk_pedido_estado', "estado IN ('pendiente', 'preparado', 'entregado', 'cancelado')"],
        ['pedido', 'chk_pedido_metodo_pago', "metodo_pago IN ('tarjeta', 'bizum', 'paypal', 'en_tienda')"],
        ['compra', 'chk_compra_cantidad', 'cantidad >= 1'],
        ['compra', 'chk_compra_precio', 'precio_unitario >= 0'],
        ['alquiler', 'chk_alquiler_precio', 'precio_dia >= 0'],
        ['reparacion', 'chk_reparacion_estado', "estado IN ('recibida', 'en_reparacion', 'lista', 'entregada', 'cancelada')"],
        ['reparacion', 'chk_reparacion_salida_entregada', "(estado = 'entregada') = (fecha_salida IS NOT NULL)"],
        ['reparacion', 'chk_reparacion_fechas', 'fecha_salida >= fecha_entrada'],
        ['reparacion', 'chk_reparacion_presupuesto', 'presupuesto >= 0'],
    ];

    private const TRIGGERS = [
        // R2. Especialización disjunta: la fila del subtipo coincide con producto.tipo
        'trg_videojuego_tipo_bi' => <<<'SQL'
            CREATE TRIGGER trg_videojuego_tipo_bi BEFORE INSERT ON videojuego
            FOR EACH ROW
            BEGIN
              IF (SELECT tipo FROM producto WHERE id = NEW.id) <> 'videojuego' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no es de tipo videojuego';
              END IF;
            END
            SQL,
        'trg_movil_tipo_bi' => <<<'SQL'
            CREATE TRIGGER trg_movil_tipo_bi BEFORE INSERT ON movil
            FOR EACH ROW
            BEGIN
              IF (SELECT tipo FROM producto WHERE id = NEW.id) <> 'movil' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no es de tipo movil';
              END IF;
            END
            SQL,
        'trg_consola_tipo_bi' => <<<'SQL'
            CREATE TRIGGER trg_consola_tipo_bi BEFORE INSERT ON consola
            FOR EACH ROW
            BEGIN
              IF (SELECT tipo FROM producto WHERE id = NEW.id) <> 'consola' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no es de tipo consola';
              END IF;
            END
            SQL,
        // El tipo de un producto no cambia nunca (si no, la fila del subtipo quedaría huérfana)
        'trg_producto_tipo_bu' => <<<'SQL'
            CREATE TRIGGER trg_producto_tipo_bu BEFORE UPDATE ON producto
            FOR EACH ROW
            BEGIN
              IF NEW.tipo <> OLD.tipo THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El tipo de un producto no se puede cambiar';
              END IF;
            END
            SQL,
        // R2 también para usuario (ADR-032)
        'trg_cliente_tipo_bi' => <<<'SQL'
            CREATE TRIGGER trg_cliente_tipo_bi BEFORE INSERT ON cliente
            FOR EACH ROW
            BEGIN
              IF (SELECT tipo FROM usuario WHERE id = NEW.id) <> 'cliente' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario no es de tipo cliente';
              END IF;
            END
            SQL,
        'trg_trabajador_tipo_bi' => <<<'SQL'
            CREATE TRIGGER trg_trabajador_tipo_bi BEFORE INSERT ON trabajador
            FOR EACH ROW
            BEGIN
              IF (SELECT tipo FROM usuario WHERE id = NEW.id) <> 'trabajador' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El usuario no es de tipo trabajador';
              END IF;
            END
            SQL,
        'trg_usuario_tipo_bu' => <<<'SQL'
            CREATE TRIGGER trg_usuario_tipo_bu BEFORE UPDATE ON usuario
            FOR EACH ROW
            BEGIN
              IF NEW.tipo <> OLD.tipo THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El tipo de un usuario no se puede cambiar';
              END IF;
            END
            SQL,
        // R4. La reparación se asigna a un técnico, nunca a un admin (ADR-032)
        'trg_reparacion_tecnico_bi' => <<<'SQL'
            CREATE TRIGGER trg_reparacion_tecnico_bi BEFORE INSERT ON reparacion
            FOR EACH ROW
            BEGIN
              IF (SELECT puesto FROM trabajador WHERE id = NEW.tecnico_id) <> 'tecnico' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La reparacion se asigna a un tecnico';
              END IF;
            END
            SQL,
        'trg_reparacion_tecnico_bu' => <<<'SQL'
            CREATE TRIGGER trg_reparacion_tecnico_bu BEFORE UPDATE ON reparacion
            FOR EACH ROW
            BEGIN
              IF NEW.tecnico_id <> OLD.tecnico_id
                 AND (SELECT puesto FROM trabajador WHERE id = NEW.tecnico_id) <> 'tecnico' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La reparacion se asigna a un tecnico';
              END IF;
            END
            SQL,
        // R3. Alquiler: fecha de fin no anterior al pedido y quedan copias (los pedidos cancelados no
        // ocupan copia, ADR-034). FOR UPDATE bloquea el videojuego para que dos alquileres simultáneos
        // no pasen los dos la comprobación.
        'trg_alquiler_bi' => <<<'SQL'
            CREATE TRIGGER trg_alquiler_bi BEFORE INSERT ON alquiler
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
            END
            SQL,
    ];

    public function getDescription(): string
    {
        return 'CHECK y triggers del esquema v6 (ADR-020)';
    }

    /** Los CREATE TRIGGER y ALTER TABLE hacen COMMIT implícito en MariaDB: no tiene sentido una transacción. */
    public function isTransactional(): bool
    {
        return false;
    }

    public function up(Schema $schema): void
    {
        foreach (self::CHECKS as [$tabla, $nombre, $condicion]) {
            $this->addSql(sprintf('ALTER TABLE %s ADD CONSTRAINT %s CHECK (%s)', $tabla, $nombre, $condicion));
        }
        foreach (self::TRIGGERS as $sql) {
            $this->addSql($sql);
        }
    }

    public function down(Schema $schema): void
    {
        foreach (array_keys(self::TRIGGERS) as $nombre) {
            $this->addSql(sprintf('DROP TRIGGER IF EXISTS %s', $nombre));
        }
        foreach (self::CHECKS as [$tabla, $nombre]) {
            $this->addSql(sprintf('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s', $tabla, $nombre));
        }
    }
}
