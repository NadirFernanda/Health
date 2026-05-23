# MedFreela

Plataforma angolana de profissionais de saúde — liga médicos/enfermeiros a clínicas para plantões e aluguer de salas de consulta.

**Stack:** Next.js 16 · React 19 · PostgreSQL · Prisma 7 · Redis · TailwindCSS 4 · PM2

---

## Referência rápida

```bash
# Deploy de uma actualização
bash /var/www/medfreela/deploy.sh

# Backup manual da base de dados
bash /var/www/medfreela/backup.sh

# Ver estado dos processos
pm2 status

# Ver logs em tempo real
pm2 logs medfreela
pm2 logs medfreela-cron
```

---

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as suas credenciais

# Sincronizar esquema da base de dados
npx prisma db push

# Gerar cliente Prisma
npx prisma generate

# Iniciar servidor de desenvolvimento
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) no browser.

---

## Variáveis de Ambiente Obrigatórias

```env
# Base de dados
DATABASE_URL=postgresql://user:password@localhost:5432/medfreela

# Autenticação (mínimo 32 caracteres)
AUTH_SECRET=uma-string-aleatoria-com-pelo-menos-32-chars

# Redis (rate limiting)
REDIS_URL=redis://localhost:6379

# Email (SMTP)
SMTP_HOST=smtp.seuservidor.ao
SMTP_PORT=587
SMTP_USER=noreply@medfreela.ao
SMTP_PASS=password-do-smtp
SMTP_FROM=MedFreela <noreply@medfreela.ao>

# URL pública da aplicação
NEXT_PUBLIC_BASE_URL=https://medfreela.ao

# Push Notifications (VAPID)
VAPID_EMAIL=mailto:admin@medfreela.ao
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Cron (protege o endpoint /api/cron/atualizar-status)
CRON_SECRET=outro-segredo-aleatorio
```

Para gerar as chaves VAPID:
```bash
npx web-push generate-vapid-keys
```

---

## Deploy

### Deploy de actualizações (uso diário)

```bash
# Entrar no servidor
ssh root@IP_DO_SERVIDOR

# Executar o script de deploy
cd /var/www/medfreela
bash deploy.sh
```

O script `deploy.sh` faz automaticamente:
1. `git pull origin main` — busca as últimas alterações
2. `npm ci` — instala dependências
3. `npx prisma generate` — actualiza o cliente Prisma
4. `npx prisma db push` — aplica alterações ao schema
5. `npm run build` — compila a aplicação
6. `pm2 restart medfreela` — reinicia o servidor

---

### Primeira instalação no servidor

```bash
# 1. Instalar dependências do sistema
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs redis-server
sudo npm install -g pm2

# 2. Clonar o repositório
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/NadirFernanda/Health.git medfreela
sudo chown -R $USER:$USER /var/www/medfreela
cd /var/www/medfreela

# 3. Configurar variáveis de ambiente
cp .env.example .env
nano .env   # preencher com os valores de produção

# 4. Instalar dependências e build
npm install
npx prisma generate
npx prisma db push
npm run build

# 5. Criar script de arranque
cat > start-server.sh << 'EOF'
#!/bin/bash
set -e
cd /var/www/medfreela
exec node_modules/.bin/next start --port 3000
EOF
chmod +x start-server.sh

# 6. Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # seguir as instruções geradas para auto-start no boot

# 7. Verificar que ambos os processos estão a correr
pm2 status
# Deve mostrar: medfreela (online) + medfreela-cron (online)
```

---

### Recriar o cron job (após reset ou falha)

O `medfreela-cron` é responsável por transições automáticas de estado dos plantões
(ABERTO → EM_ANDAMENTO → CONCLUIDO) e pela libertação dos pagamentos em escrow.

```bash
# Verificar se está a correr
pm2 list

# Se "medfreela-cron" não aparecer, recriar:
cd /var/www/medfreela
pm2 start ecosystem.config.js --only medfreela-cron
pm2 save

# Confirmar que está activo e sem erros
pm2 logs medfreela-cron --lines 20
```

