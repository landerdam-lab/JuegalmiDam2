<!-- Copia para el repo de la nota «Guia de la infraestructura» de la bóveda (2026-10-29). La fuente de verdad es la bóveda: si cambia, actualizar las dos. Sin contraseñas: están en RETO_dam2\credenciales.txt de Lander. -->

# Guía de la infraestructura (AWS)

Volver a *00 - INICIO* (bóveda) · Decisión y detalle del despliegue: *ADR-010 Despliegue en AWS con host bastion* (bóveda, `10-Decisiones/`) · Copias: [Copias de seguridad](copias-de-seguridad.md) · Problemas: *Problemas comunes* (bóveda) · Responsable: **Lander**

> **⚠️** Contraseñas y claves
> No están en esta bóveda ni en el repo. Lander las tiene en `RETO_dam2\credenciales.txt` (proxy, MariaDB y AWS de la sesión), y la clave SSH en `RETO_dam2\aws-juegalmi\vockey.pem`.

## 1. Qué hay montado

```
                 Internet
                    │ 80/443 (todos) · 22 y 81 (solo la IP de Lander)
┌───────────────────▼──────────────────────────────┐
│ SUBRED PÚBLICA 10.0.1.0/24                       │
│  bastion-proxy · 3.208.228.110 (IP elástica)     │
│   - entrada SSH (host bastión)                   │
│   - Nginx Proxy Manager (Docker): dominios       │
└───────────────────┬──────────────────────────────┘
                    │ 22 · 8000 · 8080 · 8081 (solo desde el bastión)
┌───────────────────▼──────────────────────────────┐
│ SUBRED PRIVADA 10.0.2.0/24 (sin IP pública)      │
│  symfony-privada · 10.0.2.10                     │
│   - Symfony (API)   :8000  (servicio systemd)    │
│   - Adminer         :8080  (Docker)              │
│   - Web (nginx)     :8081  (Docker)              │
│   - MariaDB 11.4    :3306  (Docker, solo local)  │
│   - copias diarias → S3 (por el VPC endpoint)    │
│  Sale a internet por el NAT Gateway              │
└──────────────────────────────────────────────────┘
```

| Dominio (hoy por **HTTP**; HTTPS al final, A-32) | Va a | Quién puede entrar |
|---|---|---|
| `symfony.3-208-228-110.sslip.io` | API Symfony `10.0.2.10:8000` | Todos (las apps y la web) |
| `web.3-208-228-110.sslip.io` | Web `10.0.2.10:8081` | Todos |
| `adminer.3-208-228-110.sslip.io` | Adminer `10.0.2.10:8080` | Solo la IP de Lander (lista de acceso «Solo Lander») |
| `http://3.208.228.110:81` | Panel de Nginx Proxy Manager | Solo la IP de Lander |

`sslip.io` es un DNS gratuito: `symfony.3-208-228-110.sslip.io` apunta solo a `3.208.228.110`, así que no hace falta comprar un dominio.

## 2. Antes de nada: encender el laboratorio
1. AWS Academy → **Learner Lab** → *Start Lab* y esperar a que el punto se ponga **verde**. Las máquinas arrancan solas, y la IP y los dominios no cambian (IP elástica).
2. Las **credenciales de AWS** (para Terraform o la CLI) están en *AWS Details → AWS CLI → Show* y **caducan** al cerrar la sesión. Se copian a `credenciales.txt`.
3. Al terminar: *End Lab*. Las máquinas se paran, pero el NAT Gateway y la IP elástica siguen gastando un poco de crédito. Si no se va a usar en días, `terraform destroy` (sección 7).

## 3. Entrar en las máquinas (SSH)
Desde el PC de Lander, en `RETO_dam2\aws-juegalmi`:
```bash
ssh -F ssh_config bastion        # bastión + proxy
ssh -F ssh_config symfony        # máquina privada (salta por el bastión) y abre túneles:
                                 #   http://localhost:8000 → Symfony · http://localhost:8080 → Adminer
ssh -F ssh_config -o ClearAllForwardings=yes symfony   # igual, sin túneles
```
`ssh_config` lo genera Terraform. SSH solo se puede abrir desde la IP de Lander (`mi_ip` en `variables.tf`): desde otra red hay que cambiarla y volver a hacer `terraform apply`.

