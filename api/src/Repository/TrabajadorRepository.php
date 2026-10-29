<?php

namespace App\Repository;

use App\Entity\Departamento;
use App\Entity\Trabajador;
use App\Enum\EstadoReparacion;
use App\Enum\Puesto;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Trabajador> */
class TrabajadorRepository extends ServiceEntityRepository
{
    private const ESTADOS_CERRADOS = [EstadoReparacion::Entregada, EstadoReparacion::Cancelada];

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Trabajador::class);
    }

    public function consultaListado(?Puesto $puesto, ?int $departamentoId, bool $activo): QueryBuilder
    {
        $qb = $this->createQueryBuilder('t')
            ->leftJoin('t.departamento', 'd')->addSelect('d')
            ->where('t.activo = :activo')->setParameter('activo', $activo)
            ->orderBy('t.apellidos', 'ASC');
        if ($puesto !== null) {
            $qb->andWhere('t.puesto = :puesto')->setParameter('puesto', $puesto);
        }
        if ($departamentoId !== null) {
            $qb->andWhere('d.id = :dep')->setParameter('dep', $departamentoId);
        }

        return $qb;
    }

    /**
     * Regla de negocio: la reparación nueva se asigna al técnico activo del departamento
     * con MENOS reparaciones abiertas (en empate, el de id más bajo).
     */
    public function tecnicoConMenosCarga(Departamento $departamento): ?Trabajador
    {
        $fila = $this->getEntityManager()->createQuery(
            'SELECT t AS tecnico, COUNT(r.id) AS abiertas
             FROM App\Entity\Trabajador t
             LEFT JOIN App\Entity\Reparacion r WITH r.tecnico = t AND r.estado NOT IN (:cerrados)
             WHERE t.puesto = :tecnico AND t.departamento = :dep AND t.activo = true
             GROUP BY t.id
             ORDER BY abiertas ASC, t.id ASC'
        )
            ->setParameter('cerrados', self::ESTADOS_CERRADOS)
            ->setParameter('tecnico', Puesto::Tecnico)
            ->setParameter('dep', $departamento)
            ->setMaxResults(1)
            ->getOneOrNullResult();

        return $fila['tecnico'] ?? null;
    }

    /**
     * Reparaciones abiertas de cada técnico, en una sola consulta.
     *
     * @param int[] $ids
     *
     * @return array<int, int> id del técnico => número de reparaciones abiertas
     */
    public function reparacionesAbiertas(array $ids): array
    {
        if ($ids === []) {
            return [];
        }
        $filas = $this->getEntityManager()->createQuery(
            'SELECT IDENTITY(r.tecnico) AS id, COUNT(r.id) AS n FROM App\Entity\Reparacion r
             WHERE r.tecnico IN (:ids) AND r.estado NOT IN (:cerrados) GROUP BY r.tecnico'
        )->setParameter('ids', $ids)->setParameter('cerrados', self::ESTADOS_CERRADOS)->getArrayResult();

        $resultado = array_fill_keys($ids, 0);
        foreach ($filas as $fila) {
            $resultado[(int) $fila['id']] = (int) $fila['n'];
        }

        return $resultado;
    }

    public function tieneReparaciones(Trabajador $trabajador, bool $soloAbiertas = false): bool
    {
        $dql = 'SELECT COUNT(r.id) FROM App\Entity\Reparacion r WHERE r.tecnico = :t';
        if ($soloAbiertas) {
            $dql .= ' AND r.estado NOT IN (:cerrados)';
        }
        $query = $this->getEntityManager()->createQuery($dql)->setParameter('t', $trabajador);
        if ($soloAbiertas) {
            $query->setParameter('cerrados', self::ESTADOS_CERRADOS);
        }

        return (int) $query->getSingleScalarResult() > 0;
    }
}