> A variável `CRON_SECRET` tem de estar definida no `.env`. O script lê-a do ambiente
> no arranque — certifique-se de que o PM2 é iniciado a partir de uma shell com o `.env` carregado.

---

## Backup

### Backup manual (a qualquer momento)

```bash
bash /var/www/medfreela/backup.sh
```

O script exporta a base de dados para `/var/backups/medfreela/medfreela_YYYYMMDD_HHMMSS.sql.gz`
e remove automaticamente backups com mais de 30 dias.

---

### Backup automático diário

O `deploy.sh` **configura o cron job automaticamente** na primeira execução — não é necessário fazer nada manualmente.

O que o deploy faz por si:
- Dá permissão de execução ao `backup.sh`
- Cria `/var/backups/medfreela/` se não existir
- Regista `0 3 * * *` no crontab (todos os dias às 03:00)
- Se o cron já existir, não duplica a entrada

Para confirmar que ficou registado:

```bash
# Ver cron jobs activos
crontab -l

# Ver logs do último backup
tail -20 /var/log/medfreela-backup.log

# Listar backups existentes
ls -lh /var/backups/medfreela/
```

---

### Restaurar um backup

```bash
# Listar backups disponíveis
ls -lh /var/backups/medfreela/

# Restaurar (substituir o nome do ficheiro)
gunzip -c /var/backups/medfreela/medfreela_20250520_030001.sql.gz | \
  psql "$DATABASE_URL"
```

---

## Redis

```bash
# Instalar (se não estiver instalado)
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verificar
redis-cli ping   # resposta esperada: PONG

# O .env já tem o valor por omissão: REDIS_URL=redis://localhost:6379
# Para um servidor Redis externo:
# REDIS_URL=redis://:password@host:6379
```

---

## PM2 — Comandos úteis

```bash
# Estado de todos os processos
pm2 status

# Logs em tempo real
pm2 logs medfreela
pm2 logs medfreela-cron

# Recarregar sem downtime (após deploy)
pm2 reload medfreela

# Reiniciar com downtime breve
pm2 restart medfreela

# Monitorização interactiva (CPU, memória, logs)
pm2 monit

# Guardar configuração actual (após adicionar/remover processos)
pm2 save
```

---

## Nginx — Reverse Proxy

```nginx
# /etc/nginx/sites-available/medfreela
server {
    listen 80;
    server_name medfreela.ao www.medfreela.ao;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name medfreela.ao www.medfreela.ao;

    ssl_certificate     /etc/letsencrypt/live/medfreela.ao/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/medfreela.ao/privkey.pem;

    location /uploads/ {
        alias /var/www/medfreela/public/uploads/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Activar e recarregar
sudo ln -s /etc/nginx/sites-available/medfreela /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL gratuito (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d medfreela.ao -d www.medfreela.ao
```

---

## Estrutura do Projecto

```
src/
├── app/
│   ├── api/          # Endpoints REST (Next.js Route Handlers)
│   ├── admin/        # Painel de administração
│   ├── medico/       # Dashboard do profissional de saúde
│   ├── clinica/      # Dashboard da clínica
│   ├── consultorio/  # Dashboard do consultório
│   └── login/        # Autenticação e recuperação de password
├── components/       # Componentes React partilhados
├── lib/              # Utilitários (auth, email, push, db, ...)
└── middleware.ts     # Protecção de rotas + headers de cache
prisma/
└── schema.prisma     # Esquema da base de dados
scripts/
└── cron-worker.js    # Worker PM2 para transições automáticas de plantões
deploy.sh             # Script de deploy
backup.sh             # Script de backup diário PostgreSQL
ecosystem.config.js   # Configuração PM2 (medfreela + medfreela-cron)
public/
└── sw.js             # Service Worker (PWA + push notifications)
```
