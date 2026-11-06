<?php

namespace App\Controller\Api;

use App\Entity\Producto;
use App\Entity\ProductoProveedor;
use App\Entity\Proveedor;
use App\Http\ApiException;
use App\Repository\ProductoProveedorRepository;
use App\Service\Presentador;
use App\Service\Validacion;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Proveedores y qué productos sirve cada uno, con su precio de coste (ADR-042).
 * TODO es solo para el admin, también la lectura: el precio de coste es un dato interno.
 * Por eso el JSON de /api/productos no cambia y las apps de clientes no se enteran.
 *
 * /api/proveedores                                 CRUD del proveedor
 * /api/productos/{id}/proveedores                  proveedores de un producto
 * /api/productos/{id}/proveedores/{proveedorId}    PUT {precioCoste} lo añade o lo cambia · DELETE lo quita
 */
#[Route('/api')]
#[IsGranted('ROLE_ADMIN')]
final class ProveedorController extends ApiController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ProductoProveedorRepository $relaciones,
        private readonly Validacion $validacion,
        private readonly Presentador $presentador,
    ) {
    }

    /** Lista corta (decenas), así que entera y sin paginar, con cuántos productos sirve cada uno. */
    #[Route('/proveedores', methods: ['GET'])]
    public function listar(): JsonResponse
    {
        $numProductos = $this->relaciones->contarPorProveedor();
        $todos = $this->em->getRepository(Proveedor::class)->findBy([], ['nombre' => 'ASC']);

        return $this->respuesta(array_map(
            fn (Proveedor $p) => $this->presentador->proveedor($p, $numProductos[$p->getId()] ?? 0),
            $todos,
        ));
    }

    /** El proveedor y los productos que sirve, con su precio de coste. */
    #[Route('/proveedores/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function ver(int $id): JsonResponse
    {
        $proveedor = $this->buscarProveedor($id);
        $productos = $this->relaciones->deProveedor($proveedor);

        return $this->respuesta($this->presentador->proveedor($proveedor, count($productos)) + [
            'productos' => array_map(fn (ProductoProveedor $pp) => $this->presentador->productoProveedor($pp, true), $productos),
        ]);
    }

    /** {nombre, cif, telefono, email, direccion?} → 201 */
    #[Route('/proveedores', methods: ['POST'])]
    public function crear(Request $request): JsonResponse
    {
        return $this->guardar(new Proveedor(), $request, Response::HTTP_CREATED);
    }

    /** PUT parcial, como en los productos: solo cambia los campos enviados. */
    #[Route('/proveedores/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function editar(Request $request, int $id): JsonResponse
    {
        return $this->guardar($this->buscarProveedor($id), $request, Response::HTTP_OK);
    }

    /** 409 EN_USO si sirve algún producto: antes hay que quitárselo (la FK es RESTRICT). */
    #[Route('/proveedores/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function borrar(int $id): Response
    {
        $proveedor = $this->buscarProveedor($id);
        if ($this->relaciones->count(['proveedor' => $proveedor]) > 0) {
            throw ApiException::conflicto('EN_USO', 'No se puede borrar: este proveedor sirve productos. Quítaselos antes.');
        }
        $this->em->remove($proveedor);
        $this->em->flush();

        return $this->sinContenido();
    }

    // Proveedores de un producto ---------------------------------------------------------

    #[Route('/productos/{id}/proveedores', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function deProducto(int $id): JsonResponse
    {
        $producto = $this->buscarProducto($id);

        return $this->respuesta(array_map(
            fn (ProductoProveedor $pp) => $this->presentador->productoProveedor($pp, false),
            $this->relaciones->deProducto($producto),
        ));
    }

    /**
     * {precioCoste} → 201 si el proveedor no servía el producto, 200 si solo cambia el precio.
     * PUT porque la URL ya identifica la pareja: repetir la petición deja lo mismo (idempotente).
     */
    #[Route('/productos/{id}/proveedores/{proveedorId}', requirements: ['id' => '\d+', 'proveedorId' => '\d+'], methods: ['PUT'])]
    public function asignar(Request $request, int $id, int $proveedorId): JsonResponse
    {
        $producto = $this->buscarProducto($id);
        $proveedor = $this->buscarProveedor($proveedorId);

        $relacion = $this->relaciones->findOneBy(['producto' => $producto, 'proveedor' => $proveedor]);
        $nueva = $relacion === null;
        $relacion ??= new ProductoProveedor($producto, $proveedor);
        $relacion->setPrecioCoste($this->datos($request)->decimal('precioCoste', true));
        $this->validacion->validar($relacion);
        $this->em->persist($relacion);
        $this->em->flush();

        return $this->respuesta($this->presentador->productoProveedor($relacion, false), $nueva ? Response::HTTP_CREATED : Response::HTTP_OK);
    }

    #[Route('/productos/{id}/proveedores/{proveedorId}', requirements: ['id' => '\d+', 'proveedorId' => '\d+'], methods: ['DELETE'])]
    public function quitar(int $id, int $proveedorId): Response
    {
        $relacion = $this->relaciones->findOneBy([
            'producto' => $this->buscarProducto($id),
            'proveedor' => $this->buscarProveedor($proveedorId),
        ]);
        $this->em->remove($this->existe($relacion, 'Ese proveedor no sirve este producto.'));
        $this->em->flush();

        return $this->sinContenido();
    }

    // ---------------------------------------------------------------------------------

    private function buscarProveedor(int $id): Proveedor
    {
        return $this->existe($this->em->find(Proveedor::class, $id), 'Ese proveedor no existe.');
    }

    /** También los retirados (activo = 0): el admin puede consultar a quién se compraban. */
    private function buscarProducto(int $id): Producto
    {
        return $this->existe($this->em->find(Producto::class, $id), 'Ese producto no existe.');
    }

    private function guardar(Proveedor $proveedor, Request $request, int $estado): JsonResponse
    {
        $datos = $this->datos($request);
        $nuevo = $proveedor->getId() === null;
        // En el alta todo es obligatorio salvo la dirección; al editar, solo se cambia lo enviado.
        foreach (['nombre' => 'setNombre', 'cif' => 'setCif', 'telefono' => 'setTelefono', 'email' => 'setEmail'] as $campo => $setter) {
            if ($nuevo || $datos->tiene($campo)) {
                $proveedor->$setter($datos->texto($campo));
            }
        }
        if ($datos->tiene('direccion')) {
            $proveedor->setDireccion($datos->texto('direccion'));
        }
        $this->validacion->validar($proveedor);
        $this->em->persist($proveedor);
        $this->em->flush();

        return $this->respuesta($this->presentador->proveedor($proveedor, $this->relaciones->count(['proveedor' => $proveedor])), $estado);
    }
}
