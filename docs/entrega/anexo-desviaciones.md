# Anexo de cambios y desviaciones (E-08)

> **Borrador.** Estos cambios se han recogido comparando con el **enunciado** y las decisiones (ADR) de la bóveda. La propuesta (`propuesta-hito1.md`) también es un borrador: hay que revisar esta lista contra ella cuando el grupo la cierre. Cada fila la tiene que confirmar el grupo.

| Fecha | Qué cambia | Por qué | Impacto |
|---|---|---|---|
| 2026-10-28 | Las plataformas pasan de «Android nativo + Windows Phone e iOS híbridas» a **dos apps Android**: nativa e Ionic compilada como APK (A-11, ADR-024) | Lo indicó el profesorado. Windows Phone está descontinuado e iOS necesita un Mac | No hay build de iOS ni de Windows Phone |
| 2026-10-28 | Las apps son **solo para clientes**. La gestión pasa a una **web en Angular** nueva, con parte pública (ADR-024) | Lo indicó el profesorado | Una pieza más que desarrollar. Ninguna APK tiene gestión |
| 2026-10-28 | El catálogo y la tienda de la **web** son públicos, sin token; las apps, todo con token (ADR-028) | Confirmado por el profesor | Excepción a «todo con token» solo en esos `GET` |
| 2026-10-28 | Sin `AsyncTask`, que está obsoleta: se usan Executors, Volley y Retrofit (A-12) | Android la retiró | Se justifica en la defensa |
| 2026-10-28 | «Factory» en Ionic se implementa como servicios `@Injectable` de Angular (A-15) | «Factory» es un concepto de AngularJS | Se explica en el dossier |
| 2026-10-28 | Solo se alquilan videojuegos, y el admin no compra ni alquila (ADR-029) | Decisión del grupo | Para comprar, el admin usa otra cuenta |
| 2026-10-28 | Los técnicos son `trabajador` y entran en la **web**, donde ven solo las reparaciones de su departamento (ADR-032) | Decisión del grupo | Sin pantallas de técnico en las apps |
| 2026-10-30 | Marca **Almi Companion** en apps y web; el cliente sigue siendo JuegAlmi (ADR-036) | Decisión del grupo | Hay que aclararlo en la presentación (A-35) |
| 2026-10-30 | Además de recoger en tienda, **envío gratis a domicilio** con mapa (ADR-038) | Pedido por Lander | Cuatro columnas nuevas en `pedido` |
| 2026-11-04 | La **dirección de entrega se marca en el mapa**, que parte de la ubicación actual (ADR-040) | Pedido por Lander | Endpoint `GET /api/direcciones`; la API usa Nominatim, un servicio externo |
| 2026-11-06 | **Proveedores**: tablas `proveedor` y `producto_proveedor` (N:M con el precio de coste), modelo v7 con 21 tablas (ADR-042) | Pedido por Lander: los productos tenían marca (quién lo fabrica), pero no a quién se compran | Solo API y web (pantalla PW-19 y bloque en la ficha del producto). Las apps no cambian: son para clientes (ADR-024) |
| 2026-10-29 | La base de datos es **MariaDB 11.4**, no MySQL (ADR-011) | Compatible con MySQL y ya probada en la infraestructura | **Falta que lo confirme el profesor** (P-33) |
| 2026-10-29 | El **HTTPS lo pone el proxy** (Nginx Proxy Manager) delante de Symfony, no Symfony (ADR-010) | Certificado único y API en una subred privada | La rúbrica dice «integrado en Symfony»: **falta que lo confirme el profesor** (P-33) |
| 2026-11-04 | Las **imágenes** (`/uploads/...`) se sirven sin token | La web pública las necesita, igual que el catálogo (ADR-028) | No consta como consultado con el profesor: conviene preguntarlo |
| 2026-11-05 | **Login y registro ignoran un token antiguo** que llegue en la petición (A-51) | Con una sesión caducada no se podía volver a entrar | El resto de rutas sigue exigiendo un token válido |
| 2026-11-05 | Las dos **APK se descargan desde la web**, y son la única excepción a no subir `*.apk` a Git | El repo es privado: un enlace de GitHub no serviría a los visitantes | El repo crece unos 8 MB por cada APK que se sustituye |
| 2026-10-29 | Las copias de seguridad van a **S3** con un temporizador en AWS, no en `api/backups/` | Decisión de infraestructura | Ver `docs/infraestructura/copias-de-seguridad.md` |
