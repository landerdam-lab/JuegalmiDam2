<?php

namespace App\Enum;

/** Línea de negocio de un servicio: pestaña de Servicios (servicio.linea). ADR-030. */
enum LineaServicio: string
{
    case Videojuegos = 'videojuegos';
    case Consolas = 'consolas';
    case Telefonia = 'telefonia';

    /** @return string[] Valores válidos, para los mensajes de error */
    public static function valores(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
