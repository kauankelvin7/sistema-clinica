#!/usr/bin/env bash
# build.sh - Script de build para Render

set -o errexit

echo "📦 Instalando dependências Python..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "� Instalando LibreOffice para conversão PDF..."
apt-get update -qq
apt-get install -y -qq libreoffice libreoffice-writer

echo "�🗄️ Criando tabelas do banco de dados..."
python -c "from core.db_manager import create_tables; create_tables()"

echo "✅ Build concluído!"
