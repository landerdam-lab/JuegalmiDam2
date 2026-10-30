<?php

namespace App\Http;

use Doctrine\ORM\QueryBuilder;
use Doctrine\ORM\Tools\Pagination\Paginator;
use Symfony\Component\HttpFoundation\Request;

/**
 * Listados paginados: ?page=1&limit=20 → {"items": [...], "page": 1, "limit": 20, "total": 37}.
 * Las apps piden página a página para cargar rápido (carga progresiva, rúbrica PSP).
 */
final class Paginacion
{
    public const LIMITE_POR_DEFECTO = 20;
    public const LIMITE_MAXIMO = 100;

    /**
     * @param callable(object): array<string, mixed> $aJson convierte cada entidad en su array JSON
     * @param (callable(list<object>): void)|null $antes se llama con las entidades de la página
     *                                                   (para precalcular datos en una sola consulta)
     *
     * @return array{items: list<array<string, mixed>>, page: int, limit: int, total: int}
     */
    public static function paginar(QueryBuilder $qb, Request $request, callable $aJson, ?callable $antes = null): array
    {
        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(self::LIMITE_MAXIMO, max(1, $request->query->getInt('limit', self::LIMITE_POR_DEFECTO)));

        $qb->setFirstResult(($page - 1) * $limit)->setMaxResults($limit);
        $paginator = new Paginator($qb->getQuery(), fetchJoinCollection: true);
        $entidades = iterator_to_array($paginator->getIterator(), false);
        if ($antes !== null) {
            $antes($entidades);
        }

        return [
            'items' => array_map($aJson, $entidades),
            'page' => $page,
            'limit' => $limit,
            'total' => count($paginator),
        ];
    }
}
