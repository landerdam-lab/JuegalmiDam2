<?php

namespace App\Http;

/**
 * Lee el cuerpo JSON de una petición comprobando el TIPO de cada campo.
 * Si un campo tiene un tipo incorrecto, lanza un 422 que marca ese campo.
 * (Las reglas de negocio —longitudes, rangos, obligatorios…— las comprueba después el Validator.)
 *
 * Uso: if ($datos->tiene('precio')) { $producto->setPrecio($datos->decimal('precio')); }
 */
final class Datos
{
    /** @param array<string, mixed> $valores */
    public function __construct(private readonly array $valores)
    {
    }

    public static function desdeJson(string $json): self
    {
        if (trim($json) === '') {
            return new self([]);
        }
        try {
            $valores = json_decode($json, true, 32, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw ApiException::peticionInvalida();
        }
        if (!is_array($valores) || array_is_list($valores) && $valores !== []) {
            throw ApiException::peticionInvalida('El cuerpo tiene que ser un objeto JSON');
        }

        return new self($valores);
    }

    /** ¿Viene el campo en el JSON? (aunque sea null). Sirve para los PUT parciales. */
    public function tiene(string $campo): bool
    {
        return array_key_exists($campo, $this->valores);
    }

    public function texto(string $campo, bool $obligatorio = false): ?string
    {
        $v = $this->valor($campo, $obligatorio);
        if ($v === null) {
            return null;
        }
        if (!is_string($v)) {
            throw ApiException::validacion([$campo => 'Tiene que ser un texto.']);
        }
        $v = trim($v);
        if ($obligatorio && $v === '') {
            throw ApiException::validacion([$campo => 'Este valor no debería estar vacío.']);
        }

        return $v;
    }

    public function entero(string $campo, bool $obligatorio = false): ?int
    {
        $v = $this->valor($campo, $obligatorio);
        if ($v === null) {
            return null;
        }
        if (is_string($v) && preg_match('/^-?\d+$/', $v)) {
            $v = (int) $v;
        }
        if (!is_int($v)) {
            throw ApiException::validacion([$campo => 'Tiene que ser un número entero.']);
        }

        return $v;
    }

    /** Dinero o coordenadas: acepta 12, 12.5 o "12.50" y lo devuelve como texto (DECIMAL de Doctrine). */
    public function decimal(string $campo, bool $obligatorio = false, int $decimales = 2): ?string
    {
        $v = $this->valor($campo, $obligatorio);
        if ($v === null) {
            return null;
        }
        if (!is_int($v) && !is_float($v) && !(is_string($v) && is_numeric($v))) {
            throw ApiException::validacion([$campo => 'Tiene que ser un número.']);
        }

        return number_format((float) $v, $decimales, '.', '');
    }

    public function booleano(string $campo, bool $obligatorio = false): ?bool
    {
        $v = $this->valor($campo, $obligatorio);
        if ($v === null) {
            return null;
        }
        if (!is_bool($v)) {
            throw ApiException::validacion([$campo => 'Tiene que ser true o false.']);
        }

        return $v;
    }

    /** Fecha "AAAA-MM-DD" (sin hora). */
    public function fecha(string $campo, bool $obligatorio = false): ?\DateTimeImmutable
    {
        $v = $this->texto($campo, $obligatorio);
        if ($v === null) {
            return null;
        }
        $fecha = \DateTimeImmutable::createFromFormat('!Y-m-d', $v);
        if ($fecha === false || $fecha->format('Y-m-d') !== $v) {
            throw ApiException::validacion([$campo => 'Tiene que ser una fecha AAAA-MM-DD.']);
        }

        return $fecha;
    }

    /**
     * Valor de un enumerado de PHP (BackedEnum).
     *
     * @template T of \BackedEnum
     *
     * @param class-string<T> $enum
     *
     * @return T|null
     */
    public function enum(string $campo, string $enum, bool $obligatorio = false): ?\BackedEnum
    {
        $v = $this->texto($campo, $obligatorio);
        if ($v === null) {
            return null;
        }
        $caso = $enum::tryFrom($v);
        if ($caso === null) {
            throw ApiException::validacion([$campo => 'Valor no válido. Valores posibles: '.implode(', ', $enum::valores()).'.']);
        }

        return $caso;
    }

    /** @return list<array<string, mixed>> Lista de objetos (p. ej. las líneas de un pedido) */
    public function listaDeObjetos(string $campo): array
    {
        $v = $this->valor($campo, true);
        if (!is_array($v) || !array_is_list($v)) {
            throw ApiException::validacion([$campo => 'Tiene que ser una lista.']);
        }
        foreach ($v as $elemento) {
            if (!is_array($elemento) || (array_is_list($elemento) && $elemento !== [])) {
                throw ApiException::validacion([$campo => 'Cada elemento tiene que ser un objeto.']);
            }
        }

        return $v;
    }

    private function valor(string $campo, bool $obligatorio): mixed
    {
        $v = $this->valores[$campo] ?? null;
        if ($v === null && $obligatorio) {
            throw ApiException::validacion([$campo => 'Este valor no debería estar vacío.']);
        }

        return $v;
    }
}
