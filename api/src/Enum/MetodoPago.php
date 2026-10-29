<?php

namespace App\Enum;

/** Método de pago de un pedido (pedido.metodo_pago). ADR-015. */
enum MetodoPago: string
{
    case Tarjeta = 'tarjeta';
    case Bizum = 'bizum';
    case Paypal = 'paypal';
    case EnTienda = 'en_tienda';

    /** @return string[] Valores válidos, para los mensajes de error */
    public static function valores(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
