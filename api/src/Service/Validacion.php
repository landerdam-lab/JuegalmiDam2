<?php

namespace App\Service;

use App\Http\ApiException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Pasa el Validator de Symfony (las reglas #[Assert\...] de las entidades) y, si algo falla,
 * lanza un 422 con un mensaje por campo: {"campos": {"precio": "Este valor debería ser…"}}.
 * La app marca cada campo del formulario con su mensaje (rúbrica: orientar al usuario).
 */
final class Validacion
{
    /** Nombre de la propiedad en PHP → nombre del campo en el JSON (cuando no coinciden). */
    private const CAMPOS_JSON = [
        'marca' => 'marcaId',
        'plataforma' => 'plataformaId',
        'tienda' => 'tiendaId',
        'departamento' => 'departamentoId',
    ];

    public function __construct(private readonly ValidatorInterface $validator)
    {
    }

    public function validar(object $entidad): void
    {
        $errores = $this->validator->validate($entidad);
        if (count($errores) === 0) {
            return;
        }
        $campos = [];
        foreach ($errores as $error) {
            $campo = $error->getPropertyPath();
            $campo = self::CAMPOS_JSON[$campo] ?? $campo;
            $campos[$campo] ??= (string) $error->getMessage(); // el primer error de cada campo
        }

        throw ApiException::validacion($campos);
    }
}
