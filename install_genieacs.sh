#!/bin/bash

# ==========================================
# TITÃ | ISP - Instalador GenieACS v1.3.0 
# ==========================================
echo "🛠️ Iniciando a Instalação do GenieACS..."

# 1. Instalar GenieACS via NPM
echo "📦 Instalando pacote global do GenieACS..."
sudo npm install -g genieacs@1.3.0-dev

# 2. Criar usuário de sistema
echo "👤 Criando usuário de sistema 'genieacs'..."
sudo useradd --system --no-create-home --user-group genieacs || echo "Usuário já existe."

# 3. Criar diretórios
echo "📁 Criando diretórios de extensões e configuração..."
sudo mkdir -p /opt/genieacs/ext
sudo chown -R genieacs:genieacs /opt/genieacs/ext

# 4. Criar arquivo de variáveis de ambiente
echo "📝 Criando genieacs.env..."
sudo bash -c 'cat <<EOF > /opt/genieacs/genieacs.env
GENIEACS_CWMP_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-cwmp-access.log
GENIEACS_NBI_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-nbi-access.log
GENIEACS_FS_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-fs-access.log
GENIEACS_UI_ACCESS_LOG_FILE=/var/log/genieacs/genieacs-ui-access.log
GENIEACS_DEBUG_FILE=/var/log/genieacs/genieacs-debug.yaml
NODE_OPTIONS=--enable-source-maps
GENIEACS_EXT_DIR=/opt/genieacs/ext
EOF'

# 5. Gerar JWT Seguro
echo "🔑 Gerando JWT Secret..."
sudo bash -c 'node -e "console.log(\"GENIEACS_UI_JWT_SECRET=\" + require(\"crypto\").randomBytes(128).toString(\"hex\"))" >> /opt/genieacs/genieacs.env'

# Permissões do env
sudo chown genieacs:genieacs /opt/genieacs/genieacs.env
sudo chmod 600 /opt/genieacs/genieacs.env

# 6. Criar Logs
echo "📂 Criando diretório de logs..."
sudo mkdir -p /var/log/genieacs
sudo chown genieacs:genieacs /var/log/genieacs

# 7. Criar serviços Systemd
echo "⚙️ Configurando serviços do Systemd..."

# CWMP
sudo bash -c 'cat <<EOF > /etc/systemd/system/genieacs-cwmp.service
[Unit]
Description=GenieACS CWMP
After=network.target

[Service]
User=genieacs
EnvironmentFile=/opt/genieacs/genieacs.env
ExecStart=$(which genieacs-cwmp)

[Install]
WantedBy=default.target
EOF'

# NBI
sudo bash -c 'cat <<EOF > /etc/systemd/system/genieacs-nbi.service
[Unit]
Description=GenieACS NBI
After=network.target

[Service]
User=genieacs
EnvironmentFile=/opt/genieacs/genieacs.env
ExecStart=$(which genieacs-nbi)

[Install]
WantedBy=default.target
EOF'

# FS
sudo bash -c 'cat <<EOF > /etc/systemd/system/genieacs-fs.service
[Unit]
Description=GenieACS FS
After=network.target

[Service]
User=genieacs
EnvironmentFile=/opt/genieacs/genieacs.env
ExecStart=$(which genieacs-fs)

[Install]
WantedBy=default.target
EOF'

# UI
sudo bash -c 'cat <<EOF > /etc/systemd/system/genieacs-ui.service
[Unit]
Description=GenieACS UI
After=network.target

[Service]
User=genieacs
EnvironmentFile=/opt/genieacs/genieacs.env
ExecStart=$(which genieacs-ui)

[Install]
WantedBy=default.target
EOF'

# 8. Logrotate
echo "🔄 Configurando logrotate..."
sudo bash -c 'cat <<EOF > /etc/logrotate.d/genieacs
/var/log/genieacs/*.log /var/log/genieacs/*.yaml {
    daily
    rotate 30
    compress
    delaycompress
    dateext
}
EOF'

# 9. Iniciar serviços
echo "🚀 Iniciando e habilitando serviços..."
sudo systemctl daemon-reload

for service in genieacs-cwmp genieacs-nbi genieacs-fs genieacs-ui; do
    sudo systemctl enable $service
    sudo systemctl start $service
done

echo "✅ Instalação do GenieACS concluída! Status dos serviços:"
sudo systemctl status genieacs-cwmp --no-pager | head -n 3
sudo systemctl status genieacs-nbi --no-pager | head -n 3

echo "⚠️ NOTA: O GenieACS requer MongoDB rodando na porta 27017 para funcionar!"
