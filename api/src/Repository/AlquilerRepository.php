<?php

namespace App\Repository;

use App\Entity\Alquiler;
use App\Entity\Cliente;
use App\Enum\EstadoPedido;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Alquiler> */
class AlquilerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Alquiler::class);
    }

    /**
     * Copias ocupadas de cada videojuego: alquileres sin devolver de pedidos NO cancelados
     * (ADR-034). Es la misma cuenta que hace el trigger trg_alquiler_bi.
     *
     * @param int[] $videojuegoIds
     *
     * @return array<int, int> id del videojuego => copias alquiladas ahora mismo
     */
    public function copiasOcupadas(array $videojuegoIds): array
    {
        if ($videojuegoIds === []) {
            return [];
        }
        $filas = $this->createQueryBuilder('a')
            ->select('IDENTITY(a.videojuego) AS id, COUNT(a.id) AS n')
            ->join('a.pedido', 'p')
            ->where('a.videojuego IN (:ids)')
            ->andWhere('a.fechaDevolucion IS NULL')
            ->andWhere('p.estado <> :cancelado')
            ->groupBy('a.videojuego')
            ->setParameter('ids', $videojuegoIds)
            ->setParameter('cancelado', EstadoPedido::Cancelado)
            ->getQuery()->getArrayResult();

        $resultado = array_fill_keys($videojuegoIds, 0);
        foreach ($filas as $fila) {
            $resultado[(int) $fila['id']] = (int) $fila['n'];
        }

        return $resultado;
    }

    /**
     * Listado: los del cliente (si se indica) o todos (admin).
     * ?estado = activo | retrasado | devuelto | cancelado (el estado se calcula, no se guarda).
     */
    public function consultaListado(?Cliente $cliente, ?string $estado, \DateTimeImmutable $hoy): QueryBuilder
    {
        $qb = $this->createQueryBuilder('a')
            ->join('a.pedido', 'p')->addSelect('p')
            ->join('a.videojuego', 'v')->addSelect('v')
            ->orderBy('p.fecha', 'DESC')->addOrderBy('a.id', 'DESC');
        if ($cliente !== null) {
            $qb->andWhere('p.cliente = :cliente')->setParameter('cliente', $cliente);
        }
        $hoy = $hoy->setTime(0, 0);
        match ($estado) {
            'cancelado' => $qb->andWhere('p.estado = :cancelado'),
            'devuelto' => $qb->andWhere('p.estado <> :cancelado AND a.fechaDevolucion IS NOT NULL'),
            'retrasado' => $qb->andWhere('p.estado <> :cancelado AND a.fechaDevolucion IS NULL AND a.fechaFin < :hoy')
                ->setParameter('hoy', $hoy),
            'activo' => $qb->andWhere('p.estado <> :cancelado AND a.fechaDevolucion IS NULL AND a.fechaFin >= :hoy')
                ->setParameter('hoy', $hoy),
            default => null,
        };
        if (in_array($estado, ['cancelado', 'devuelto', 'retrasado', 'activo'], true)) {
            $qb->setParameter('cancelado', EstadoPedido::Cancelado);
        }

        return $qb;
    }
}
