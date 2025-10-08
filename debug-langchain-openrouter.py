#!/usr/bin/env python3
"""Debug LangChain OpenRouter integration."""

from langchain_openai import ChatOpenAI
import logging

logging.basicConfig(level=logging.DEBUG)

# Test 1: Basic configuration
print("🔍 Test 1: Basic configuration")
try:
    llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        model="google/gemini-2.5-pro",
        api_key="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",
        default_headers={
            "HTTP-Referer": "https://deerflow.ai",
            "X-Title": "DeerFlow",
        }
    )
    response = llm.invoke("Hello test")
    print(f"✅ Success: {response.content[:50]}...")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: With OpenAI API key format
print("\n🔍 Test 2: With OpenAI API key format")
try:
    llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        model="google/gemini-2.5-pro",
        openai_api_key="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",
        default_headers={
            "HTTP-Referer": "https://deerflow.ai",
            "X-Title": "DeerFlow",
        }
    )
    response = llm.invoke("Hello test")
    print(f"✅ Success: {response.content[:50]}...")
except Exception as e:
    print(f"❌ Error: {e}")