## 4. Qué hay en cada máquina

**Bastión** (`ssh -F ssh_config bastion`)
| Qué | Dónde | Comandos |
|---|---|---|
| Nginx Proxy Manager 2.16 | `/opt/npm/docker-compose.yml` (datos en `/opt/npm/data`, certificados en `/opt/npm/letsencrypt`) | `cd /opt/npm && sudo docker compose restart` · logs: `sudo docker logs npm-npm-1 --tail 50` |

**Máquina privada** (`ssh -F ssh_config symfony`). Zona horaria `Europe/Madrid`.
| Qué | Dónde | Comandos |
|---|---|---|
| **API Symfony 7.4** (PHP 8.3), de momento el ejemplo `GET /api/hola` | `/home/ubuntu/symfony` · servicio `/etc/systemd/system/symfony.service` (`php -S 0.0.0.0:8000 -t public`) · conexión a la BBDD en `.env.local` (usuario `juegalmi_app`) | `sudo systemctl restart symfony` · `systemctl status symfony` · `journalctl -u symfony -n 50` |
| **MariaDB 11.4** | `/opt/db/docker-compose.yml`, contenedor `db-mysql-1`, datos en el volumen `mysql_data` | Entrar: `sudo docker exec -it db-mysql-1 mariadb -uroot -p` · `cd /opt/db && sudo docker compose restart` |
| **Adminer** | contenedor `db-adminer-1` (mismo compose) | Servidor: `mysql` (el nombre del contenedor dentro del compose) o `127.0.0.1` |
| **Web (nginx 1.27)** | `/opt/web/docker-compose.yml`, archivos en **`/opt/web/html`**, configuración `/opt/web/default.conf` (SPA: cualquier ruta sirve `index.html`) | `cd /opt/web && sudo docker compose restart` |
| **Copias de seguridad** | `/usr/local/bin/backup-juegalmi.sh` + temporizador `backup-juegalmi.timer` | Ver [Copias de seguridad](copias-de-seguridad.md) |
| **CLI de AWS** | `/snap/bin/aws` (con el perfil `LabInstanceProfile`, sin claves) | `aws s3 ls s3://juegalmi-copias-213482928914/diarias/` |

**Base de datos `juegalmi`** (esquema v6, 19 tablas y 10 triggers, `docs/datos/sql/`):
| Usuario | Permisos | Para |
|---|---|---|
| `juegalmi_app` | SELECT, INSERT, UPDATE, DELETE en `juegalmi` | La API (`DATABASE_URL` del `.env.local`) |
| `juegalmi_admin` | Todo en `juegalmi` | Migraciones de Doctrine, cargar datos |
| `root` | Todo (contraseña cambiada; ya no es `root`) | Solo administración y copias |

## 5. Desplegar
**La web (Angular), cuando exista:**
```bash
# en el PC, dentro de web/:
ng build                                  # genera dist/<proyecto>/browser
scp -F ../../aws-juegalmi/ssh_config -r dist/<proyecto>/browser/* symfony:/tmp/web/
# en la máquina privada:
sudo rm -rf /opt/web/html/* && sudo cp -r /tmp/web/* /opt/web/html/ && rm -rf /tmp/web
```
No hace falta reiniciar nginx: sirve los archivos nuevos al momento. La URL de la API en la web: `http://symfony.3-208-228-110.sslip.io/api` (luego `https://`).

**La API (`api/` del repo), cuando exista** (sustituye al Symfony de ejemplo):
1. En la máquina privada: `git clone` del repo (o `scp` de `api/`) en `/home/ubuntu/juegalmi`, `composer install --no-dev`.
2. `.env.local` con `DATABASE_URL="mysql://juegalmi_app:<contraseña>@127.0.0.1:3306/juegalmi?serverVersion=11.4.0-MariaDB&charset=utf8mb4"` (y `APP_ENV=prod`). Para migrar, usar `juegalmi_admin`.
3. **Antes de migrar, una copia**: `sudo systemctl start backup-juegalmi.service`.
4. `php bin/console doctrine:migrations:migrate` (nunca `doctrine:schema:update`, A-09).
5. Cambiar `WorkingDirectory` de `/etc/systemd/system/symfony.service` a la nueva carpeta → `sudo systemctl daemon-reload && sudo systemctl restart symfony`.
6. Activar **CORS** (NelmioCorsBundle) para la web y para Capacitor.

