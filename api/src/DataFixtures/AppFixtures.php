<?php

namespace App\DataFixtures;

use App\Entity\Alquiler;
use App\Entity\Cliente;
use App\Entity\Compra;
use App\Entity\Consola;
use App\Entity\Departamento;
use App\Entity\FotoTienda;
use App\Entity\Marca;
use App\Entity\Movil;
use App\Entity\Pedido;
use App\Entity\Plataforma;
use App\Entity\ProductoProveedor;
use App\Entity\Proveedor;
use App\Entity\Reparacion;
use App\Entity\Servicio;
use App\Entity\Tienda;
use App\Entity\Trabajador;
use App\Entity\Videojuego;
use App\Enum\EstadoPedido;
use App\Enum\EstadoReparacion;
use App\Enum\FormatoMovil;
use App\Enum\LineaServicio;
use App\Enum\MetodoPago;
use App\Enum\Puesto;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Datos de ejemplo (requisito innegociable RF-12): php bin/console doctrine:fixtures:load
 *
 * Todos los usuarios de demo tienen la contraseña "demo1234" (inventada, solo para la demo).
 * Las fechas se calculan desde HOY, para que siempre haya alquileres activos, devueltos y retrasados.
 * Cumplen los CHECK y triggers de la BBDD: si un dato estuviera mal, la carga fallaría.
 */
final class AppFixtures extends Fixture
{
    public const PASSWORD_DEMO = 'demo1234';
    private const IMG = 'uploads/ejemplo/';

    public function __construct(private readonly UserPasswordHasherInterface $hasher)
    {
    }

