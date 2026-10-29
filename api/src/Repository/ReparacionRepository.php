<?php

namespace App\Repository;

use App\Entity\Cliente;
use App\Entity\Reparacion;
use App\Enum\EstadoReparacion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Reparacion> */
class ReparacionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Reparacion::class);
    }

    /**
     * Cliente → solo las suyas · técnico → las de su departamento · admin → todas.
     * El departamento se obtiene a través del técnico (JOIN trabajador), no se guarda en reparacion.
     */
    public function consultaListado(?Cliente $cliente, ?int $departamentoId, ?EstadoReparacion $estado): QueryBuilder
    {
        $qb = $this->createQueryBuilder('r')
            ->join('r.tecnico', 't')->addSelect('t')
            ->leftJoin('t.departamento', 'd')->addSelect('d')
            ->join('r.cliente', 'c')->addSelect('c')
            ->orderBy('r.fechaEntrada', 'DESC')->addOrderBy('r.id', 'DESC');
        if ($cliente !== null) {
            $qb->andWhere('r.cliente = :cliente')->setParameter('cliente', $cliente);
        }
        if ($departamentoId !== null) {
            $qb->andWhere('d.id = :dep')->setParameter('dep', $departamentoId);
        }
        if ($estado !== null) {
            $qb->andWhere('r.estado = :estado')->setParameter('estado', $estado);
        }

        return $qb;
    }
}
