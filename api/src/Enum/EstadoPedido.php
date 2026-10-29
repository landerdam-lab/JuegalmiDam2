<?php

namespace App\Enum;

/** Estado de un pedido (pedido.estado). ADR-015. */
enum EstadoPedido: string
{
    case Pendiente = 'pendiente';
    case Preparado = 'preparado';
    case Entregado = 'entregado';
    case Cancelado = 'cancelado';

    /** @return string[] Valores válidos, para los mensajes de error */
    public static function valores(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }

    /**
     * Transiciones permitidas (Reglas de negocio, ADR-015):
     * pendiente → preparado → entregado, y pendiente → cancelado.
     */
    public function puedePasarA(self $nuevo): bool
    {
        return match ($this) {
            self::Pendiente => in_array($nuevo, [self::Preparado, self::Cancelado], true),
            self::Preparado => $nuevo === self::Entregado,
            self::Entregado, self::Cancelado => false,
        };
    }
}
