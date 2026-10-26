# Despliegue en Debian con Docker

Sistema de renta de Casa Ruiz. Solo se usa dentro de la red de la oficina.

> **Antes de publicarlo a los usuarios:** la API todavía no tiene inicio de sesión. Cualquiera que llegue a la IP del servidor puede usarla. El módulo de usuarios y roles debe estar terminado antes de la operación diaria.

---

## 1. Requisitos

- Debian 12 (bookworm) o compatible, con acceso a internet para instalar paquetes.
- Una IP fija en la red de la oficina. Ejemplo: `192.168.1.10`.
- Un usuario con permisos `sudo`.

## 2. Instalar Docker Engine

Sigue el procedimiento oficial para Debian:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Cierra sesión y vuelve a entrar para que aplique el grupo `docker`. Luego verifica:

```bash
docker run --rm hello-world
docker compose version
```

## 3. Obtener el código

```bash
sudo mkdir -p /opt/casa-ruiz
sudo chown $USER:$USER /opt/casa-ruiz
git clone https://github.com/magicinicio-spec/Casa_ruiz /opt/casa-ruiz
cd /opt/casa-ruiz
git checkout claude/blissful-lovelace-aj7dbp
```

> Cuando el trabajo se fusione a la rama principal, usa esa rama en lugar de `claude/blissful-lovelace-aj7dbp`.

## 4. Configurar

```bash
cp .env.example .env
nano .env
```

Ajusta dos valores:

- `POSTGRES_PASSWORD`: una contraseña con letras y números. Puedes generarla con `openssl rand -hex 16`.
- `API_IP`: la IP fija del servidor en la red de la oficina.

- `JWT_KEY`: la clave que firma las sesiones. Genérala con `openssl rand -hex 32`.
- `ADMIN_USUARIO` y `ADMIN_PASSWORD`: el primer administrador. Solo se crea cuando la tabla de usuarios está vacía. Después de entrar, cambia la contraseña o crea tu usuario definitivo; las variables ya no se vuelven a usar.

El archivo `.env` no se sube al repositorio.

> Cambiar `JWT_KEY` cierra todas las sesiones abiertas. Si cambias `ADMIN_PASSWORD` después del primer arranque, no tiene efecto: la contraseña se cambia desde el sistema.

## 5. Levantar el sistema

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f api
```

La primera vez tarda unos minutos porque construye la imagen. Al iniciar, la API aplica las migraciones a la base de datos automáticamente.

Abre el sistema desde cualquier equipo de la oficina en `http://192.168.1.10` (la IP de `API_IP`).

Prueba la API desde la misma dirección:

```bash
curl -i -X POST http://192.168.1.10/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nombreUsuario":"admin","password":"TU_ADMIN_PASSWORD"}'
```

Debe responder `200` con un `token`. Sin sesión, las demás rutas responden `401`.

Servicios que levanta Compose:

| Servicio | Qué hace |
|---|---|
| `web` | Nginx: sirve la pantalla de React y reenvía `/api` a la API. Es lo único que se publica (puerto 80). |
| `api` | API en C#. Solo es accesible desde `web`, dentro de la red de Docker. |
| `db` | PostgreSQL. No se publica fuera de Docker. |
| `respaldo` | Respaldo semanal de la base de datos. |

## 6. Firewall

Como Docker publica los puertos saltándose UFW, el sistema queda amarrado a la IP de la oficina por `API_IP`. Además, abre solo lo necesario:

```bash
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw allow OpenSSH
sudo ufw allow from 192.168.1.0/24 to any port 80 proto tcp
sudo ufw enable
```

Ajusta `192.168.1.0/24` a la red real de la oficina.

**No** reenvíes el puerto 80 desde el router hacia internet.

## 7. Actualizar a una versión nueva

```bash
cd /opt/casa-ruiz
git pull
docker compose up -d --build
```

Las migraciones nuevas se aplican solas al arrancar. Los datos se conservan en el volumen `pgdata`.

## 8. Comandos útiles

| Acción | Comando |
|---|---|
| Ver estado | `docker compose ps` |
| Ver logs de la API | `docker compose logs -f api` |
| Detener | `docker compose down` |
| Reiniciar | `docker compose restart` |
| Entrar a la base de datos | `docker compose exec db psql -U casa_ruiz -d casa_ruiz` |

**Nunca** ejecutes `docker compose down -v` en producción: borra el volumen con todos los datos.

## 9. Respaldos

Hay un contenedor `respaldo` que hace un respaldo de la base de datos **cada sábado a las 18:00**. Cada respaldo se verifica y se conservan **los 3 más recientes**. Los archivos quedan en la carpeta `respaldos/` del proyecto, en el disco del servidor.

Además de `ZONA_HORARIA` en `.env`, el horario no requiere configuración. Para revisar el estado:

```bash
docker compose logs respaldo
ls -lh /opt/casa-ruiz/respaldos
```

### Respaldo inmediato

```bash
cd /opt/casa-ruiz
docker compose exec respaldo sh /scripts/respaldo.sh ahora
```

### Restaurar un respaldo

Restaurar **reemplaza** los datos actuales. Hazlo solo con la API detenida:

```bash
cd /opt/casa-ruiz
docker compose stop api
docker compose exec -T db pg_restore --clean --if-exists -U casa_ruiz -d casa_ruiz < respaldos/NOMBRE_DEL_ARCHIVO.dump
docker compose start api
```

Recomendación: copia de vez en cuando la carpeta `respaldos/` a otro equipo o a una USB. Si el disco del servidor falla, los respaldos que estén solo en ese disco se pierden.
