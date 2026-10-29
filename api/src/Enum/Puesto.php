<?php

namespace App\Enum;

/** Puesto de un trabajador (trabajador.puesto). ADR-032. */
enum Puesto: string
{
    case Tecnico = 'tecnico';
    case Admin = 'admin';

    /** @return string[] Valores válidos, para los mensajes de error */
    public static function valores(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
