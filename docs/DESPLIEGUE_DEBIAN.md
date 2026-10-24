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

El archivo `.env` no se sube al repositorio.

## 5. Levantar el sistema

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f api
```

La primera vez tarda unos minutos porque construye la imagen. Al iniciar, la API aplica las migraciones a la base de datos automáticamente.

Prueba desde cualquier equipo de la oficina:

```bash
curl http://192.168.1.10:8080/api/articulos
```

Debe responder `[]` (o la lista de artículos si ya hay datos).

## 6. Firewall

Como Docker publica los puertos saltándose UFW, el sistema queda amarrado a la IP de la oficina por `API_IP`. Además, abre solo lo necesario:

```bash
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw allow OpenSSH
sudo ufw allow from 192.168.1.0/24 to any port 8080 proto tcp
sudo ufw enable
```

Ajusta `192.168.1.0/24` a la red real de la oficina.

**No** reenvíes el puerto 8080 desde el router hacia internet.

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

**Pendiente de definir.** Ya se acordó que se quieren respaldos automáticos; falta decidir:

- Frecuencia (por ejemplo, diaria)
- Cuántos respaldos conservar
- Dónde se guardan (otro disco del servidor, una USB, un NAS o una nube)
