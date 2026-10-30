<?php

namespace App\Repository;

use App\Entity\Cliente;
use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Usuario> */
class UsuarioRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Usuario::class);
    }

    /** El email no distingue mayúsculas (collation _ci de la BBDD). */
    public function buscarPorEmail(string $email): ?Usuario
    {
        return $this->findOneBy(['email' => mb_strtolower(trim($email))]);
    }

    public function emailEnUso(string $email, ?int $excepto = null): bool
    {
        $usuario = $this->buscarPorEmail($email);

        return $usuario !== null && $usuario->getId() !== $excepto;
    }

    public function dniEnUso(string $dni, ?int $excepto = null): bool
    {
        $cliente = $this->getEntityManager()->getRepository(Cliente::class)->findOneBy(['dni' => strtoupper($dni)]);

        return $cliente !== null && $cliente->getId() !== $excepto;
    }

    /** Listado del admin: ?tipo=cliente|trabajador, ?activo=0|1 (por defecto, solo activos), ?q=texto */
    public function consultaListado(?string $tipo, bool $activo, ?string $texto): QueryBuilder
    {
        $clase = match ($tipo) {
            'cliente' => Cliente::class,
            'trabajador' => \App\Entity\Trabajador::class,
            default => Usuario::class,
        };
        $qb = $this->getEntityManager()->createQueryBuilder()
            ->select('u')->from($clase, 'u')
            ->where('u.activo = :activo')->setParameter('activo', $activo)
            ->orderBy('u.apellidos', 'ASC')->addOrderBy('u.nombre', 'ASC');
        if ($texto !== null && $texto !== '') {
            $qb->andWhere('u.nombre LIKE :q OR u.apellidos LIKE :q OR u.email LIKE :q')
                ->setParameter('q', '%'.$texto.'%');
        }

        return $qb;
    }

    /** ¿Tiene pedidos o reparaciones? Entonces no se puede borrar (mejor desactivarlo). */
    public function clienteTieneHistorial(Cliente $cliente): bool
    {
        $em = $this->getEntityManager();
        $pedidos = (int) $em->createQuery('SELECT COUNT(p.id) FROM App\Entity\Pedido p WHERE p.cliente = :c')
            ->setParameter('c', $cliente)->getSingleScalarResult();
        $reparaciones = (int) $em->createQuery('SELECT COUNT(r.id) FROM App\Entity\Reparacion r WHERE r.cliente = :c')
            ->setParameter('c', $cliente)->getSingleScalarResult();

        return $pedidos + $reparaciones > 0;
    }
}
