<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\JsonResponse;

/** Construye SIEMPRE el mismo JSON de error: {"error": {"codigo", "mensaje", "campos"}}. */
final class RespuestaError
{
    /** @param array<string, string> $campos */
    public static function crear(int $estadoHttp, string $codigo, string $mensaje, array $campos = [], array $extra = []): JsonResponse
    {
        $respuesta = new JsonResponse(['error' => [
            'codigo' => $codigo,
            'mensaje' => $mensaje,
            'campos' => (object) $campos, // {} aunque esté vacío, para que las apps siempre reciban un objeto
        ] + $extra], $estadoHttp);
        // Igual que las respuestas normales: tildes sin escapar (sale "á", no la secuencia á)
        $respuesta->setEncodingOptions(JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return $respuesta;
    }
}
