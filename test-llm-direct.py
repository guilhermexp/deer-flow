#!/usr/bin/env python3
"""Test LLM configuration directly."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.llms.llm import get_llm_by_type
from src.config import load_yaml_config
import logging

logging.basicConfig(level=logging.DEBUG)

def test_llm_configs():
    """Test all LLM configurations."""
    
    # Load config
    config_path = os.path.join(os.path.dirname(__file__), "conf.yaml")
    conf = load_yaml_config(config_path)
    
    print("🔍 Testing LLM configurations...\n")
    
    # Test default basic model
    print("📊 Test 1: Default Basic Model (Gemini)")
    try:
        llm = get_llm_by_type("basic")
        response = llm.invoke("Hello, test")
        print(f"✅ Success: {response.content[:50]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n📊 Test 2: Kimi K2 Model")
    try:
        llm = get_llm_by_type("basic", "moonshotai/kimi-k2")
        response = llm.invoke("Hello, test with Kimi")
        print(f"✅ Success: {response.content[:50]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n📊 Test 3: Grok-4 Model")
    try:
        llm = get_llm_by_type("basic", "grok-4-latest")
        response = llm.invoke("Hello, test with Grok")
        print(f"✅ Success: {response.content[:50]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n📊 Test 4: DeepSeek V3 Model")
    try:
        llm = get_llm_by_type("basic", "deepseek/deepseek-chat-v3-0324:free")
        response = llm.invoke("Hello, test with DeepSeek")
        print(f"✅ Success: {response.content[:50]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Print loaded configurations
    print("\n🔧 Loaded configurations:")
    print(f"BASIC_MODEL: {conf.get('BASIC_MODEL', {})}")
    print(f"ALTERNATIVE_MODELS keys: {list(conf.get('ALTERNATIVE_MODELS', {}).keys())}")

if __name__ == "__main__":
    test_llm_configs()