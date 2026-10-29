<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Esquema v6 (19 tablas): tablas, PK, FK, UNIQUE e índices. Generada con doctrine:migrations:diff
 * a partir de las entidades. Los CHECK y los triggers van en la siguiente (Version20261029120000).
 */
final class Version20261029083408 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Esquema v6: 19 tablas con sus claves e índices';
    }

    /** CREATE/ALTER TABLE hacen COMMIT implícito en MariaDB: no se puede envolver en una transacción. */
    public function isTransactional(): bool
    {
        return false;
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE alquiler (id INT AUTO_INCREMENT NOT NULL, precio_dia NUMERIC(10, 2) NOT NULL, fecha_fin DATE NOT NULL, fecha_devolucion DATE DEFAULT NULL, pedido_id INT NOT NULL, videojuego_id INT NOT NULL, INDEX idx_alquiler_videojuego_devolucion (videojuego_id, fecha_devolucion), UNIQUE INDEX uq_alquiler_pedido_videojuego (pedido_id, videojuego_id), INDEX IDX_655BED394854653A (pedido_id), INDEX IDX_655BED3982925A85 (videojuego_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE cliente (dni CHAR(9) NOT NULL, foto VARCHAR(255) DEFAULT NULL, id INT NOT NULL, UNIQUE INDEX uq_cliente_dni (dni), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE compra (id INT AUTO_INCREMENT NOT NULL, cantidad INT NOT NULL, precio_unitario NUMERIC(10, 2) NOT NULL, pedido_id INT NOT NULL, producto_id INT NOT NULL, INDEX idx_compra_producto (producto_id), UNIQUE INDEX uq_compra_pedido_producto (pedido_id, producto_id), INDEX IDX_9EC131FF4854653A (pedido_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE consola (modelo VARCHAR(80) NOT NULL, almacenamiento_gb SMALLINT NOT NULL, id INT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE departamento (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(50) NOT NULL, UNIQUE INDEX uq_departamento_nombre (nombre), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE foto_tienda (id INT AUTO_INCREMENT NOT NULL, imagen VARCHAR(255) NOT NULL, descripcion VARCHAR(255) NOT NULL, tienda_id INT NOT NULL, INDEX IDX_F3174F6719BA6D46 (tienda_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE marca (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(80) NOT NULL, UNIQUE INDEX uq_marca_nombre (nombre), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE movil (formato VARCHAR(10) NOT NULL, pantalla_pulgadas NUMERIC(3, 1) NOT NULL, ram_gb SMALLINT NOT NULL, almacenamiento_gb SMALLINT NOT NULL, id INT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE pedido (id INT AUTO_INCREMENT NOT NULL, fecha DATETIME NOT NULL, estado VARCHAR(20) DEFAULT \'pendiente\' NOT NULL, metodo_pago VARCHAR(20) NOT NULL, cliente_id INT NOT NULL, INDEX idx_pedido_cliente_fecha (cliente_id, fecha), INDEX IDX_C4EC16CEDE734E51 (cliente_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE plataforma (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(50) NOT NULL, UNIQUE INDEX uq_plataforma_nombre (nombre), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE producto (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(150) NOT NULL, descripcion TEXT NOT NULL, precio NUMERIC(10, 2) NOT NULL, stock INT DEFAULT 0 NOT NULL, imagen VARCHAR(255) NOT NULL, activo TINYINT DEFAULT 1 NOT NULL, marca_id INT NOT NULL, tipo VARCHAR(20) NOT NULL, INDEX idx_producto_tipo_activo (tipo, activo), INDEX IDX_A7BB061581EF0041 (marca_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE registro_ubicacion (id INT AUTO_INCREMENT NOT NULL, fecha DATETIME NOT NULL, latitud NUMERIC(10, 7) NOT NULL, longitud NUMERIC(10, 7) NOT NULL, metodo VARCHAR(7) NOT NULL, ruta VARCHAR(255) NOT NULL, usuario_id INT NOT NULL, INDEX idx_registro_ubicacion_usuario_fecha (usuario_id, fecha), INDEX IDX_490514B0DB38439E (usuario_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE reparacion (id INT AUTO_INCREMENT NOT NULL, dispositivo VARCHAR(100) NOT NULL, problema TEXT NOT NULL, estado VARCHAR(20) DEFAULT \'recibida\' NOT NULL, fecha_entrada DATETIME NOT NULL, fecha_salida DATETIME DEFAULT NULL, presupuesto NUMERIC(10, 2) DEFAULT NULL, foto VARCHAR(255) DEFAULT NULL, cliente_id INT NOT NULL, tecnico_id INT NOT NULL, INDEX idx_reparacion_tecnico_estado (tecnico_id, estado), INDEX IDX_42114EBBDE734E51 (cliente_id), INDEX IDX_42114EBB841DB1E7 (tecnico_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE servicio (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(100) NOT NULL, descripcion TEXT NOT NULL, precio_orientativo NUMERIC(10, 2) DEFAULT NULL, linea VARCHAR(15) NOT NULL, UNIQUE INDEX uq_servicio_linea_nombre (linea, nombre), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE tienda (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(100) NOT NULL, direccion VARCHAR(255) NOT NULL, latitud NUMERIC(10, 7) NOT NULL, longitud NUMERIC(10, 7) NOT NULL, historia TEXT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE token (id INT AUTO_INCREMENT NOT NULL, token_hash CHAR(64) NOT NULL, fecha_creacion DATETIME NOT NULL, fecha_expira DATETIME NOT NULL, usuario_id INT NOT NULL, INDEX idx_token_fecha_expira (fecha_expira), UNIQUE INDEX uq_token_hash (token_hash), INDEX IDX_5F37A13BDB38439E (usuario_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE trabajador (puesto VARCHAR(10) NOT NULL, departamento_id INT DEFAULT NULL, id INT NOT NULL, INDEX IDX_42157CDF5A91C08D (departamento_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE usuario (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(100) NOT NULL, apellidos VARCHAR(150) NOT NULL, email VARCHAR(180) NOT NULL, password VARCHAR(255) NOT NULL, telefono VARCHAR(20) NOT NULL, activo TINYINT DEFAULT 1 NOT NULL, tipo VARCHAR(10) NOT NULL, UNIQUE INDEX uq_usuario_email (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE videojuego (genero VARCHAR(50) NOT NULL, pegi SMALLINT NOT NULL, precio_alquiler NUMERIC(10, 2) NOT NULL, copias_alquiler INT DEFAULT 0 NOT NULL, plataforma_id INT NOT NULL, id INT NOT NULL, INDEX IDX_AA5E6DFAEB90E430 (plataforma_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE alquiler ADD CONSTRAINT FK_655BED394854653A FOREIGN KEY (pedido_id) REFERENCES pedido (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE alquiler ADD CONSTRAINT FK_655BED3982925A85 FOREIGN KEY (videojuego_id) REFERENCES videojuego (id)');
        $this->addSql('ALTER TABLE cliente ADD CONSTRAINT FK_F41C9B25BF396750 FOREIGN KEY (id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE compra ADD CONSTRAINT FK_9EC131FF4854653A FOREIGN KEY (pedido_id) REFERENCES pedido (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE compra ADD CONSTRAINT FK_9EC131FF7645698E FOREIGN KEY (producto_id) REFERENCES producto (id)');
        $this->addSql('ALTER TABLE consola ADD CONSTRAINT FK_316E0BAFBF396750 FOREIGN KEY (id) REFERENCES producto (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE foto_tienda ADD CONSTRAINT FK_F3174F6719BA6D46 FOREIGN KEY (tienda_id) REFERENCES tienda (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE movil ADD CONSTRAINT FK_64824ACBBF396750 FOREIGN KEY (id) REFERENCES producto (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE pedido ADD CONSTRAINT FK_C4EC16CEDE734E51 FOREIGN KEY (cliente_id) REFERENCES cliente (id)');
        $this->addSql('ALTER TABLE producto ADD CONSTRAINT FK_A7BB061581EF0041 FOREIGN KEY (marca_id) REFERENCES marca (id)');
        $this->addSql('ALTER TABLE registro_ubicacion ADD CONSTRAINT FK_490514B0DB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reparacion ADD CONSTRAINT FK_42114EBBDE734E51 FOREIGN KEY (cliente_id) REFERENCES cliente (id)');
        $this->addSql('ALTER TABLE reparacion ADD CONSTRAINT FK_42114EBB841DB1E7 FOREIGN KEY (tecnico_id) REFERENCES trabajador (id)');
        $this->addSql('ALTER TABLE token ADD CONSTRAINT FK_5F37A13BDB38439E FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE trabajador ADD CONSTRAINT FK_42157CDFBF396750 FOREIGN KEY (id) REFERENCES usuario (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE trabajador ADD CONSTRAINT FK_42157CDF5A91C08D FOREIGN KEY (departamento_id) REFERENCES departamento (id)');
        $this->addSql('ALTER TABLE videojuego ADD CONSTRAINT FK_AA5E6DFABF396750 FOREIGN KEY (id) REFERENCES producto (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE videojuego ADD CONSTRAINT FK_AA5E6DFAEB90E430 FOREIGN KEY (plataforma_id) REFERENCES plataforma (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE alquiler DROP FOREIGN KEY FK_655BED394854653A');
        $this->addSql('ALTER TABLE alquiler DROP FOREIGN KEY FK_655BED3982925A85');
        $this->addSql('ALTER TABLE cliente DROP FOREIGN KEY FK_F41C9B25BF396750');
        $this->addSql('ALTER TABLE compra DROP FOREIGN KEY FK_9EC131FF4854653A');
        $this->addSql('ALTER TABLE compra DROP FOREIGN KEY FK_9EC131FF7645698E');
        $this->addSql('ALTER TABLE consola DROP FOREIGN KEY FK_316E0BAFBF396750');
        $this->addSql('ALTER TABLE foto_tienda DROP FOREIGN KEY FK_F3174F6719BA6D46');
        $this->addSql('ALTER TABLE movil DROP FOREIGN KEY FK_64824ACBBF396750');
        $this->addSql('ALTER TABLE pedido DROP FOREIGN KEY FK_C4EC16CEDE734E51');
        $this->addSql('ALTER TABLE producto DROP FOREIGN KEY FK_A7BB061581EF0041');
        $this->addSql('ALTER TABLE registro_ubicacion DROP FOREIGN KEY FK_490514B0DB38439E');
        $this->addSql('ALTER TABLE reparacion DROP FOREIGN KEY FK_42114EBBDE734E51');
        $this->addSql('ALTER TABLE reparacion DROP FOREIGN KEY FK_42114EBB841DB1E7');
        $this->addSql('ALTER TABLE token DROP FOREIGN KEY FK_5F37A13BDB38439E');
        $this->addSql('ALTER TABLE trabajador DROP FOREIGN KEY FK_42157CDFBF396750');
        $this->addSql('ALTER TABLE trabajador DROP FOREIGN KEY FK_42157CDF5A91C08D');
        $this->addSql('ALTER TABLE videojuego DROP FOREIGN KEY FK_AA5E6DFABF396750');
        $this->addSql('ALTER TABLE videojuego DROP FOREIGN KEY FK_AA5E6DFAEB90E430');
        $this->addSql('DROP TABLE alquiler');
        $this->addSql('DROP TABLE cliente');
        $this->addSql('DROP TABLE compra');
        $this->addSql('DROP TABLE consola');
        $this->addSql('DROP TABLE departamento');
        $this->addSql('DROP TABLE foto_tienda');
        $this->addSql('DROP TABLE marca');
        $this->addSql('DROP TABLE movil');
        $this->addSql('DROP TABLE pedido');
        $this->addSql('DROP TABLE plataforma');
        $this->addSql('DROP TABLE producto');
        $this->addSql('DROP TABLE registro_ubicacion');
        $this->addSql('DROP TABLE reparacion');
        $this->addSql('DROP TABLE servicio');
        $this->addSql('DROP TABLE tienda');
        $this->addSql('DROP TABLE token');
        $this->addSql('DROP TABLE trabajador');
        $this->addSql('DROP TABLE usuario');
        $this->addSql('DROP TABLE videojuego');
    }
}