    public function load(ObjectManager $om): void
    {
        $hoy = new \DateTimeImmutable('today');

        // 1) Catálogos ---------------------------------------------------------------
        $dep = [];
        foreach (['Telefonía', 'Consolas'] as $nombre) {
            $om->persist($dep[$nombre] = new Departamento($nombre));
        }

        $marca = [];
        // "Nokia" no tiene productos: sirve para probar que una marca sin productos sí se puede borrar
        foreach (['Sony', 'Microsoft', 'Nintendo', 'Apple', 'Samsung', 'Xiaomi', 'Ubisoft', 'EA', 'Capcom', 'Square Enix', 'Bandai Namco', 'Sega', 'Google', 'Valve', 'Nokia'] as $nombre) {
            $om->persist($marca[$nombre] = (new Marca())->setNombre($nombre));
        }

        $plat = [];
        foreach (['PS5', 'Xbox Series', 'Switch 2', 'PC', 'PS4'] as $nombre) {
            $om->persist($plat[$nombre] = (new Plataforma())->setNombre($nombre));
        }

        $servicios = [
            // linea, nombre, descripción, precio orientativo (null = consultar)
            ['videojuegos', 'Compra de juegos de segunda mano', 'Te damos dinero o saldo por tus juegos en buen estado.', null],
            ['videojuegos', 'Pulido de discos rayados', 'Recuperamos discos con arañazos para que vuelvan a funcionar.', '5.00'],
            ['videojuegos', 'Reserva de lanzamientos', 'Reserva el juego y recógelo el día de salida.', '0.00'],
            ['videojuegos', 'Instalación de juegos de PC', 'Instalamos y configuramos tus juegos y lanzadores.', '15.00'],
            ['consolas', 'Limpieza y pasta térmica', 'Limpieza interna y cambio de pasta térmica para que no se caliente.', '35.00'],
            ['consolas', 'Reparación de drift en mandos', 'Cambio de joysticks que se mueven solos.', '25.00'],
            ['consolas', 'Cambio de lector de discos', 'Sustitución del lector cuando no lee los juegos.', '60.00'],
            ['consolas', 'Reparación de puerto HDMI', 'Soldadura o cambio del puerto HDMI dañado.', null],
            ['telefonia', 'Cambio de pantalla', 'Pantallas rotas o con manchas, con garantía.', '79.00'],
            ['telefonia', 'Cambio de batería', 'Batería nueva cuando ya no dura el día.', '49.00'],
            ['telefonia', 'Reparación del conector de carga', 'Cuando el móvil o la tablet no cargan bien.', '39.00'],
            ['telefonia', 'Recuperación de datos', 'Intentamos recuperar fotos y contactos de dispositivos dañados.', null],
            ['videojuegos', 'Torneos en la tienda', 'Torneos mensuales de Mario Kart, FC y Smash con premios.', '5.00'],
            ['videojuegos', 'Copia de seguridad de partidas', 'Pasamos tus partidas guardadas a una consola nueva.', '10.00'],
            ['consolas', 'Mantenimiento preventivo', 'Revisión completa, limpieza y prueba de mandos.', '29.00'],
            ['consolas', 'Instalación de SSD', 'Ampliamos el almacenamiento de PS5 o Steam Deck.', '20.00'],
            ['telefonia', 'Protector de pantalla y funda', 'Colocamos el protector de cristal sin burbujas.', '9.00'],
            ['telefonia', 'Paso de datos al móvil nuevo', 'Contactos, fotos y apps de tu móvil viejo al nuevo.', '15.00'],
        ];
        foreach ($servicios as [$linea, $nombre, $descripcion, $precio]) {
            $om->persist((new Servicio())->setLinea(LineaServicio::from($linea))->setNombre($nombre)
                ->setDescripcion($descripcion)->setPrecioOrientativo($precio));
        }

        // 2) Usuarios (contraseña de demo: demo1234) -----------------------------------
        $admin = $this->trabajador('admin@juegalmi.test', 'Miren', 'Agirre Etxebarria', '944000001', Puesto::Admin, null);
        $tecTel1 = $this->trabajador('tecnico.telefonia1@juegalmi.test', 'Jon', 'Etxeberria Urrutia', '944000002', Puesto::Tecnico, $dep['Telefonía']);
        $tecTel2 = $this->trabajador('tecnico.telefonia2@juegalmi.test', 'Leire', 'Zubiri Arana', '944000003', Puesto::Tecnico, $dep['Telefonía']);
        $tecCon1 = $this->trabajador('tecnico.consolas1@juegalmi.test', 'Iker', 'Larrañaga Ibarra', '944000004', Puesto::Tecnico, $dep['Consolas']);
        $tecCon2 = $this->trabajador('tecnico.consolas2@juegalmi.test', 'Nerea', 'Goikoetxea Lasa', '944000005', Puesto::Tecnico, $dep['Consolas']);

        $c1 = $this->cliente('cliente1@juegalmi.test', 'Ane', 'Etxeberria Gómez', '600111222', '12345678Z');
        $c2 = $this->cliente('cliente2@juegalmi.test', 'Mikel', 'Urrutia Sanz', '600333444', '45678912S');
        $c3 = $this->cliente('cliente3@juegalmi.test', 'Laura', 'Martín Silva', '600555666', 'X1234567L'); // con NIE
        $c4 = $this->cliente('cliente4@juegalmi.test', 'Pablo', 'Ruiz Ortega', '600777888', '72345611P');
        $c4->setActivo(false); // desactivado: no puede iniciar sesión (ADR-025)
        foreach ([$admin, $tecTel1, $tecTel2, $tecCon1, $tecCon2, $c1, $c2, $c3, $c4] as $u) {
            $om->persist($u);
        }

        // 3) Productos ---------------------------------------------------------------------
        $juegos = [
            // clave => [nombre, marca, plataforma, género, PEGI, precio, stock, €/día, copias alquiler]
            'fc26' => ['EA Sports FC 26', 'EA', 'PS5', 'Deportes', 3, '69.99', 8, '2.50', 4],
            'gt7' => ['Gran Turismo 7', 'Sony', 'PS5', 'Conducción', 3, '49.99', 5, '2.00', 2],
            'gow' => ['God of War Ragnarök', 'Sony', 'PS5', 'Acción', 18, '59.99', 3, '2.50', 2],
            'spider' => ['Marvel\'s Spider-Man 2', 'Sony', 'PS5', 'Acción', 16, '69.99', 4, '2.50', 2],
            'halo' => ['Halo Infinite', 'Microsoft', 'Xbox Series', 'Disparos', 16, '39.99', 6, '1.50', 2],
            'forza' => ['Forza Horizon 5', 'Microsoft', 'Xbox Series', 'Conducción', 3, '49.99', 4, '2.00', 2],
            'mario' => ['Mario Kart World', 'Nintendo', 'Switch 2', 'Conducción', 3, '79.99', 10, '3.00', 3],
            'zelda' => ['The Legend of Zelda: Tears of the Kingdom', 'Nintendo', 'Switch 2', 'Aventura', 12, '69.99', 5, '2.50', 2],
            'donkey' => ['Donkey Kong Bananza', 'Nintendo', 'Switch 2', 'Plataformas', 7, '69.99', 0, '2.50', 1], // agotado a la venta
            'acshadows' => ['Assassin\'s Creed Shadows', 'Ubisoft', 'PS5', 'Aventura', 18, '59.99', 4, '2.50', 2],
            'justdance' => ['Just Dance 2026', 'Ubisoft', 'Switch 2', 'Música', 3, '39.99', 7, '1.50', 2],
            're4' => ['Resident Evil 4', 'Capcom', 'PS5', 'Terror', 18, '39.99', 3, '2.00', 2],
            'mhwilds' => ['Monster Hunter Wilds', 'Capcom', 'PC', 'Acción', 16, '69.99', 2, '2.50', 1],
            'sims' => ['Los Sims 4: Edición Deluxe', 'EA', 'PC', 'Simulación', 12, '29.99', 5, '1.00', 0], // no se alquila
            'tlou' => ['The Last of Us Parte II', 'Sony', 'PS4', 'Aventura', 18, '19.99', 6, '1.00', 2],
            // Ampliación del catálogo (2026-10-30): más contenido y filtros con resultados
            'ff7rebirth' => ['Final Fantasy VII Rebirth', 'Square Enix', 'PS5', 'Rol', 16, '59.99', 4, '2.50', 2],
            'eldenring' => ['Elden Ring Nightreign', 'Bandai Namco', 'PS5', 'Rol', 16, '39.99', 5, '2.00', 2],
            'tekken8' => ['Tekken 8', 'Bandai Namco', 'PS5', 'Lucha', 12, '49.99', 3, '2.00', 1],
            'astrobot' => ['Astro Bot', 'Sony', 'PS5', 'Plataformas', 7, '59.99', 5, '2.50', 2],
            'f125' => ['F1 25', 'EA', 'PS5', 'Conducción', 3, '59.99', 4, '2.00', 2],
            'codbo7' => ['Call of Duty: Black Ops 7', 'Microsoft', 'Xbox Series', 'Disparos', 18, '79.99', 6, '3.00', 3],
            'starfield' => ['Starfield', 'Microsoft', 'PC', 'Rol', 16, '29.99', 2, '1.50', 1],
            'sonic' => ['Sonic X Shadow Generations', 'Sega', 'Switch 2', 'Plataformas', 7, '49.99', 6, '2.00', 2],
            'metroid' => ['Metroid Prime 4: Beyond', 'Nintendo', 'Switch 2', 'Aventura', 12, '69.99', 4, '2.50', 2],
            'pokemon' => ['Pokémon Leyendas Z-A', 'Nintendo', 'Switch 2', 'Rol', 7, '69.99', 9, '3.00', 3],
            'minecraft' => ['Minecraft', 'Microsoft', 'Switch 2', 'Aventura', 7, '29.99', 10, '1.00', 0],
        ];
        $v = [];
        foreach ($juegos as $clave => [$nombre, $m, $p, $genero, $pegi, $precio, $stock, $precioAlquiler, $copias]) {
            $v[$clave] = (new Videojuego())->setGenero($genero)->setPegi($pegi)->setPrecioAlquiler($precioAlquiler)
                ->setCopiasAlquiler($copias)->setPlataforma($plat[$p]);
            $this->producto($v[$clave], $nombre, $marca[$m], $precio, $stock, 'productos/'.$clave.'.jpg',
                sprintf('%s para %s. Género: %s. PEGI %d.', $nombre, $p, mb_strtolower($genero), $pegi));
            $om->persist($v[$clave]);
        }

        $moviles = [
            // clave => [nombre, marca, formato, pulgadas, RAM, almacenamiento, precio, stock]
            'iphone17' => ['iPhone 17', 'Apple', 'movil', '6.3', 8, 256, '959.00', 6],
            'iphone16e' => ['iPhone 16e', 'Apple', 'movil', '6.1', 8, 128, '699.00', 4],
            'galaxys25' => ['Samsung Galaxy S25', 'Samsung', 'movil', '6.2', 12, 256, '899.00', 5],
            'galaxya56' => ['Samsung Galaxy A56', 'Samsung', 'movil', '6.7', 8, 128, '449.00', 0], // agotado
            'redmi15' => ['Xiaomi Redmi Note 15 Pro', 'Xiaomi', 'movil', '6.7', 8, 256, '349.00', 8],
            'xiaomi15' => ['Xiaomi 15', 'Xiaomi', 'movil', '6.4', 12, 512, '899.00', 3],
            'ipadair' => ['iPad Air 11"', 'Apple', 'tablet', '11.0', 8, 128, '699.00', 4],
            'ipad' => ['iPad 11ª generación', 'Apple', 'tablet', '10.9', 6, 128, '399.00', 5],
            'tabs10' => ['Samsung Galaxy Tab S10', 'Samsung', 'tablet', '11.0', 12, 256, '849.00', 2],
            'pad7' => ['Xiaomi Pad 7', 'Xiaomi', 'tablet', '11.2', 8, 256, '399.00', 6],
            'iphone17pro' => ['iPhone 17 Pro', 'Apple', 'movil', '6.3', 12, 256, '1319.00', 3],
            'pixel10' => ['Google Pixel 10', 'Google', 'movil', '6.3', 12, 128, '799.00', 4],
            'galaxyzflip7' => ['Samsung Galaxy Z Flip7', 'Samsung', 'movil', '6.9', 12, 256, '1199.00', 2],
            'pixeltablet' => ['Google Pixel Tablet', 'Google', 'tablet', '10.95', 8, 128, '499.00', 3],
            'taba9' => ['Samsung Galaxy Tab A9+', 'Samsung', 'tablet', '11.0', 4, 64, '219.00', 8],
        ];
        $mv = [];
        foreach ($moviles as $clave => [$nombre, $m, $formato, $pulgadas, $ram, $gb, $precio, $stock]) {
            $mv[$clave] = (new Movil())->setFormato(FormatoMovil::from($formato))->setPantallaPulgadas($pulgadas)
                ->setRamGb($ram)->setAlmacenamientoGb($gb);
            $this->producto($mv[$clave], $nombre, $marca[$m], $precio, $stock, 'productos/'.$clave.'.jpg',
                sprintf('%s de %s pulgadas, %d GB de RAM y %d GB de almacenamiento.', $formato === 'tablet' ? 'Tablet' : 'Móvil', $pulgadas, $ram, $gb));
            $om->persist($mv[$clave]);
        }

        $consolas = [
            // clave => [nombre, marca, modelo, almacenamiento, precio, stock, activo]
            'ps5' => ['PlayStation 5 Slim', 'Sony', 'CFI-2016', 1000, '499.99', 4, true],
            'ps5pro' => ['PlayStation 5 Pro', 'Sony', 'CFI-7016', 2000, '799.99', 2, true],
            'xboxx' => ['Xbox Series X', 'Microsoft', 'Series X', 1000, '549.99', 3, true],
            'switch2' => ['Nintendo Switch 2', 'Nintendo', 'BEE-001', 256, '469.99', 6, true],
            'ps5digital' => ['PlayStation 5 Digital', 'Sony', 'CFI-2016 B', 1000, '449.99', 3, true],
            'switch2pack' => ['Nintendo Switch 2 + Mario Kart World', 'Nintendo', 'BEE-001', 256, '509.99', 3, true],
            'steamdeck' => ['Steam Deck OLED', 'Valve', '1030', 512, '569.00', 2, true],
            'xboxs' => ['Xbox Series S', 'Microsoft', 'Series S', 512, '299.99', 0, false], // retirada: no sale en el catálogo
        ];
        $con = [];
        foreach ($consolas as $clave => [$nombre, $m, $modelo, $gb, $precio, $stock, $activo]) {
            $con[$clave] = (new Consola())->setModelo($modelo)->setAlmacenamientoGb($gb);
            $this->producto($con[$clave], $nombre, $marca[$m], $precio, $stock, 'productos/'.$clave.'.jpg',
                sprintf('Consola %s con %d GB de almacenamiento.', $nombre, $gb));
            $con[$clave]->setActivo($activo);
            $om->persist($con[$clave]);
        }

        // 3b) Proveedores y precio de coste (ADR-042). Empresas y CIF inventados -----------------------
        $prov = [];
        $proveedores = [
            // clave => [nombre, CIF, teléfono, email, dirección]
            'juegos' => ['Distribuciones Gamer Norte S.L.', 'B95123456', '944100200', 'pedidos@gamernorte.test', 'Polígono Ugaldeguren III, 48170 Zamudio (Bizkaia)'],
            'iberia' => ['Consolas y Accesorios Iberia S.A.', 'A28765432', '913200400', 'compras@consolasiberia.test', 'Calle de la Electrónica 12, 28914 Leganés (Madrid)'],
            'tele' => ['Telecom Suministros Bizkaia S.L.', 'B48987654', '944300500', 'ventas@telecombizkaia.test', 'Avenida Zugazarte 40, 48930 Getxo (Bizkaia)'],
            // Sin productos: sirve para probar que un proveedor sin productos sí se puede borrar
            'retro' => ['Retro Import S.L.', 'B20111222', '943400600', 'info@retroimport.test', null],
        ];
        foreach ($proveedores as $clave => [$nombre, $cif, $telefono, $email, $direccion]) {
            $om->persist($prov[$clave] = (new Proveedor())->setNombre($nombre)->setCif($cif)
                ->setTelefono($telefono)->setEmail($email)->setDireccion($direccion));
        }
        // Precio de coste = un % del precio de venta. Algunos productos tienen dos proveedores (N:M)
        // con precios distintos: así se ve para qué sirve la relación.
        $coste = function ($producto, string $clave, float $porcentaje) use ($om, $prov): void {
            $om->persist((new ProductoProveedor($producto, $prov[$clave]))
                ->setPrecioCoste(number_format(round((float) $producto->getPrecio() * $porcentaje, 2), 2, '.', '')));
        };
        foreach ($v as $clave => $juego) {
            $coste($juego, 'juegos', 0.70);
            if (in_array($clave, ['fc26', 'mario', 'zelda', 'pokemon', 'codbo7'], true)) {
                $coste($juego, 'iberia', 0.68); // los más vendidos, también a Iberia y algo más baratos
            }
        }
        foreach ($mv as $clave => $movil) {
            $coste($movil, 'tele', 0.80);
            if (str_starts_with($clave, 'iphone')) {
                $coste($movil, 'iberia', 0.82);
            }
        }
        foreach ($con as $consola) {
            $coste($consola, 'iberia', 0.82);
            $coste($consola, 'juegos', 0.85);
        }

        // 4) Tienda y galería -------------------------------------------------------------------
        $tienda = (new Tienda())->setNombre('JuegAlmi Bilbao')
            ->setDireccion('Calle Ercilla 24, 48011 Bilbao (Bizkaia)')
            ->setLatitud('43.2627100')->setLongitud('-2.9348900')
            ->setHistoria("JuegAlmi nació en 2009 como una pequeña tienda de videojuegos de segunda mano en el centro de Bilbao.\n\n"
                ."Con los años empezamos a alquilar juegos, a vender consolas y a reparar los mandos y las consolas de nuestros clientes. "
                ."En 2018 abrimos el departamento de telefonía para vender y reparar móviles y tablets.\n\n"
                ."Hoy seguimos siendo una tienda de barrio: te asesoramos, probamos contigo los juegos y reparamos tus dispositivos con garantía.");
        $om->persist($tienda);
        $fotos = [
            'fachada' => 'Fachada de la tienda en la calle Ercilla',
            'mostrador' => 'Mostrador y zona de recogida de pedidos',
            'novedades' => 'Estantería de novedades',
            'retro' => 'Rincón retro con consolas clásicas',
            'taller-consolas' => 'Taller de reparación de consolas',
            'taller-moviles' => 'Taller de reparación de móviles',
            'zona-pruebas' => 'Zona para probar juegos',
            'evento' => 'Torneo de Mario Kart con clientes',
        ];
        foreach ($fotos as $clave => $descripcion) {
            $om->persist((new FotoTienda())->setTienda($tienda)->setImagen(self::IMG.'tienda/'.$clave.'.jpg')->setDescripcion($descripcion));
        }

        // 5) Pedidos: los 4 estados, compras y alquileres ------------------------------------------
        // Pedido 1 (entregado, hace 20 días): compra un móvil + alquiler de 7 días ya DEVUELTO
        $p1 = $this->pedido($c1, MetodoPago::Tarjeta, $hoy->modify('-20 days 10:30'), EstadoPedido::Entregado);
        $this->compra($p1, $mv['redmi15'], 1);
        $this->alquiler($p1, $v['fc26'], 7)->setFechaDevolucion($hoy->modify('-14 days'));
        // Pedido 2 (entregado, hace 12 días): alquiler de 7 días SIN devolver → RETRASADO
        $p2 = $this->pedido($c1, MetodoPago::Bizum, $hoy->modify('-12 days 17:05'), EstadoPedido::Entregado);
        $this->alquiler($p2, $v['gow'], 7);
        // Pedido 3 (preparado, hace 2 días): compra + alquiler ACTIVO, con envío a domicilio (ADR-038)
        $p3 = $this->pedido($c2, MetodoPago::Paypal, $hoy->modify('-2 days 12:00'), EstadoPedido::Preparado)
            ->enviarA('Calle Autonomía 10, 3.º B, 48012 Bilbao', '43.2581000', '-2.9380000');
        $this->compra($p3, $v['mario'], 1);
        $this->alquiler($p3, $v['zelda'], 7);
        // Pedidos 4 y 5: las 2 copias de "Gran Turismo 7" alquiladas → 0 disponibles
        $p4 = $this->pedido($c2, MetodoPago::Tarjeta, $hoy->modify('-1 day 18:40'), EstadoPedido::Entregado);
        $this->alquiler($p4, $v['gt7'], 7);
        $p5 = $this->pedido($c3, MetodoPago::EnTienda, $hoy->modify('-1 day 19:10'), EstadoPedido::Pendiente);
        $this->alquiler($p5, $v['gt7'], 3);
        $this->compra($p5, $con['switch2'], 1);
        // Pedido 6 (CANCELADO): su alquiler de "Halo" no ocupa copia (ADR-034)
        $p6 = $this->pedido($c3, MetodoPago::Tarjeta, $hoy->modify('-5 days 11:00'), EstadoPedido::Cancelado);
        $this->alquiler($p6, $v['halo'], 3);
        $this->compra($p6, $v['re4'], 1);
        // Pedido 7 (pendiente, hoy): varias unidades
        $p7 = $this->pedido($c1, MetodoPago::Bizum, $hoy->setTime(9, 15), EstadoPedido::Pendiente);
        $this->compra($p7, $v['justdance'], 2);
        $this->compra($p7, $mv['ipad'], 1);
        // Pedido 8 (entregado, hace un mes): una consola
        $p8 = $this->pedido($c2, MetodoPago::Tarjeta, $hoy->modify('-30 days 16:00'), EstadoPedido::Entregado);
        $this->compra($p8, $con['ps5'], 1);
        foreach ([$p1, $p2, $p3, $p4, $p5, $p6, $p7, $p8] as $pedido) {
            $om->persist($pedido);
        }

        // 6) Reparaciones: los 5 estados, en los dos departamentos (vía técnico) ---------------------
        $reparaciones = [
            // cliente, técnico, dispositivo, problema, estado, días desde la entrada, presupuesto
            [$c1, $tecTel1, 'iPhone 13', 'La pantalla está rota por una caída.', EstadoReparacion::Recibida, 0, null],
            [$c2, $tecTel2, 'Samsung Galaxy S21', 'La batería se gasta en medio día.', EstadoReparacion::EnReparacion, 3, '49.00'],
            [$c3, $tecTel1, 'iPad 9ª generación', 'No carga con ningún cable.', EstadoReparacion::Lista, 6, '39.00'],
            [$c1, $tecCon1, 'Mando DualSense', 'El joystick izquierdo se mueve solo (drift).', EstadoReparacion::EnReparacion, 2, '25.00'],
            [$c2, $tecCon2, 'PS4 Pro', 'Hace mucho ruido y se apaga por calor.', EstadoReparacion::Entregada, 15, '35.00'],
            [$c3, $tecCon1, 'Nintendo Switch', 'No da imagen por HDMI en el dock.', EstadoReparacion::Cancelada, 9, '80.00'],
            [$c1, $tecCon2, 'Xbox Series S', 'No lee los juegos digitales tras una actualización.', EstadoReparacion::Recibida, 1, null],
        ];
        foreach ($reparaciones as [$cliente, $tecnico, $dispositivo, $problema, $estado, $dias, $presupuesto]) {
            $entrada = $hoy->modify(sprintf('-%d days 10:00', $dias));
            $r = new Reparacion($cliente, $tecnico, $dispositivo, $problema, $entrada);
            $r->setEstado($estado)->setPresupuesto($presupuesto);
            if ($estado === EstadoReparacion::Entregada) {
                $r->setFechaSalida($entrada->modify('+5 days 18:00')); // CHECK: fecha_salida ⇔ entregada
            }
            $om->persist($r);
        }

        $om->flush();
    }

