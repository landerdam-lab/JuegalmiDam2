<!-- Copia para el repo de la nota «Copias de seguridad» de la bóveda (2026-10-29). La fuente de verdad es la bóveda: si cambia, actualizar las dos. Sin contraseñas: están en RETO_dam2\credenciales.txt de Lander. -->

# Copias de seguridad de la BBDD (guía de uso)

Volver a *00 - INICIO* (bóveda) · Infraestructura: [Guia de la infraestructura](README.md), *ADR-010 Despliegue en AWS con host bastion* (bóveda, `10-Decisiones/`) · Rúbrica: *Rubrica* (bóveda) (Acceso a datos, nivel 2: «se realizan copias de seguridad») · Responsable: **Lander**

> **Resumen:** En una frase
> Todos los días a las **09:00 (hora de España)**, la máquina privada de AWS hace una copia de la base de datos `juegalmi`, guarda **7 días en local** y la sube a un **bucket privado de S3**. A los 30 días pasa sola a **Glacier** y a los 365 se borra. Nadie de fuera puede verla, y la máquina no guarda ninguna credencial.

> **⚠️** Contraseñas
> Las contraseñas (root de MariaDB, `juegalmi_admin`…) y las credenciales de AWS **no están en esta bóveda**: las tiene Lander en `RETO_dam2\credenciales.txt`. Donde abajo pone `<contraseña de root>`, es la de la sección `[MariaDB]` de ese archivo.

## 1. Cómo funciona

```
máquina privada 10.0.2.10                                    AWS S3 (privado y cifrado)
┌─────────────────────────────────────────┐                 ┌───────────────────────────────────┐
│ backup-juegalmi.timer   (09:00 Madrid)  │                 │ juegalmi-copias-213482928914      │
│      └─► backup-juegalmi.service        │                 │   diarias/juegalmi-…sql.gz        │
│            └─► /usr/local/bin/          │  VPC endpoint   │   0-30 días  → S3 Standard        │
│                backup-juegalmi.sh ──────┼────────────────►│   30 días    → Glacier            │
│   mariadb-dump | gzip                   │  (sin internet  │   365 días   → se borra           │
│   → /var/backups/juegalmi (7 días)      │   ni NAT)       └───────────────────────────────────┘
└─────────────────────────────────────────┘
```

| Pieza | Dónde | Qué hace |
|---|---|---|
| **Script** | `/usr/local/bin/backup-juegalmi.sh` (máquina privada, solo lo puede leer root: lleva la contraseña de root) | 1) `mariadb-dump --routines --triggers --single-transaction juegalmi` dentro del contenedor `db-mysql-1` · 2) lo comprime con `gzip` en `/var/backups/juegalmi/juegalmi-AAAA-MM-DD-HHMM.sql.gz` · 3) lo sube con `aws s3 cp` a `s3://juegalmi-copias-213482928914/diarias/` · 4) borra las copias locales de más de 7 días |
| **Servicio** | `/etc/systemd/system/backup-juegalmi.service` | Ejecuta el script una vez (`Type=oneshot`), después de Docker y de la red |
| **Temporizador** (lo que antes era el `cron`) | `/etc/systemd/system/backup-juegalmi.timer` | `OnCalendar=*-*-* 09:00:00 Europe/Madrid` · `Persistent=true` · `RandomizedDelaySec=5min` |
| **Copias locales** | `/var/backups/juegalmi/` | Las de los últimos 7 días (para restaurar al momento) |
| **Bucket** | `juegalmi-copias-213482928914` (us-east-1), carpeta `diarias/` | Privado (bloqueo de acceso público ×4: desde internet da **403**), cifrado AES-256, ciclo de vida 30 días → Glacier → 365 días |
| **Permisos de la máquina** | Perfil de instancia `LabInstanceProfile` (rol `LabRole`) | La máquina sube a S3 **sin claves guardadas**: AWS le da credenciales temporales automáticamente |
| **Red** | VPC endpoint de S3 (Gateway) en la tabla de rutas privada | La copia va a S3 por dentro de AWS: no sale a internet ni pasa por el NAT. Es gratis |
| **Terraform** | `RETO_dam2\aws-juegalmi\backups.tf` | Bloqueo público, cifrado, ciclo de vida y endpoint. El bucket se creó con la CLI (AWS Academy no deja que Terraform lo gestione: ver *Problemas comunes* (bóveda)) |

