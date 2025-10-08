#!/bin/bash

echo "🔍 Testing OpenRouter API with curl..."

# Test with correct headers
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer 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" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: https://deerflow.ai" \
  -H "X-Title: DeerFlow" \
  -d '{
    "model": "google/gemini-2.5-pro",
    "messages": [
      {
        "role": "user",
        "content": "Hello, test"
      }
    ],
    "stream": false
  }' | jq .

echo ""
echo "✅ Test completed"