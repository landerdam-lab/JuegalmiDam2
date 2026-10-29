<?php

namespace App\Enum;

/** Estado de una reparación (reparacion.estado). ADR-015. */
enum EstadoReparacion: string
{
    case Recibida = 'recibida';
    case EnReparacion = 'en_reparacion';
    case Lista = 'lista';
    case Entregada = 'entregada';
    case Cancelada = 'cancelada';

    /** @return string[] Valores válidos, para los mensajes de error */
    public static function valores(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }

    /**
     * Transiciones permitidas (Reglas de negocio, ADR-015):
     * recibida → en_reparacion → lista → entregada; recibida o en_reparacion → cancelada.
     */
    public function puedePasarA(self $nuevo): bool
    {
        return match ($this) {
            self::Recibida => in_array($nuevo, [self::EnReparacion, self::Cancelada], true),
            self::EnReparacion => in_array($nuevo, [self::Lista, self::Cancelada], true),
            self::Lista => $nuevo === self::Entregada,
            self::Entregada, self::Cancelada => false,
        };
    }

    /** Una reparación está "abierta" mientras no se entrega ni se cancela. */
    public function estaAbierta(): bool
    {
        return !in_array($this, [self::Entregada, self::Cancelada], true);
    }
}
