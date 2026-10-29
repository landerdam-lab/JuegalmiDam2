# JuegalmiDam2

Reto 2 DAM2 (curso 25-26): apps y web para la tienda de videojuegos JuegAlmi.

| Carpeta | Contenido |
|---|---|
| `api/` | Servicio web REST en Symfony (MariaDB + Doctrine) |
| `android/` | App Android nativa (Android Studio), solo para clientes |
| `ionic/` | App híbrida en Ionic + Angular, compilada como APK de Android, solo para clientes |
| `web/` | Web en Angular: publicidad, catálogo y gestión administrativa de la empresa |
| `design/` | Sistema de diseño «Cartucho» (tokens y pantallas) |
| `docs/` | Enunciado y rúbrica, modelo de datos (E-R, paso a tablas, SQL), diseño, entregables (propuesta, dossier, presentación). Índice en `docs/README.md` |

Infraestructura en AWS (bastión, proxy, máquina privada con la API, la web y MariaDB): `docs/infraestructura/README.md`.
Copias de la base de datos: diarias, en un bucket privado de S3 que las pasa a Glacier a los 30 días → `docs/infraestructura/copias-de-seguridad.md`.
