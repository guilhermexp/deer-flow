#!/bin/bash

echo "🔍 Testando chamada direta ao backend (corrigida)..."
echo ""

# Testar com Kimi K2
curl -X POST http://localhost:8005/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [{"role": "user", "content": "Olá, teste simples"}],
    "thread_id": "test-'$(date +%s)'",
    "model": "moonshotai/kimi-k2",
    "max_plan_iterations": 2,
    "max_step_num": 3,
    "max_search_results": 3,
    "auto_accepted_plan": true,
    "enable_background_investigation": false,
    "report_style": "academic",
    "enable_deep_thinking": false,
    "mcp_settings": {},
    "resources": []
  }' \
  -N 2>&1 | head -30

echo ""
echo "✅ Teste concluído"