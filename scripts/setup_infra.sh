#!/bin/bash
set -e

# ==========================================
# TITÃ | ISP - Infrastructure Setup Script
# Instala: Docker, Docker Compose, GenieACS
# ==========================================

echo "🚀 TITÃ | ISP — Configurando infraestrutura completa..."
echo "========================================================="

# ─── STEP 1: Docker ───────────────────────────────────────────
echo ""
echo "📦 PASSO 1: Instalando Docker Engine..."
apt-get update -qq
apt-get install -y ca-certificates curl gnupg lsb-release

# Adicionar chave GPG do Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Adicionar Repositório Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -qq
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Adicionar o usuário atual ao grupo docker (para não precisar de sudo)
usermod -aG docker $SUDO_USER

systemctl enable docker
systemctl start docker

echo "✅ Docker instalado com sucesso!"

# ─── STEP 2: MongoDB & Redis (para GenieACS e API) ───────────
echo ""
echo "📦 PASSO 2: Criando docker-compose da infraestrutura..."

# Já criamos o arquivo docker-compose.infra.yml na raiz do projeto
echo "✅ docker-compose.infra.yml criado (pelo script de setup do projeto)."

# ─── STEP 3: Instalar GenieACS via NPM ───────────────────────
echo ""
echo "📦 PASSO 3: Instalando GenieACS (Versão Estável)..."
npm install -g genieacs

# ─── STEP 4: Usuário e Diretórios ────────────────────────────
echo ""
echo "👤 PASSO 4: Configurando usuário e diretórios..."
useradd --system --no-create-home --user-group genieacs 2>/dev/null || echo "  → Usuário 'genieacs' já existe."
mkdir -p /opt/genieacs/ext
chown -R genieacs:genieacs /opt/genieacs/ext
mkdir -p /var/log/genieacs
chown genieacs:genieacs /var/log/genieacs

# ─── STEP 5: Arquivo de Configuração ─────────────────────────
echo ""
echo "📝 PASSO 5: Gerando configuração do GenieACS..."

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(128).toString('hex'))")

cat <<EOF > /opt/genieacs/genieacs.env
GENIEACS_CWMP_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-cwmp-access.log
GENIEACS_NBI_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-nbi-access.log
GENIEACS_FS_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-fs-access.log
GENIEACS_UI_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-ui-access.log
GENIEACS_DEBUG_FILE=/var/log/genieacs/genieacs-debug.yaml
NODE_OPTIONS=--enable-source-maps
GENIEACS_EXT_DIR=/opt/genieacs/ext
GENIEACS_MONGODB_CONNECTION_URL=mongodb://localhost:27017/genieacs
GENIEACS_UI_JWT_SECRET=${JWT_SECRET}
EOF

chown genieacs:genieacs /opt/genieacs/genieacs.env
chmod 600 /opt/genieacs/genieacs.env
echo "✅ Configuração gerada em /opt/genieacs/genieacs.env"

# ─── STEP 6: Systemd Services ────────────────────────────────
echo ""
echo "⚙️ PASSO 6: Criando serviços systemd..."

GENIE_BIN_DIR=$(dirname $(which genieacs-cwmp))

for svc in cwmp nbi fs ui; do
cat <<EOF > /etc/systemd/system/genieacs-${svc}.service
[Unit]
Description=GenieACS ${svc^^}
After=network.target

[Service]
User=genieacs
EnvironmentFile=/opt/genieacs/genieacs.env
ExecStart=${GENIE_BIN_DIR}/genieacs-${svc}

[Install]
WantedBy=default.target
EOF
echo "  → genieacs-${svc}.service criado"
done

# ─── STEP 7: Logrotate ───────────────────────────────────────
cat <<'EOF' > /etc/logrotate.d/genieacs
/var/log/genieacs/*.log /var/log/genieacs/*.yaml {
    daily
    rotate 30
    compress
    delaycompress
    dateext
}
EOF
echo "✅ Logrotate configurado."

echo ""
echo "========================================================="
echo "🎉 INFRA CONFIGURADA! Agora subindo serviços..."
echo ""
echo "⚠️  PRÓXIMOS PASSOS MANUAIS:"
echo ""
echo "  1. Feche este terminal e abra um novo (para o grupo docker entrar em vigor)"
echo "  2. Na raiz do projeto, rode:"
echo ""
echo "     cd ~/\"painel jmnet\""
echo "     docker compose -f docker-compose.infra.yml up -d"
echo "     sudo systemctl daemon-reload"
echo "     sudo systemctl enable --now genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui"
echo ""
echo "  3. Verifique os serviços:"
echo "     sudo systemctl status genieacs-nbi --no-pager"
echo ""
echo "  GenieACS UI:  http://localhost:3000"
echo "  GenieACS NBI: http://localhost:7557"
echo "  GenieACS CWMP:http://localhost:7547"
echo ""
