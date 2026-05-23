#!/bin/bash
# MedFreela — backup diário PostgreSQL
# Configurar como cron job:
#   crontab -e
#   0 3 * * * /var/www/medfreela/backup.sh >> /var/log/medfreela-backup.log 2>&1

set -e

BACKUP_DIR="/var/backups/medfreela"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/medfreela_$TIMESTAMP.sql.gz"

# Ler variáveis de ambiente do ficheiro .env da aplicação
ENV_FILE="/var/www/medfreela/.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^DATABASE_URL=' "$ENV_FILE" | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "[$(date)] ERRO: DATABASE_URL não definida. Verifique o ficheiro .env"
  exit 1
fi

# Extrair credenciais do DATABASE_URL (formato: postgresql://user:password@host:port/dbname)
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|postgresql://[^@]+@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')

mkdir -p "$BACKUP_DIR"

echo "[$(date)] A iniciar backup da base de dados '$DB_NAME'..."

PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  --format=plain \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_FILE"

TAMANHO=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup concluído: $BACKUP_FILE ($TAMANHO)"

# Remover backups mais antigos que RETENTION_DAYS dias
REMOVIDOS=$(find "$BACKUP_DIR" -name "medfreela_*.sql.gz" -mtime +$RETENTION_DAYS -print -delete | wc -l)
if [ "$REMOVIDOS" -gt 0 ]; then
  echo "[$(date)] $REMOVIDOS backup(s) antigo(s) removido(s) (mais de $RETENTION_DAYS dias)"
fi

echo "[$(date)] Backups disponíveis em $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5
