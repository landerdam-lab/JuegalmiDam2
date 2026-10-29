<?php

namespace App\Enum;

/** Formato de un móvil (movil.formato). ADR-012. */
enum FormatoMovil: string
{
    case Movil = 'movil';
    case Tablet = 'tablet';

    /** @return string[] Valores válidos, para los mensajes de error */
    public static function valores(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
