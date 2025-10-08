#!/bin/bash

echo "🔍 Testando chamada direta ao backend com selected_model..."
echo ""

# Testar com Gemini
echo "📊 Teste 1: Google Gemini"
curl -X POST http://localhost:8005/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [{"role": "user", "content": "Olá, teste simples"}],
    "thread_id": "test-'$(date +%s)'-gemini",
    "selected_model": "google/gemini-2.5-pro",
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
  -N 2>&1 | head -20

echo ""
echo "📊 Teste 2: Kimi K2"
curl -X POST http://localhost:8005/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [{"role": "user", "content": "Olá, teste com Kimi"}],
    "thread_id": "test-'$(date +%s)'-kimi",
    "selected_model": "moonshotai/kimi-k2",
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
  -N 2>&1 | head -20

echo ""
echo "📊 Teste 3: Grok-4"
curl -X POST http://localhost:8005/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [{"role": "user", "content": "Olá, teste com Grok"}],
    "thread_id": "test-'$(date +%s)'-grok",
    "selected_model": "grok-4-latest",
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
  -N 2>&1 | head -20

echo ""
echo "✅ Testes concluídos"