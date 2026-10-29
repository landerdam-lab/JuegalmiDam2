<?php

namespace App\Repository;

use App\Entity\RegistroUbicacion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<RegistroUbicacion> */
class RegistroUbicacionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RegistroUbicacion::class);
    }

    public function consultaListado(?int $usuarioId, ?\DateTimeImmutable $desde, ?\DateTimeImmutable $hasta): QueryBuilder
    {
        $qb = $this->createQueryBuilder('r')
            ->join('r.usuario', 'u')->addSelect('u')
            ->orderBy('r.fecha', 'DESC')->addOrderBy('r.id', 'DESC');
        if ($usuarioId !== null) {
            $qb->andWhere('u.id = :usuario')->setParameter('usuario', $usuarioId);
        }
        if ($desde !== null) {
            $qb->andWhere('r.fecha >= :desde')->setParameter('desde', $desde);
        }
        if ($hasta !== null) {
            $qb->andWhere('r.fecha < :hasta')->setParameter('hasta', $hasta);
        }

        return $qb;
    }
}
