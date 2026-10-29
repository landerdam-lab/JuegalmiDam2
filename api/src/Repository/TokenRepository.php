<?php

namespace App\Repository;

use App\Entity\Token;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Token> */
class TokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Token::class);
    }

    /** Busca por el hash SHA-256 (en la BBDD nunca está el token en claro). */
    public function buscarPorTokenEnClaro(string $token): ?Token
    {
        return $this->createQueryBuilder('t')
            ->join('t.usuario', 'u')->addSelect('u')
            ->where('t.tokenHash = :hash')->setParameter('hash', hash('sha256', $token))
            ->getQuery()->getOneOrNullResult();
    }

    /** Limpieza: borra los tokens caducados. Devuelve cuántos se han borrado. */
    public function borrarCaducados(\DateTimeImmutable $ahora): int
    {
        return $this->createQueryBuilder('t')
            ->delete()
            ->where('t.fechaExpira <= :ahora')->setParameter('ahora', $ahora)
            ->getQuery()->execute();
    }
}
