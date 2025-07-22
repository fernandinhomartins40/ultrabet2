#!/bin/bash

# Script para iniciar o Supabase Panel em produção
# Este script é usado como backup caso o deploy automático falhe

APP_DIR="/opt/supabase-panel"
VPS_IP="82.25.69.57"

echo "🚀 Iniciando Supabase Panel..."

# Navegar para diretório
cd $APP_DIR

# Parar processos existentes
echo "⏹️ Parando processos existentes..."
pm2 delete all 2>/dev/null || true

# Definir variáveis de ambiente
export NODE_ENV=production
export PORT=5000
export VPS_IP=$VPS_IP
export DOCKER_PATH=$APP_DIR/docker
export DATA_PATH=$APP_DIR/panel/data

# Criar diretórios se não existirem
mkdir -p panel/data
mkdir -p docker/instances

# Instalar dependências se necessário
echo "📦 Verificando dependências..."
cd panel/backend
if [ ! -d "node_modules" ]; then
    npm install --production
fi

# Fazer build do frontend se necessário
cd ../frontend
if [ ! -d "dist" ]; then
    npm install
    npm run build
fi

# Voltar para backend e iniciar
cd ../backend
echo "🚀 Iniciando backend..."
pm2 start server.js --name "supabase-panel-backend" --env production

# Reiniciar nginx
echo "🌐 Reiniciando Nginx..."
systemctl restart nginx

# Verificar status
sleep 5
echo "📊 Status dos serviços:"
pm2 list
systemctl status nginx --no-pager -l

echo "✅ Supabase Panel iniciado!"
echo "🌐 Acesse: http://$VPS_IP"