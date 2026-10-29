<?php

namespace App\Http;

/**
 * Error "de negocio" que la API devuelve al cliente con el formato común
 * {"error": {"codigo", "mensaje", "campos"}} (05-API/Formato JSON y errores).
 * Lo convierte en respuesta JSON App\EventListener\ApiExceptionListener.
 */
final class ApiException extends \RuntimeException
{
    /** @param array<string, string> $campos campo => mensaje (solo en 422) */
    public function __construct(
        private readonly int $estadoHttp,
        private readonly string $codigo,
        string $mensaje,
        private readonly array $campos = [],
    ) {
        parent::__construct($mensaje);
    }

    public function getEstadoHttp(): int
    {
        return $this->estadoHttp;
    }

    public function getCodigo(): string
    {
        return $this->codigo;
    }

    /** @return array<string, string> */
    public function getCampos(): array
    {
        return $this->campos;
    }

    // Atajos para los errores más comunes -----------------------------------

    /** @param array<string, string> $campos */
    public static function validacion(array $campos, string $mensaje = 'Hay campos incorrectos'): self
    {
        return new self(422, 'VALIDACION', $mensaje, $campos);
    }

    public static function noEncontrado(string $mensaje = 'No existe'): self
    {
        return new self(404, 'NO_ENCONTRADO', $mensaje);
    }

    public static function prohibido(string $mensaje = 'No tienes permiso para hacer esto'): self
    {
        return new self(403, 'PROHIBIDO', $mensaje);
    }

    /** @param array<string, string> $campos */
    public static function conflicto(string $codigo, string $mensaje, array $campos = []): self
    {
        return new self(409, $codigo, $mensaje, $campos);
    }

    public static function peticionInvalida(string $mensaje = 'La petición no es un JSON válido'): self
    {
        return new self(400, 'PETICION_INVALIDA', $mensaje);
    }
}
