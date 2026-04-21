#!/bin/bash
# TITÃ | API Local Start Script
echo "🚀 Iniciando TITÃ API em localhost:3001..."
cd "$(dirname "$0")/apps/api"
node dist/server.js
