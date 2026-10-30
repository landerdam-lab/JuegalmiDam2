<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * ADR-038: el pedido se recoge en la tienda o se envía a domicilio (gratis).
 *
 * Columnas nuevas en pedido: entrega (tienda | domicilio), direccion_entrega y el punto del mapa
 * (latitud_entrega, longitud_entrega). Los CHECK van a mano (A-09): Doctrine no los genera.
 * - chk_pedido_entrega: solo esos dos valores.
 * - chk_pedido_entrega_datos: a domicilio, los tres datos obligatorios; en tienda, los tres a NULL
 *   (así no hay direcciones sueltas en pedidos de recogida).
 * Los pedidos que ya existían se quedan como «tienda» (DEFAULT), que era lo único posible antes.
 */
final class Version20261030100000 extends AbstractMigration
{
    /** [nombre, condición] */
    private const CHECKS = [
        ['chk_pedido_entrega', "entrega IN ('tienda', 'domicilio')"],
        ['chk_pedido_entrega_datos', "(entrega = 'tienda' AND direccion_entrega IS NULL AND latitud_entrega IS NULL AND longitud_entrega IS NULL)"
            ." OR (entrega = 'domicilio' AND direccion_entrega IS NOT NULL AND latitud_entrega IS NOT NULL AND longitud_entrega IS NOT NULL)"],
        ['chk_pedido_latitud_entrega', 'latitud_entrega BETWEEN -90 AND 90'],
        ['chk_pedido_longitud_entrega', 'longitud_entrega BETWEEN -180 AND 180'],
    ];

    public function getDescription(): string
    {
        return 'Pedido: recogida en tienda o envío a domicilio con dirección y punto del mapa (ADR-038)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE pedido ADD entrega VARCHAR(20) DEFAULT 'tienda' NOT NULL,"
            .' ADD direccion_entrega VARCHAR(255) DEFAULT NULL,'
            .' ADD latitud_entrega NUMERIC(10, 7) DEFAULT NULL,'
            .' ADD longitud_entrega NUMERIC(10, 7) DEFAULT NULL');
        foreach (self::CHECKS as [$nombre, $condicion]) {
            $this->addSql(sprintf('ALTER TABLE pedido ADD CONSTRAINT %s CHECK (%s)', $nombre, $condicion));
        }
    }

    public function down(Schema $schema): void
    {
        foreach (self::CHECKS as [$nombre]) {
            $this->addSql(sprintf('ALTER TABLE pedido DROP CONSTRAINT IF EXISTS %s', $nombre));
        }
        $this->addSql('ALTER TABLE pedido DROP entrega, DROP direccion_entrega, DROP latitud_entrega, DROP longitud_entrega');
    }
}