    // Ayudantes ------------------------------------------------------------------------------

    private function trabajador(string $email, string $nombre, string $apellidos, string $telefono, Puesto $puesto, ?Departamento $dep): Trabajador
    {
        $t = (new Trabajador())->setPuesto($puesto)->setDepartamento($dep);
        $t->setEmail($email)->setNombre($nombre)->setApellidos($apellidos)->setTelefono($telefono);

        return $t->setPassword($this->hasher->hashPassword($t, self::PASSWORD_DEMO));
    }

    private function cliente(string $email, string $nombre, string $apellidos, string $telefono, string $dni): Cliente
    {
        $c = (new Cliente())->setDni($dni);
        $c->setEmail($email)->setNombre($nombre)->setApellidos($apellidos)->setTelefono($telefono);

        return $c->setPassword($this->hasher->hashPassword($c, self::PASSWORD_DEMO));
    }

    private function producto(\App\Entity\Producto $p, string $nombre, Marca $marca, string $precio, int $stock, string $imagen, string $descripcion): void
    {
        $p->setNombre($nombre)->setMarca($marca)->setPrecio($precio)->setStock($stock)
            ->setImagen(self::IMG.$imagen)->setDescripcion($descripcion);
    }

    private function pedido(Cliente $cliente, MetodoPago $pago, \DateTimeImmutable $fecha, EstadoPedido $estado): Pedido
    {
        return (new Pedido($cliente, $pago, $fecha))->setEstado($estado);
    }

    private function compra(Pedido $pedido, \App\Entity\Producto $producto, int $cantidad): void
    {
        $pedido->addCompra(new Compra($pedido, $producto, $cantidad, (string) $producto->getPrecio()));
    }

    private function alquiler(Pedido $pedido, Videojuego $juego, int $dias): Alquiler
    {
        $fin = $pedido->getFecha()->setTime(0, 0)->modify(sprintf('+%d days', $dias));
        $alquiler = new Alquiler($pedido, $juego, (string) $juego->getPrecioAlquiler(), $fin);
        $pedido->addAlquiler($alquiler);

        return $alquiler;
    }
}
