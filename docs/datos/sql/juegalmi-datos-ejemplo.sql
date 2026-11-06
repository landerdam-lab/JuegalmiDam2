-- JuegAlmi · datos de ejemplo mínimos para probar (ejecutar DESPUÉS del esquema)
-- Contraseñas: 'h' es un marcador; la API guardará hashes de verdad. Emails .test (no reales).
USE almi_companion;
INSERT INTO departamento (id,nombre) VALUES (1,'Telefonía'),(2,'Consolas');
INSERT INTO marca (id,nombre) VALUES (1,'Sony'),(2,'Samsung'),(3,'Nintendo'),(4,'Sin productos');
INSERT INTO plataforma (id,nombre) VALUES (1,'PS5'),(2,'Switch 2');
INSERT INTO tienda (id,nombre,direccion,latitud,longitud,historia) VALUES (1,'JuegAlmi','Calle Inventada 1, Bilbao',43.2630000,-2.9350000,'Desde 2010');
INSERT INTO foto_tienda (imagen,descripcion,tienda_id) VALUES ('uploads/tienda/1.jpg','Fachada',1);
INSERT INTO servicio (nombre,descripcion,precio_orientativo,linea) VALUES ('Cambio de pantalla','x',89,'telefonia'),('Limpieza','x',NULL,'consolas'),('Drift de mandos','x',25,'videojuegos');
INSERT INTO usuario (id,nombre,apellidos,email,password,telefono,tipo) VALUES
 (1,'Ane','Etxeberria','cliente1@juegalmi.test','h','600000001','cliente'),
 (2,'Admin','Demo','admin@juegalmi.test','h','600000002','trabajador'),
 (3,'Iker','Tecnico','tecnico.telefonia1@juegalmi.test','h','600000003','trabajador'),
 (4,'Jon','Sin historial','cliente2@juegalmi.test','h','600000004','cliente'),
 (5,'Sin','Fila','cliente3@juegalmi.test','h','600000005','cliente'),
 (6,'Sin','Fila','trabajador3@juegalmi.test','h','600000006','trabajador');
INSERT INTO cliente (id,dni,foto) VALUES (1,'12345678Z',NULL),(4,'X1234567L',NULL);
INSERT INTO trabajador (id,puesto,departamento_id) VALUES (2,'admin',NULL),(3,'tecnico',1);
INSERT INTO token (token_hash,fecha_creacion,fecha_expira,usuario_id) VALUES (SHA2('t1',256),UTC_TIMESTAMP(),UTC_TIMESTAMP()+INTERVAL 1 DAY,1),(SHA2('t4',256),UTC_TIMESTAMP(),UTC_TIMESTAMP()+INTERVAL 1 DAY,4);
INSERT INTO registro_ubicacion (fecha,latitud,longitud,metodo,ruta,usuario_id) VALUES (UTC_TIMESTAMP(),43.26,-2.93,'GET','/api/videojuegos',1),(UTC_TIMESTAMP(),43.26,-2.93,'GET','/api/me',4);
INSERT INTO producto (id,nombre,descripcion,precio,stock,imagen,tipo,marca_id) VALUES
 (1,'EA FC 26','x',69.99,8,'p/1.jpg','videojuego',1),
 (2,'Galaxy S25','x',899,3,'p/2.jpg','movil',2),
 (3,'PS5 Pro','x',799,2,'p/3.jpg','consola',1),
 (4,'Mario Kart World','x',79.99,5,'p/4.jpg','videojuego',3),
 (5,'Producto sin ventas','x',10,1,'p/5.jpg','consola',3);
INSERT INTO videojuego (id,genero,pegi,precio_alquiler,copias_alquiler,plataforma_id) VALUES (1,'Deportes',3,2.50,1,1),(4,'Carreras',3,3.00,2,2);
INSERT INTO movil (id,formato,pantalla_pulgadas,ram_gb,almacenamiento_gb) VALUES (2,'movil',6.2,12,256);
INSERT INTO consola (id,modelo,almacenamiento_gb) VALUES (3,'Pro',2000),(5,'Slim',825);
INSERT INTO pedido (id,fecha,estado,metodo_pago,cliente_id) VALUES (1,UTC_TIMESTAMP(),'pendiente','tarjeta',1),(2,UTC_TIMESTAMP(),'entregado','bizum',1);
INSERT INTO compra (id,pedido_id,producto_id,cantidad,precio_unitario) VALUES (1,1,2,1,899);
INSERT INTO alquiler (id,pedido_id,videojuego_id,precio_dia,fecha_fin,fecha_devolucion) VALUES (2,1,1,2.50,CURDATE()+INTERVAL 7 DAY,NULL),(3,2,4,3.00,CURDATE()+INTERVAL 3 DAY,CURDATE());
INSERT INTO reparacion (id,dispositivo,problema,fecha_entrada,cliente_id,tecnico_id) VALUES (1,'iPhone 13','Pantalla rota',UTC_TIMESTAMP(),1,3);
INSERT INTO proveedor (id,nombre,cif,telefono,email,direccion) VALUES (1,'Distribuciones Gamer Norte S.L.','B95123456','944100200','pedidos@gamernorte.test',NULL),(2,'Telecom Suministros Bizkaia S.L.','B48987654','944300500','ventas@telecombizkaia.test',NULL),(3,'Proveedor sin productos S.L.','B20111222','943400600','info@sinproductos.test',NULL);
INSERT INTO producto_proveedor (producto_id,proveedor_id,precio_coste) VALUES (1,1,48.99),(4,1,55.99),(2,2,719.20),(3,1,679.15),(1,2,47.50);
