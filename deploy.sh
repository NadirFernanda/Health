#!/bin/bash
# MedFreela — script de deploy
# Uso: bash deploy.sh
# Executar como root no servidor de produção (/var/www/medfreela)

set -e

APP_DIR="/var/www/medfreela"
APP_NAME="medfreela"
BACKUP_SCRIPT="$APP_DIR/backup.sh"
BACKUP_DIR="/var/backups/medfreela"
BACKUP_LOG="/var/log/medfreela-backup.log"
CRON_JOB="0 3 * * * $BACKUP_SCRIPT >> $BACKUP_LOG 2>&1"

echo "==> A entrar no diretório da aplicação..."
cd "$APP_DIR"

echo "==> A puxar as últimas alterações do repositório..."
git pull origin main

echo "==> A instalar dependências..."
npm ci --production=false

echo "==> A gerar cliente Prisma..."
npx prisma generate

echo "==> A aplicar alterações ao schema da base de dados..."
npx prisma db push

echo "==> A compilar a aplicação Next.js..."
npm run build

echo "==> A reiniciar o processo PM2..."
if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME"
else
  pm2 start node_modules/.bin/next --name "$APP_NAME" -- start
  pm2 save
fi

# ── Backup automático ────────────────────────────────────────────────────────

echo "==> A verificar cron job de backup..."

chmod +x "$BACKUP_SCRIPT"
mkdir -p "$BACKUP_DIR"

if crontab -l 2>/dev/null | grep -qF "$BACKUP_SCRIPT"; then
  echo "    Cron job já configurado — sem alterações."
else
  # Adiciona o job preservando as entradas existentes
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "    Cron job registado: backups diários às 03:00 → $BACKUP_DIR"
fi

# ── Resumo ───────────────────────────────────────────────────────────────────

echo ""
echo "✓ Deploy concluído!"
echo "  Processo:  $(pm2 describe "$APP_NAME" | grep -E 'status' | awk '{print $4}' | head -1)"
echo "  Backup:    diário às 03:00 → $BACKUP_DIR (log: $BACKUP_LOG)"
