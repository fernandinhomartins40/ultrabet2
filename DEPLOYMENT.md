# 🚀 Deploy do Supabase Panel

## Configuração Automática do GitHub Actions

O deploy foi configurado para usar o GitHub Actions com as seguintes características:

### ✅ **Configurações de Deploy**
- **VPS Host**: `82.25.69.57`
- **Usuário**: `root`
- **Senha**: Usa a secret `VPS_PASSWORD` já configurada
- **Diretório**: `/opt/supabase-panel`

### 🔧 **Estrutura de Deploy**

#### **Serviços Principais**
- **Frontend**: Servido pelo Nginx na porta 80
- **Backend API**: Node.js com PM2 na porta 5000
- **Docker**: Para instâncias Supabase

#### **URLs de Acesso**
- **Painel Principal**: `http://82.25.69.57/`
- **API Backend**: `http://82.25.69.57/api/`

### 📋 **Processo de Deploy Automático**

1. **Preparação do Ambiente**
   - Para containers/processos existentes
   - Limpa ambiente anterior

2. **Download do Código**
   - Clona repositório atualizado
   - Verifica estrutura de arquivos

3. **Instalação de Dependências**
   - Node.js 18 LTS
   - Docker + Docker Compose
   - PM2 para gerenciamento de processos
   - Nginx para proxy reverso

4. **Configuração**
   - Cria diretórios necessários
   - Define variáveis de ambiente
   - Configura IP da VPS automaticamente

5. **Build e Instalação**
   - Instala dependências do backend
   - Faz build do frontend React
   - Configura Nginx

6. **Inicialização**
   - Inicia backend com PM2
   - Configura Nginx como proxy
   - Habilita auto-start

7. **Verificações de Saúde**
   - Testa todos os serviços
   - Verifica endpoints HTTP
   - Confirma funcionamento

### 🐳 **Portas para Instâncias Supabase**

O painel gerencia automaticamente as portas das instâncias:
- **Pool de Portas**: 3000-9999
- **Primeira Instância**: Normalmente usa porta 3000
- **Instâncias Subsequentes**: 3001, 3002, etc.

### ⚙️ **Variáveis de Ambiente Configuradas**

```env
NODE_ENV=production
PORT=5000
VPS_IP=82.25.69.57
DOCKER_PATH=/opt/supabase-panel/docker
DATA_PATH=/opt/supabase-panel/panel/data
```

### 🎯 **Como Fazer Deploy**

#### **Automático (Recomendado)**
1. Fazer push para branch `main`
2. GitHub Actions executa automaticamente
3. Deploy completo em ~5 minutos

#### **Manual (Backup)**
```bash
# Conectar na VPS
ssh root@82.25.69.57

# Executar script de produção
cd /opt/supabase-panel
./panel/start-production.sh
```

### 📊 **Monitoramento Pós-Deploy**

#### **Verificar Serviços**
```bash
# Status do backend
pm2 list
pm2 logs supabase-panel-backend

# Status do Nginx
systemctl status nginx

# Status do Docker
docker ps
```

#### **Testar Funcionalidade**
- Acessar `http://82.25.69.57/`
- Criar uma instância de teste
- Verificar se Studio abre corretamente

### 🔧 **Comandos Úteis na VPS**

```bash
# Reiniciar backend
pm2 restart supabase-panel-backend

# Ver logs do backend
pm2 logs supabase-panel-backend

# Reiniciar Nginx
systemctl restart nginx

# Ver instâncias Supabase ativas
docker ps

# Parar todas as instâncias
docker stop $(docker ps -aq)

# Limpar containers antigos
docker system prune -af
```

### 🚨 **Troubleshooting**

#### **Backend não inicia**
```bash
cd /opt/supabase-panel/panel/backend
npm install --production
pm2 restart supabase-panel-backend
```

#### **Frontend não carrega**
```bash
cd /opt/supabase-panel/panel/frontend
npm run build
systemctl restart nginx
```

#### **Erro de permissões Docker**
```bash
usermod -aG docker root
systemctl restart docker
```

### 🔐 **Segurança**

- Nginx configurado como proxy reverso
- Backend isolado na porta 5000 (não exposta)
- Cada instância Supabase com JWT único
- Kong Gateway com credenciais admin/admin por instância

### 📈 **Escalabilidade**

- PM2 gerencia automaticamente o processo backend
- Nginx serve arquivos estáticos eficientemente
- Docker isola cada instância Supabase
- Pool de portas suporta centenas de instâncias

O deploy está otimizado para a VPS Hostinger e deve funcionar automaticamente a cada push no repositório!