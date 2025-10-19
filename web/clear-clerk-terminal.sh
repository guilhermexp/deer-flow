#!/bin/bash

echo "🔧 RESOLVENDO ERRO DE CLERK AUTH"
echo "================================"
echo ""

echo "🛑 Parando servidores..."
# Matar processos nas portas 4000 e 8005
lsof -ti:4000 | xargs -r kill -9 2>/dev/null || true
lsof -ti:8005 | xargs -r kill -9 2>/dev/null || true

echo "🧹 Limpando dados do browser..."
# Limpar dados do Chrome relacionados ao localhost
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Local\ Storage/leveldb/localhost* 2>/dev/null || true
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Session\ Storage/localhost* 2>/dev/null || true
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/IndexedDB/http_localhost* 2>/dev/null || true

# Limpar dados do Safari
rm -rf ~/Library/Safari/LocalStorage/http_localhost* 2>/dev/null || true
rm -rf ~/Library/Safari/WebsiteData/LocalStorage/http_localhost* 2>/dev/null || true

echo "✅ Dados do browser limpos"

echo ""
echo "🔄 Reiniciando servidores..."

# Voltar ao diretório raiz
cd /Users/guilhermevarela/Public/deer-flow

# Iniciar backend
echo "🐍 Iniciando backend na porta 8005..."
uv run server.py &
BACKEND_PID=$!

# Aguardar 3 segundos para o backend iniciar
sleep 3

# Iniciar frontend
echo "⚛️ Iniciando frontend na porta 4000..."
cd web
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "✅ SERVIDORES INICIADOS"
echo "📍 Backend: http://localhost:8005"
echo "📍 Frontend: http://localhost:4000"
echo ""
echo "🔧 Para resolver o erro de auth, execute no DevTools do browser:"
echo ""
echo "localStorage.clear(); sessionStorage.clear(); document.cookie.split(';').forEach(c => document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/')); window.location.reload();"
echo ""
echo "Ou acesse: http://localhost:4000/clear-all-auth.html"
echo ""

# Aguardar 5 segundos e abrir o browser
sleep 5
echo "🌐 Abrindo browser..."
open -a "Google Chrome" http://localhost:4000

echo ""
echo "PIDs dos processos:"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Para parar os servidores:"
echo "kill $BACKEND_PID $FRONTEND_PID"