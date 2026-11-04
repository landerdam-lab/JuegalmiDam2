<?php

namespace App\Controller\Api;

use App\Http\ApiException;
use App\Service\Geocodificador;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

/** Busca en el mapa la dirección de entrega que escribe el cliente (ADR-040). Con token. */
#[Route('/api')]
final class DireccionController extends ApiController
{
    public function __construct(private readonly Geocodificador $geocodificador)
    {
    }

    #[Route('/direcciones', methods: ['GET'])]
    public function buscar(Request $request): JsonResponse
    {
        $texto = trim($request->query->getString('texto'));
        if (mb_strlen($texto) < 5 || mb_strlen($texto) > 255) {
            throw ApiException::validacion(['texto' => 'Escribe la dirección completa (entre 5 y 255 caracteres).']);
        }

        $direccion = $this->geocodificador->buscar($texto);
        if ($direccion === null) {
            throw ApiException::noEncontrado('No encontramos esa dirección. Revísala o marca el punto tocando el mapa.');
        }

        return $this->respuesta($direccion);
    }
}
