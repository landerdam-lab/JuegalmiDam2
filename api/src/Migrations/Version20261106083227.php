<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * ADR-042: proveedores (modelo v7, 21 tablas).
 *
 * - proveedor: a quién compra la tienda la mercancía (no es la marca, que es quien la fabrica).
 * - producto_proveedor: N:M entre producto y proveedor con el precio de coste como atributo.
 *   id propio + UNIQUE de la pareja, como compra y alquiler (ADR-013, ADR-034).
 *   Borrar un producto borra sus filas (CASCADE); un proveedor con productos no se borra (RESTRICT).
 *
 * Tablas, claves e índices generados con doctrine:migrations:diff. Los CHECK van a mano (A-09).
 */
final class Version20261106083227 extends AbstractMigration
{
    /** [tabla, nombre, condición] */
    private const CHECKS = [
        ['proveedor', 'chk_proveedor_cif', "cif REGEXP '^[A-Z][0-9]{7}[0-9A-J]$'"],
        ['producto_proveedor', 'chk_producto_proveedor_precio_coste', 'precio_coste >= 0'],
    ];

    public function getDescription(): string
    {
        return 'Proveedores y precio de coste de cada producto por proveedor (ADR-042)';
    }

    /** CREATE/ALTER TABLE hacen COMMIT implícito en MariaDB: no se puede envolver en una transacción. */
    public function isTransactional(): bool
    {
        return false;
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE proveedor (id INT AUTO_INCREMENT NOT NULL, nombre VARCHAR(100) NOT NULL, cif CHAR(9) NOT NULL, telefono VARCHAR(20) NOT NULL, email VARCHAR(180) NOT NULL, direccion VARCHAR(255) DEFAULT NULL, UNIQUE INDEX uq_proveedor_cif (cif), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE producto_proveedor (id INT AUTO_INCREMENT NOT NULL, precio_coste NUMERIC(10, 2) NOT NULL, producto_id INT NOT NULL, proveedor_id INT NOT NULL, INDEX idx_producto_proveedor_proveedor (proveedor_id), UNIQUE INDEX uq_producto_proveedor (producto_id, proveedor_id), INDEX IDX_E051DDE47645698E (producto_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE producto_proveedor ADD CONSTRAINT FK_E051DDE47645698E FOREIGN KEY (producto_id) REFERENCES producto (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE producto_proveedor ADD CONSTRAINT FK_E051DDE4CB305D73 FOREIGN KEY (proveedor_id) REFERENCES proveedor (id)');
        foreach (self::CHECKS as [$tabla, $nombre, $condicion]) {
            $this->addSql(sprintf('ALTER TABLE %s ADD CONSTRAINT %s CHECK (%s)', $tabla, $nombre, $condicion));
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE producto_proveedor');
        $this->addSql('DROP TABLE proveedor');
    }
}
