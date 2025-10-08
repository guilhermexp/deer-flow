#!/bin/bash

echo "🔍 Testando API do DeerFlow..."
echo ""

# Testar health endpoint
echo "1. Testando /health:"
curl -s http://localhost:8005/health | jq .

echo ""
echo "2. Testando /api/config:"
curl -s http://localhost:8005/api/config | jq .

echo ""
echo "3. Testando CORS com OPTIONS:"
curl -s -X OPTIONS http://localhost:8005/api/chat/stream \
  -H "Origin: http://localhost:4000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control-)"

echo ""
echo "✅ Teste concluído"