#!/bin/sh
# Respaldo de la base de datos de Casa Ruiz.
#
# Modo normal (contenedor "respaldo"): espera cada sábado a las 18:00 (zona horaria TZ del contenedor),
# hace un respaldo, lo verifica y conserva solo los RESPALDOS_CONSERVAR más recientes.
#
# Respaldo inmediato:  sh /scripts/respaldo.sh ahora

set -eu

DESTINO="${RESPALDOS_DIR:-/respaldos}"
CONSERVAR="${RESPALDOS_CONSERVAR:-3}"
HOST="${PGHOST:-db}"
USUARIO="${PGUSER:-casa_ruiz}"
BASE="${PGDATABASE:-casa_ruiz}"

mkdir -p "$DESTINO"

respaldar() {
  archivo="$DESTINO/casa_ruiz_$(date +%Y%m%d_%H%M%S).dump"
  echo "[$(date '+%F %T')] Respaldando en $archivo"
  pg_dump -h "$HOST" -U "$USUARIO" -d "$BASE" -Fc -f "$archivo"

  # Comprueba que el archivo se pueda leer antes de dar el respaldo por bueno.
  pg_restore --list "$archivo" > /dev/null
  echo "[$(date '+%F %T')] Respaldo verificado"

  # Elimina los respaldos más viejos y deja solo los CONSERVAR más recientes.
  ls -1t "$DESTINO"/casa_ruiz_*.dump | tail -n +"$((CONSERVAR + 1))" | while read -r viejo; do
    echo "[$(date '+%F %T')] Eliminando respaldo antiguo $viejo"
    rm -f "$viejo"
  done
}

# Devuelve la hora Unix del próximo sábado a las 18:00 (%u: 1 = lunes ... 6 = sábado).
siguiente_sabado() {
  dias=$(( (6 - $(date +%u) + 7) % 7 ))
  fecha=$(date -d "+${dias} days" +%F)
  objetivo=$(date -d "$fecha 18:00" +%s)

  # Si hoy es sábado y ya pasaron las 18:00, el próximo es dentro de una semana.
  if [ "$objetivo" -le "$(date +%s)" ]; then
    fecha=$(date -d "+$((dias + 7)) days" +%F)
    objetivo=$(date -d "$fecha 18:00" +%s)
  fi

  echo "$objetivo"
}

if [ "${1:-}" = "ahora" ]; then
  respaldar
  exit 0
fi

while true; do
  objetivo=$(siguiente_sabado)
  echo "[$(date '+%F %T')] Próximo respaldo: $(date -d "@$objetivo" '+%F %T')"
  sleep "$((objetivo - $(date +%s)))"
  respaldar || echo "[$(date '+%F %T')] ERROR: el respaldo falló. Revisa el log del contenedor."
  # Evita repetir el respaldo dentro del mismo minuto.
  sleep 60
done