### ¿Por qué un temporizador de systemd y no `cron`?
**systemd** es el programa que arranca y vigila los servicios de Ubuntu. Un *timer* de systemd hace lo mismo que una línea de `crontab`, pero con `Persistent=true`: **si la máquina estaba apagada a las 09:00** (en el Learner Lab se apagan al cerrar la sesión), **la copia se hace en cuanto arranca**. Con `cron` esa copia se perdería. Por eso **no hay `crontab`**: el `/etc/cron.d/backup-juegalmi` del primer día se borró.

> Equivalente en `cron`, por si se quisiera volver a él: `0 9 * * * root /usr/local/bin/backup-juegalmi.sh` en `/etc/cron.d/backup-juegalmi` (pero sin recuperar las copias perdidas con la máquina apagada).

### ¿Por qué `--triggers` y `--single-transaction`?
- `--routines --triggers`: sin ellos la copia **pierde las reglas de negocio** de la BBDD (copias de alquiler, técnicos, disjunciones…; *ADR-020 Reglas de negocio en la BBDD* (bóveda, `10-Decisiones/`), A-09).
- `--single-transaction`: hace una «foto» coherente sin bloquear las tablas; la API sigue funcionando mientras se copia.

## 2. Conectarse

**A la máquina privada** (desde el PC de Lander, carpeta `RETO_dam2\aws-juegalmi`):
```bash
ssh -F ssh_config symfony        # salta por el bastión (abre túneles a localhost:8000 y localhost:8080)
ssh -F ssh_config -o ClearAllForwardings=yes symfony   # igual, sin túneles (si los puertos ya están ocupados)
```

**A S3, según desde dónde:**

| Desde | Cómo | Credenciales |
|---|---|---|
| **La máquina privada** | `aws s3 ls s3://juegalmi-copias-213482928914/diarias/` | Ninguna: usa el perfil de instancia (y no caducan) |
| **Consola web de AWS** | AWS Academy → Learner Lab en verde → botón **AWS** → servicio **S3** → bucket `juegalmi-copias-213482928914` → carpeta `diarias/` (botón **Descargar**). Pestaña *Administración*: ciclo de vida · pestaña *Permisos*: bloqueo público | Las de la sesión del laboratorio |
| **Tu PC (CLI de AWS)** | PowerShell: `$env:AWS_ACCESS_KEY_ID="…"; $env:AWS_SECRET_ACCESS_KEY="…"; $env:AWS_SESSION_TOKEN="…"; $env:AWS_DEFAULT_REGION="us-east-1"` y después los comandos `aws s3 …` | Las de `credenciales.txt` (`[AWS Academy]`). **Caducan** al cerrar el laboratorio: copiar las nuevas de *AWS Details → AWS CLI → Show* |

## 3. Comandos del día a día (en la máquina privada)

| Para | Comando |
|---|---|
| **Hacer una copia ahora** (antes de una demo, de una migración o de un cambio importante) | `sudo systemctl start backup-juegalmi.service` |
| Ver si la última copia fue bien | `journalctl -u backup-juegalmi.service -n 20 --no-pager` (debe terminar en «copia hecha: …») |
| Ver cuándo toca la próxima | `systemctl list-timers backup-juegalmi.timer` |
| Ver las copias locales | `ls -lh /var/backups/juegalmi/` |
| Ver las copias en S3 (y su clase: STANDARD o GLACIER) | `aws s3api list-objects-v2 --bucket juegalmi-copias-213482928914 --prefix diarias/ --query "Contents[].[Key,StorageClass,Size]" --output table` |
| Descargar una copia de S3 a la máquina | `aws s3 cp s3://juegalmi-copias-213482928914/diarias/<archivo>.sql.gz .` |
| Descargarla a tu PC | Con la CLI de tu PC (sección 2): `aws s3 cp s3://juegalmi-copias-213482928914/diarias/<archivo>.sql.gz .` (o desde la consola web) |
| Cambiar la hora | `sudo systemctl edit --full backup-juegalmi.timer` → cambiar `OnCalendar` → `sudo systemctl daemon-reload && sudo systemctl restart backup-juegalmi.timer` |
| Pausar o reanudar las copias | `sudo systemctl disable --now backup-juegalmi.timer` / `sudo systemctl enable --now backup-juegalmi.timer` |

## 4. Restaurar una copia

