<?php

namespace App\Service;

use App\Entity\Consola;
use App\Entity\Marca;
use App\Entity\Movil;
use App\Entity\Plataforma;
use App\Entity\Producto;
use App\Entity\Videojuego;
use App\Enum\FormatoMovil;
use App\Http\ApiException;
use App\Http\Datos;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Alta y modificación de productos desde el backoffice (solo admin).
 * Rellena los campos comunes de `producto` y los del subtipo; en un PUT solo cambia lo que viene.
 */
final class ProductoService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly Imagenes $imagenes,
        private readonly Validacion $validacion,
    ) {
    }

    /** @param class-string<Producto> $clase Videojuego, Movil o Consola */
    public function crear(string $clase, Datos $datos): Producto
    {
        $producto = new $clase();
        $this->rellenar($producto, $datos, true);

        return $producto;
    }

    public function actualizar(Producto $producto, Datos $datos): void
    {
        $this->rellenar($producto, $datos, false);
    }

    private function rellenar(Producto $p, Datos $d, bool $crear): void
    {
        // Comunes
        if ($crear || $d->tiene('nombre')) {
            $p->setNombre($d->texto('nombre'));
        }
        if ($crear || $d->tiene('descripcion')) {
            $p->setDescripcion($d->texto('descripcion'));
        }
        if ($crear || $d->tiene('precio')) {
            $p->setPrecio($d->decimal('precio'));
        }
        if ($d->tiene('stock')) {
            $p->setStock($d->entero('stock', true));
        }
        if ($crear || $d->tiene('imagen')) {
            $p->setImagen($this->imagenes->aRuta($d->texto('imagen'), 'imagen'));
        }
        if ($d->tiene('activo')) {
            $p->setActivo($d->booleano('activo', true));
        }
        if ($crear || $d->tiene('marcaId')) {
            $p->setMarca($this->buscar(Marca::class, $d->entero('marcaId', true), 'marcaId', 'Esa marca no existe.'));
        }

        // Propios de cada subtipo
        if ($p instanceof Videojuego) {
            if ($crear || $d->tiene('genero')) {
                $p->setGenero($d->texto('genero'));
            }
            if ($crear || $d->tiene('pegi')) {
                $p->setPegi($d->entero('pegi'));
            }
            if ($crear || $d->tiene('precioAlquiler')) {
                $p->setPrecioAlquiler($d->decimal('precioAlquiler'));
            }
            if ($d->tiene('copiasAlquiler')) {
                $p->setCopiasAlquiler($d->entero('copiasAlquiler', true));
            }
            if ($crear || $d->tiene('plataformaId')) {
                $p->setPlataforma($this->buscar(Plataforma::class, $d->entero('plataformaId', true), 'plataformaId', 'Esa plataforma no existe.'));
            }
        } elseif ($p instanceof Movil) {
            if ($crear || $d->tiene('formato')) {
                $p->setFormato($d->enum('formato', FormatoMovil::class));
            }
            if ($crear || $d->tiene('pantallaPulgadas')) {
                $p->setPantallaPulgadas($d->decimal('pantallaPulgadas', false, 1));
            }
            if ($crear || $d->tiene('ramGb')) {
                $p->setRamGb($d->entero('ramGb'));
            }
            if ($crear || $d->tiene('almacenamientoGb')) {
                $p->setAlmacenamientoGb($d->entero('almacenamientoGb'));
            }
        } elseif ($p instanceof Consola) {
            if ($crear || $d->tiene('modelo')) {
                $p->setModelo($d->texto('modelo'));
            }
            if ($crear || $d->tiene('almacenamientoGb')) {
                $p->setAlmacenamientoGb($d->entero('almacenamientoGb'));
            }
        }

        $this->validacion->validar($p);
        $this->em->persist($p);
        $this->em->flush();
    }

    /**
     * @template T of object
     *
     * @param class-string<T> $clase
     *
     * @return T
     */
    private function buscar(string $clase, int $id, string $campo, string $mensaje): object
    {
        return $this->em->find($clase, $id) ?? throw ApiException::validacion([$campo => $mensaje]);
    }
}
