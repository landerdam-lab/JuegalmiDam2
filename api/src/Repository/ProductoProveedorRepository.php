<?php

namespace App\Repository;

use App\Entity\Producto;
use App\Entity\ProductoProveedor;
use App\Entity\Proveedor;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<ProductoProveedor> */
class ProductoProveedorRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ProductoProveedor::class);
    }

    /** @return list<ProductoProveedor> Proveedores de un producto, el más barato primero. */
    public function deProducto(Producto $producto): array
    {
        return $this->createQueryBuilder('pp')
            ->addSelect('pr')->join('pp.proveedor', 'pr')
            ->where('pp.producto = :p')->setParameter('p', $producto)
            ->orderBy('pp.precioCoste', 'ASC')->addOrderBy('pr.nombre', 'ASC')
            ->getQuery()->getResult();
    }

    /** @return list<ProductoProveedor> Productos que sirve un proveedor, por nombre. */
    public function deProveedor(Proveedor $proveedor): array
    {
        return $this->createQueryBuilder('pp')
            ->addSelect('p')->join('pp.producto', 'p')
            ->where('pp.proveedor = :pr')->setParameter('pr', $proveedor)
            ->orderBy('p.nombre', 'ASC')
            ->getQuery()->getResult();
    }

    /** Número de productos de cada proveedor, en UNA consulta: [proveedorId => n]. */
    public function contarPorProveedor(): array
    {
        $filas = $this->createQueryBuilder('pp')
            ->select('IDENTITY(pp.proveedor) AS proveedor', 'COUNT(pp.id) AS n')
            ->groupBy('pp.proveedor')
            ->getQuery()->getArrayResult();

        return array_column(array_map(fn ($f) => ['id' => (int) $f['proveedor'], 'n' => (int) $f['n']], $filas), 'n', 'id');
    }
}
