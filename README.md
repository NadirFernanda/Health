# MedFreela

Plataforma angolana de profissionais de saúde — liga médicos/enfermeiros a clínicas para plantões e aluguer de salas de consulta.

**Stack:** Next.js 16 · React 19 · PostgreSQL · Prisma 7 · Redis · TailwindCSS 4 · PM2

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

# Redis
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

## Deploy no Servidor (Ubuntu/Debian com PM2)

### 1. Primeira instalação

```bash
# Entrar no servidor
ssh user@IP_DO_SERVIDOR

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Clonar o repositório
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/NadirFernanda/Health.git medfreela
sudo chown -R $USER:$USER /var/www/medfreela
cd /var/www/medfreela

# Criar ficheiro de variáveis de ambiente
cp .env.example .env
nano .env   # preencher com os valores de produção

# Instalar dependências e fazer build
npm install
npm run build

# Criar o script de arranque
cat > start-server.sh << 'EOF'
#!/bin/bash
set -e
cd /var/www/medfreela
exec node_modules/.bin/next start --port 3000
EOF
chmod +x start-server.sh

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # seguir as instruções para auto-start no boot
```

### 2. Deploy de actualizações (fluxo normal)

```bash
cd /var/www/medfreela

# Buscar e aplicar as últimas alterações do GitHub
git pull origin main

# Instalar novas dependências (se houver)
npm install --production=false

# Gerar cliente Prisma (se o schema mudou)
npx prisma generate

# Aplicar migrações à base de dados (se houver)
npx prisma db push

# Fazer novo build
npm run build

# Recarregar a aplicação sem downtime
pm2 reload medfreela

# Verificar que está a correr
pm2 status
pm2 logs medfreela --lines 30
```

### 3. Comandos PM2 úteis

```bash
# Ver estado de todos os processos
pm2 status

# Ver logs em tempo real
pm2 logs medfreela
pm2 logs medfreela-cron

# Reiniciar (com downtime breve)
pm2 restart medfreela

# Recarregar gracioso (zero downtime)
pm2 reload medfreela

# Parar
pm2 stop medfreela

# Apagar processo
pm2 delete medfreela

# Monitorização interactiva
pm2 monit
```

### 4. Nginx como reverse proxy (recomendado)

```nginx
# /etc/nginx/sites-available/medfreela
server {
    listen 80;
    server_name medfreela.ao www.medfreela.ao;

    # Redirecionar HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name medfreela.ao www.medfreela.ao;

    ssl_certificate     /etc/letsencrypt/live/medfreela.ao/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/medfreela.ao/privkey.pem;

    # Uploads (ficheiros estáticos servidos directamente pelo Nginx)
    location /uploads/ {
        alias /var/www/medfreela/public/uploads/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Aplicação Next.js
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
# Activar o site e recarregar Nginx
sudo ln -s /etc/nginx/sites-available/medfreela /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Certificado SSL gratuito (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d medfreela.ao -d www.medfreela.ao
```

### 5. Script completo de deploy automatizado

Guardar como `/var/www/medfreela/deploy.sh`:

```bash
#!/bin/bash
set -e

APP_DIR="/var/www/medfreela"
BRANCH="${1:-main}"

echo "==> Deploy branch: $BRANCH"
cd "$APP_DIR"

echo "==> Pull do GitHub..."
git fetch origin
git reset --hard "origin/$BRANCH"

echo "==> Instalar dependências..."
npm install --production=false

echo "==> Gerar Prisma client..."
npx prisma generate

echo "==> Sincronizar base de dados..."
npx prisma db push

echo "==> Build..."
npm run build

echo "==> Reload PM2..."
pm2 reload medfreela

echo "==> Deploy concluído!"
pm2 status
```

```bash
chmod +x /var/www/medfreela/deploy.sh

# Usar:
/var/www/medfreela/deploy.sh
# ou para uma branch específica:
/var/www/medfreela/deploy.sh staging
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
public/
└── sw.js             # Service Worker (PWA + push notifications)
```
