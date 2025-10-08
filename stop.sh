#!/bin/bash

echo "🛑 Parando DeerFlow..."
echo "====================="

# Parar processos
pkill -f "server.py" 2>/dev/null && echo "✅ Backend parado" || echo "⚠️  Backend não estava rodando"
pkill -f "next dev" 2>/dev/null && echo "✅ Frontend parado" || echo "⚠️  Frontend não estava rodando"

# Aguardar um momento
sleep 1

# Verificar se ainda há processos rodando
if pgrep -f "server.py\|next dev" > /dev/null; then
    echo "⚠️  Alguns processos ainda estão rodando. Forçando parada..."
    pkill -9 -f "server.py" 2>/dev/null
    pkill -9 -f "next dev" 2>/dev/null
    sleep 1
fi

echo ""
echo "✅ DeerFlow parado com sucesso!"