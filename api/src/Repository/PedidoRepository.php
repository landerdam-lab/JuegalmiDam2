<?php

namespace App\Repository;

use App\Entity\Cliente;
use App\Entity\Pedido;
use App\Enum\EstadoPedido;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Pedido> */
class PedidoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pedido::class);
    }

    /** Los del cliente (si se indica) o todos (admin), del más reciente al más antiguo. */
    public function consultaListado(?Cliente $cliente, ?EstadoPedido $estado): QueryBuilder
    {
        $qb = $this->createQueryBuilder('p')
            ->join('p.cliente', 'c')->addSelect('c')
            ->orderBy('p.fecha', 'DESC')->addOrderBy('p.id', 'DESC');
        if ($cliente !== null) {
            $qb->andWhere('p.cliente = :cliente')->setParameter('cliente', $cliente);
        }
        if ($estado !== null) {
            $qb->andWhere('p.estado = :estado')->setParameter('estado', $estado);
        }

        return $qb;
    }
}