## 6. El proxy (Nginx Proxy Manager)
- Panel: `http://3.208.228.110:81` (solo la IP de Lander). Usuario y contraseña en `credenciales.txt`.
- Los tres *proxy hosts* y la lista de acceso se crearon con `RETO_dam2\aws-juegalmi\npm_config.py`, que se puede volver a ejecutar sin duplicar nada.
- **HTTPS (al final del proyecto):** `python npm_config.py <email real>`. Pone ese email al administrador, pide los certificados de Let's Encrypt de los tres dominios y fuerza HTTPS. Después hay que quitar el HTTP provisional de las apps (A-32) y cambiar sus URL a `https://`.

## 7. Terraform
Carpeta `RETO_dam2\aws-juegalmi` (copia del original de Lander, `aws-symfony-bastion`, que no se toca).

| Archivo | Qué es |
|---|---|
| `main.tf` | VPC, subredes, NAT, *security groups* (incluye el 8081 de la web), instancias (la privada con `LabInstanceProfile`), IP elástica y `ssh_config` |
| `backups.tf` | Bucket de copias: bloqueo público, cifrado, ciclo de vida y VPC endpoint |
| `variables.tf` · `outputs.tf` | Región, `mi_ip`, tipos de máquina, disco de 50 GB… · IP y dominios |
| `scripts/bastion.sh` · `scripts/privada.sh` | Lo que se instala al crear cada máquina |
| `npm_config.py` | Configura el proxy por su API |
| `terraform.tfstate` | Estado: **no borrar ni subir a Git** |

Comandos (PowerShell, con las credenciales de la sesión como variables de entorno; no se guardan en `~/.aws`):
```powershell
$env:AWS_ACCESS_KEY_ID="…"; $env:AWS_SECRET_ACCESS_KEY="…"; $env:AWS_SESSION_TOKEN="…"
terraform plan  -var "perfil=" -var "ruta_clave=C:/Users/Dam2/Desktop/RETO_dam2/aws-juegalmi/vockey.pem"
terraform apply -var "perfil=" -var "ruta_clave=C:/Users/Dam2/Desktop/RETO_dam2/aws-juegalmi/vockey.pem"
terraform output                     # IP y dominios
terraform destroy -var "perfil=" -var "ruta_clave=…"   # borra TODO menos el bucket de copias
```
> **⚠️** Si se destruye y se vuelve a crear: **cambian la IP y los dominios**, hay que comprobar `cloud-init status` en la máquina privada (puede fallar por el NAT, ver *Problemas comunes* (bóveda)), volver a hacer los pasos del 29/10 (web, usuarios de MariaDB, esquema, copias; *ADR-010 Despliegue en AWS con host bastion* (bóveda, `10-Decisiones/`)) y ejecutar `npm_config.py`. Las copias de S3 se conservan.

## 8. Coste (crédito del Learner Lab)
| Recurso | Aprox. | Nota |
|---|---|---|
| **NAT Gateway** | ~0,045 $/h | Lo más caro; existe aunque las máquinas estén paradas |
| 2 × t3.small | ~0,02 $/h cada una | Solo con el laboratorio encendido |
| IP elástica | pequeña, sobre todo con la máquina parada | |
| S3 + Glacier (copias) y VPC endpoint | ~0 | Ver [Copias de seguridad](copias-de-seguridad.md) |

## 9. Seguridad (para la defensa, fila de Sistemas)
Host bastión como única entrada SSH · servidores y BBDD en una **subred privada** sin IP pública · *security groups* mínimos · proxy inverso · Adminer y el panel solo para una IP · usuarios de BBDD sin `root` · **copias cifradas en un S3 privado + Glacier** por un VPC endpoint · **ninguna credencial guardada en los servidores** (perfil de instancia) · contraseñas fuera del repo y de la bóveda. **Falta:** HTTPS (al final, A-32) y los tokens de la API.
