<?php

namespace App\Enum;

/** Cómo se entrega un pedido (pedido.entrega). ADR-038: recogida en la tienda o envío gratis a domicilio. */
enum TipoEntrega: string
{
    case Tienda = 'tienda';
    case Domicilio = 'domicilio';

    /** @return string[] Valores válidos, para los mensajes de error */
    public static function valores(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
