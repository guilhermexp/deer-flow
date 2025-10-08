#!/usr/bin/env python3
"""Test config loading."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.config import load_yaml_config
from pathlib import Path

config_path = Path(__file__).parent / "conf.yaml"
conf = load_yaml_config(str(config_path))

print("🔍 Loaded configuration:")
print(f"BASIC_MODEL: {conf.get('BASIC_MODEL', {})}")
print(f"ALTERNATIVE_MODELS: {list(conf.get('ALTERNATIVE_MODELS', {}).keys())}")

# Test if we can access the API key
basic_model_conf = conf.get('BASIC_MODEL', {})
print(f"\n📊 Basic Model Details:")
print(f"  Model: {basic_model_conf.get('model')}")
print(f"  Base URL: {basic_model_conf.get('base_url')}")
print(f"  API Key: {basic_model_conf.get('api_key', 'NOT FOUND')[:20]}...")