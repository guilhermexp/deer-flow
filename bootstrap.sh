#!/bin/bash

echo "🚀 DeerFlow Bootstrap Script"
echo "============================="

# Instalar dependências do backend Python
echo "📦 Installing backend dependencies..."
uv sync

# Navegar para o diretório web e instalar dependências
echo "📦 Installing frontend dependencies..."
cd web
pnpm install

# Voltar ao diretório raiz
cd ..

# Executar o projeto em modo de desenvolvimento
echo ""
echo "🚀 Starting DeerFlow services..."
echo "   Backend: http://localhost:8005"
echo "   Frontend: http://localhost:4000"
echo ""

# Iniciar backend em background
echo "🚀 Starting backend..."
uv run server.py &

# Aguardar backend iniciar
sleep 5

# Iniciar frontend
echo "🚀 Starting frontend..."
cd web
pnpm dev 