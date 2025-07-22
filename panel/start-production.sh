#!/bin/bash

# Script para iniciar o Supabase Panel em produção
# Este script é usado como backup caso o deploy automático falhe

set -e  # Parar em caso de erro

APP_DIR="/opt/supabase-panel"
VPS_IP="82.25.69.57"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🚀 Iniciando Supabase Panel em produção..."

# Verificar se estamos no diretório correto
if [ ! -d "$APP_DIR" ]; then
    log "❌ Diretório $APP_DIR não existe!"
    exit 1
fi

cd $APP_DIR

# Verificar estrutura do projeto
if [ ! -f "panel/backend/server.js" ]; then
    log "❌ Estrutura do projeto não encontrada!"
    exit 1
fi

# Parar processos existentes
log "⏹️ Parando processos existentes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Criar arquivo .env para backend
log "⚙️ Configurando ambiente..."
cat > panel/backend/.env << EOF
NODE_ENV=production
PORT=5000
VPS_IP=$VPS_IP
DOCKER_PATH=$APP_DIR/docker
DATA_PATH=$APP_DIR/panel/data
EOF

# Criar diretórios necessários
mkdir -p panel/data
mkdir -p docker/instances
chmod 755 panel/data docker/instances

# Backend dependencies
log "📦 Verificando dependências do backend..."
cd panel/backend
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    log "📦 Instalando dependências do backend..."
    npm ci --only=production
fi

# Frontend build
log "🏗️ Verificando build do frontend..."
cd ../frontend
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    log "📦 Instalando dependências do frontend..."
    npm ci
    log "🏗️ Fazendo build do frontend..."
    npm run build
    if [ ! -f "dist/index.html" ]; then
        log "❌ Build do frontend falhou!"
        exit 1
    fi
fi

# Configurar Nginx se necessário
log "🌐 Configurando Nginx..."
if [ ! -f "/etc/nginx/sites-available/supabase-panel" ]; then
    cat > /etc/nginx/sites-available/supabase-panel << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    root $APP_DIR/panel/frontend/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /health {
        return 200 "healthy";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Ativar site
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/supabase-panel /etc/nginx/sites-enabled/
    
    # Testar configuração
    if ! nginx -t; then
        log "❌ Configuração do Nginx inválida!"
        exit 1
    fi
fi

# Iniciar backend
log "🚀 Iniciando backend..."
cd $APP_DIR/panel/backend

NODE_ENV=production pm2 start server.js \
    --name "supabase-panel-backend" \
    --time \
    --log-date-format "YYYY-MM-DD HH:mm:ss Z"

# Aguardar backend iniciar
sleep 3

# Verificar se backend está online
if ! pm2 describe supabase-panel-backend | grep -q "online"; then
    log "❌ Backend falhou ao iniciar!"
    pm2 logs supabase-panel-backend --lines 10
    exit 1
fi

# Iniciar Nginx
log "🌐 Iniciando Nginx..."
systemctl start nginx
systemctl enable nginx

# Aguardar Nginx
sleep 2

# Verificar serviços
log "🔍 Verificando serviços..."

# PM2
if pm2 describe supabase-panel-backend | grep -q "online"; then
    log "✅ Backend PM2: ONLINE"
else
    log "❌ Backend PM2: OFFLINE"
    exit 1
fi

# Nginx
if systemctl is-active --quiet nginx; then
    log "✅ Nginx: ATIVO"
else
    log "❌ Nginx: INATIVO"
    exit 1
fi

# Docker
if systemctl is-active --quiet docker; then
    log "✅ Docker: ATIVO"
else
    log "⚠️ Docker: INATIVO - Iniciando..."
    systemctl start docker
    systemctl enable docker
fi

# Teste HTTP
sleep 2
if curl -f -s http://localhost/ >/dev/null 2>&1; then
    log "✅ Frontend: RESPONDENDO"
else
    log "❌ Frontend: NÃO RESPONDE"
    exit 1
fi

if curl -f -s http://localhost/api/info >/dev/null 2>&1; then
    log "✅ API: RESPONDENDO"
else
    log "❌ API: NÃO RESPONDE"
    exit 1
fi

# Auto-start
pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Status final
log "📊 Status final dos serviços:"
pm2 list
log ""
log "🎉 Supabase Panel iniciado com sucesso!"
log "🌐 Acesse: http://$VPS_IP/"
log "🔧 API: http://$VPS_IP/api/info"
log ""
log "📝 Comandos úteis:"
log "  pm2 logs supabase-panel-backend  # Ver logs"
log "  pm2 restart supabase-panel-backend  # Reiniciar"
log "  systemctl status nginx  # Status Nginx"