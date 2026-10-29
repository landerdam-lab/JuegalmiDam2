<?php

namespace App\Util;

/**
 * Cálculos de dinero sin errores de redondeo.
 * Doctrine devuelve los DECIMAL(10,2) como texto ("12.50"). Para sumar y multiplicar los pasamos
 * a céntimos (enteros), operamos y volvemos a texto. Nunca se usa float para guardar dinero.
 */
final class Dinero
{
    public static function aCentimos(string $importe): int
    {
        return (int) round(((float) $importe) * 100);
    }

    public static function deCentimos(int $centimos): string
    {
        return number_format($centimos / 100, 2, '.', '');
    }
}
