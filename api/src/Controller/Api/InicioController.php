<?php

namespace App\Controller\Api;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/** La raíz de la API: quien abra la dirección en el navegador ve que está en marcha, sin datos ni token. */
final class InicioController extends ApiController
{
    #[Route('/', methods: ['GET'])]
    #[Route('/api', methods: ['GET'])]
    public function inicio(): JsonResponse
    {
        return $this->respuesta(['nombre' => 'API de Almi Companion', 'estado' => 'ok']);
    }
}