> **⚠️** Restaurar sobre `juegalmi` **sustituye los datos actuales**. Hazlo primero en una base de prueba y, antes de restaurar la buena, **haz una copia de lo que hay ahora** (`sudo systemctl start backup-juegalmi.service`).

Todos los comandos en la máquina privada. `P` es la contraseña de root de MariaDB (de `credenciales.txt`):
```bash
P='<contraseña de root>'
DB="sudo docker exec -i db-mysql-1 mariadb -uroot -p$P"
```

**a) Probar una copia en una base de prueba** (no toca nada; recomendado siempre antes):
```bash
$DB -e "DROP DATABASE IF EXISTS prueba; CREATE DATABASE prueba"
zcat /var/backups/juegalmi/juegalmi-AAAA-MM-DD-HHMM.sql.gz | $DB prueba
$DB -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='prueba';   -- 19
        SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA='prueba'"  -- 10
$DB -e "DROP DATABASE prueba"
```

**b) Restaurar desde una copia local** (de los últimos 7 días):
```bash
zcat /var/backups/juegalmi/juegalmi-AAAA-MM-DD-HHMM.sql.gz | $DB juegalmi
```

**c) Restaurar desde S3** (copia de menos de 30 días: está en S3 Standard y se descarga al momento):
```bash
aws s3 cp s3://juegalmi-copias-213482928914/diarias/<archivo>.sql.gz - | gunzip | $DB juegalmi
```

**d) Restaurar desde Glacier** (copia de más de 30 días): primero hay que pedir que la saquen, y tarda.
```bash
aws s3api restore-object --bucket juegalmi-copias-213482928914 --key diarias/<archivo>.sql.gz \
  --restore-request '{"Days":7,"GlacierJobParameters":{"Tier":"Standard"}}'     # Standard: 3-5 h · Expedited: 1-5 min (más caro)
aws s3api head-object --bucket juegalmi-copias-213482928914 --key diarias/<archivo>.sql.gz --query Restore
# cuando ponga ongoing-request="false", ya se puede usar el comando c)
```

**e) Si se ha perdido la máquina entera:** volver a crear la infraestructura ([Guia de la infraestructura](README.md)), crear la BBDD vacía (`docs/datos/sql/juegalmi-esquema.sql`, o directamente la copia, que ya trae el esquema) y restaurar con c). El bucket **no se borra** con `terraform destroy` (Terraform no lo gestiona), así que las copias sobreviven.

✅ Probado el 2026-10-29: restaurar desde la copia local y **desde S3** en una base de prueba → 19 tablas, 10 triggers y los datos.

## 5. Coste
Prácticamente **cero**: una copia de ~5 KB al día son menos de 1 céntimo al año en S3 o en Glacier, más céntimos por las peticiones; el endpoint es gratis. Lo que consume crédito del laboratorio es el **NAT Gateway** (~0,045 $/h) y las dos **t3.small** (~0,02 $/h cada una), solo con el laboratorio encendido.
- **Por qué no solo Glacier:** cobra un mínimo de 90 días por archivo y tarda horas en devolverlo; para restaurar antes de una demo hace falta la copia reciente en S3 Standard.
- **Por qué no un disco EBS:** un disco extra sigue en la misma máquina, y una *snapshot* copiaría los 50 GB del disco para guardar 5 KB.

## 6. Pendiente y buenas prácticas
- Cuando exista la API, las **imágenes subidas** (`api/public/uploads/`) no están en la BBDD, solo su ruta: habrá que copiarlas también (*ADR-019 Imagenes como ruta* (bóveda, `10-Decisiones/`)). Lo más sencillo: añadir al script un `aws s3 sync` de esa carpeta a `s3://juegalmi-copias-…/uploads/`.
- Hacer una copia **antes de cada migración** de Doctrine y **antes de la demo** (comando de la sección 3).
- **Comprobar de vez en cuando que una copia se restaura** (sección 4a): una copia que no se ha probado no cuenta.
- Idea para la rúbrica de **Servicios y procesos** (aplicación con varios procesos, RT-15): un comando de Symfony `app:backup` que lance `mariadb-dump` con el componente **Process** (*Hilos y procesos* (bóveda)).
- **A-05:** el `README` del repo todavía dice que las copias van en `api/backups/*.sql`; hay que cambiarlo para que apunte a esta nota.
- Para el dossier: capturas del bucket (privado, ciclo de vida), del `systemctl list-timers` y de una restauración.
