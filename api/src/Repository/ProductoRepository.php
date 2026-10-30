<?php

namespace App\Repository;

use App\Entity\Alquiler;
use App\Entity\Compra;
use App\Entity\Producto;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Producto> */
class ProductoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Producto::class);
    }

    /**
     * Consulta base del catálogo, común a /productos, /videojuegos, /moviles y /consolas.
     *
     * @param class-string<Producto> $clase Producto (todos) o un subtipo
     * @param bool|null $activo true = solo activos (lo normal), false = solo retirados, null = todos
     */
    public function consultaCatalogo(string $clase, ?bool $activo, ?int $marcaId, ?string $texto): QueryBuilder
    {
        $qb = $this->getEntityManager()->createQueryBuilder()
            ->select('p', 'm')->from($clase, 'p')
            ->join('p.marca', 'm')
            ->orderBy('p.nombre', 'ASC');
        if ($activo !== null) {
            $qb->andWhere('p.activo = :activo')->setParameter('activo', $activo);
        }
        if ($marcaId !== null) {
            $qb->andWhere('m.id = :marca')->setParameter('marca', $marcaId);
        }
        if ($texto !== null && $texto !== '') {
            // Con ~35 productos, LIKE basta y gasta menos CPU que un índice FULLTEXT (RNF-04).
            $qb->andWhere('p.nombre LIKE :q OR p.descripcion LIKE :q')->setParameter('q', '%'.$texto.'%');
        }

        return $qb;
    }

    /** ¿Se ha vendido o alquilado alguna vez? Entonces no se borra: se retira con activo = false. */
    public function tieneHistorial(Producto $producto): bool
    {
        $em = $this->getEntityManager();
        $compras = (int) $em->createQuery('SELECT COUNT(c.id) FROM '.Compra::class.' c WHERE c.producto = :p')
            ->setParameter('p', $producto)->getSingleScalarResult();
        $alquileres = (int) $em->createQuery('SELECT COUNT(a.id) FROM '.Alquiler::class.' a WHERE a.videojuego = :p')
            ->setParameter('p', $producto->getId())->getSingleScalarResult();

        return $compras + $alquileres > 0;
    }

    public function marcaTieneProductos(int $marcaId): bool
    {
        return (int) $this->createQueryBuilder('p')->select('COUNT(p.id)')
            ->where('p.marca = :m')->setParameter('m', $marcaId)
            ->getQuery()->getSingleScalarResult() > 0;
    }

    public function plataformaTieneVideojuegos(int $plataformaId): bool
    {
        return (int) $this->getEntityManager()->createQuery(
            'SELECT COUNT(v.id) FROM App\Entity\Videojuego v WHERE v.plataforma = :p'
        )->setParameter('p', $plataformaId)->getSingleScalarResult() > 0;
    }
}
