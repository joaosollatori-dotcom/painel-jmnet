#!/bin/bash
# TITÃ | API Local Start Script
echo "🚀 Limpando porta 3001..."
fuser -k 3001/tcp || true
sleep 1
echo "🚀 Iniciando TITÃ API em localhost:3001..."
cd "$(dirname "$0")/apps/api"
node --env-file=../../.env dist/server.js
