#!/usr/bin/env python3
"""Debug OpenRouter authentication."""

import httpx

# Test OpenRouter API directly
api_key = "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"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://deerflow.ai",
    "X-Title": "DeerFlow",
}

data = {
    "model": "google/gemini-2.5-pro",
    "messages": [
        {"role": "user", "content": "Hello, test"}
    ],
    "stream": False
}

print("🔍 Testing OpenRouter API directly...")
print(f"Headers: {headers}")
print(f"Data: {data}")

try:
    response = httpx.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=data,
        timeout=30
    )
    
    print(f"\n📊 Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    
# Test with different model
print("\n🔍 Testing with Kimi K2...")
data["model"] = "moonshotai/kimi-k2"
try:
    response = httpx.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=data,
        timeout=30
    )
    
    print(f"📊 Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
except Exception as e:
    print(f"❌ Error: {e}")