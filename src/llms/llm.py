# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from pathlib import Path
from typing import Any, Dict
import os
import httpx
import logging

from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI, AzureChatOpenAI

logger = logging.getLogger(__name__)
from langchain_deepseek import ChatDeepSeek
from typing import get_args

from src.config import load_yaml_config
from src.config.agents import LLMType

# Cache for LLM instances
_llm_cache: dict[str, BaseChatModel] = {}


def _get_config_file_path() -> str:
    """Get the path to the configuration file."""
    return str((Path(__file__).parent.parent.parent / "conf.yaml").resolve())


def _get_llm_type_config_keys() -> dict[str, str]:
    """Get mapping of LLM types to their configuration keys."""
    return {
        "reasoning": "REASONING_MODEL",
        "basic": "BASIC_MODEL",
        "vision": "VISION_MODEL",
    }


def _get_env_llm_conf(llm_type: str) -> Dict[str, Any]:
    """
    Get LLM configuration from environment variables.
    Environment variables should follow the format: {LLM_TYPE}__{KEY}
    e.g., BASIC_MODEL__api_key, BASIC_MODEL__base_url
    """
    prefix = f"{llm_type.upper()}_MODEL__"
    conf = {}
    for key, value in os.environ.items():
        if key.startswith(prefix):
            conf_key = key[len(prefix) :].lower()
            conf[conf_key] = value
    return conf


def _create_llm_use_conf(llm_type: LLMType, conf: Dict[str, Any]) -> BaseChatModel:
    """Create LLM instance using configuration."""
    llm_type_config_keys = _get_llm_type_config_keys()
    config_key = llm_type_config_keys.get(llm_type)

    if not config_key:
        raise ValueError(f"Unknown LLM type: {llm_type}")

    llm_conf = conf.get(config_key, {})
    if not isinstance(llm_conf, dict):
        raise ValueError(f"Invalid LLM configuration for {llm_type}: {llm_conf}")

    # Get configuration from environment variables
    env_conf = _get_env_llm_conf(llm_type)

    # Merge configurations, with environment variables taking precedence
    merged_conf = {**llm_conf, **env_conf}

    if not merged_conf:
        raise ValueError(f"No configuration found for LLM type: {llm_type}")

    # Add max_retries to handle rate limit errors
    if "max_retries" not in merged_conf:
        merged_conf["max_retries"] = 3

    # Check if this is OpenRouter
    is_openrouter = "openrouter.ai" in merged_conf.get("base_url", "")

    # Add OpenRouter specific headers if needed
    if is_openrouter:
        merged_conf["default_headers"] = {
            "HTTP-Referer": "https://deerflow.ai",
            "X-Title": "DeerFlow",
        }

        # Force Google provider for Gemini models
        if "gemini" in merged_conf.get("model", "").lower():
            merged_conf["model_kwargs"] = merged_conf.get("model_kwargs", {})
            merged_conf["model_kwargs"]["extra_body"] = {
                "provider": {"order": ["google"], "require_parameters": True}
            }

        # Force Groq provider for Kimi models
        elif "kimi" in merged_conf.get("model", "").lower():
            merged_conf["model_kwargs"] = merged_conf.get("model_kwargs", {})
            merged_conf["model_kwargs"]["extra_body"] = {
                "provider": {"order": ["groq"], "require_parameters": True}
            }
            # Kimi-specific settings for better tool calling
            if "temperature" not in merged_conf:
                merged_conf["temperature"] = 0.7
            # Ensure we use a reasonable max_tokens for Kimi
            if "max_tokens" not in merged_conf:
                merged_conf["max_tokens"] = 8192

    # Handle SSL verification settings
    verify_ssl = merged_conf.pop("verify_ssl", True)

    # Create custom HTTP client if SSL verification is disabled
    if not verify_ssl:
        http_client = httpx.Client(verify=False)
        http_async_client = httpx.AsyncClient(verify=False)
        merged_conf["http_client"] = http_client
        merged_conf["http_async_client"] = http_async_client

    # Check for Azure OpenAI
    if "azure_endpoint" in merged_conf or os.getenv("AZURE_OPENAI_ENDPOINT"):
        return AzureChatOpenAI(**merged_conf)

    # Use ChatOpenAI for OpenRouter (OpenAI-compatible) or non-reasoning models
    # Use ChatDeepSeek only for reasoning models with DeepSeek API
    if is_openrouter or llm_type != "reasoning":
        return ChatOpenAI(**merged_conf)
    else:
        merged_conf["api_base"] = merged_conf.pop("base_url", None)
        return ChatDeepSeek(**merged_conf)


def get_llm_by_type(
    llm_type: LLMType,
    model_override: str = None,
) -> BaseChatModel:
    """
    Get LLM instance by type. Returns cached instance if available.

    Args:
        llm_type: The type of LLM to get
        model_override: Optional model name to use instead of the default
    """
    # Create cache key that includes model override
    cache_key = f"{llm_type}:{model_override}" if model_override else llm_type

    if cache_key in _llm_cache:
        return _llm_cache[cache_key]

    conf = load_yaml_config(_get_config_file_path())

    # If model override is specified, check if it's in alternative models
    if model_override and llm_type == "basic":
        alt_models = conf.get("ALTERNATIVE_MODELS", {})
        if "kimi-k2" in model_override.lower() and "kimi-k2" in alt_models:
            # Override the basic model config with kimi-k2 config
            conf["BASIC_MODEL"] = alt_models["kimi-k2"]
        elif "grok-4" in model_override.lower() and "grok-4" in alt_models:
            # Override the basic model config with grok-4 config
            conf["BASIC_MODEL"] = alt_models["grok-4"]
        elif "deepseek" in model_override.lower() and "deepseek-v3" in alt_models:
            # Override the basic model config with deepseek-v3 config
            conf["BASIC_MODEL"] = alt_models["deepseek-v3"]

    llm = _create_llm_use_conf(llm_type, conf)
    _llm_cache[cache_key] = llm
    return llm


def get_configured_llm_models() -> dict[str, list[str]]:
    """
    Get all configured LLM models grouped by type.

    Returns:
        Dictionary mapping LLM type to list of configured model names.
    """
    try:
        conf = load_yaml_config(_get_config_file_path())
        llm_type_config_keys = _get_llm_type_config_keys()

        configured_models: dict[str, list[str]] = {}

        for llm_type in get_args(LLMType):
            # Get configuration from YAML file
            config_key = llm_type_config_keys.get(llm_type, "")
            yaml_conf = conf.get(config_key, {}) if config_key else {}

            # Get configuration from environment variables
            env_conf = _get_env_llm_conf(llm_type)

            # Merge configurations, with environment variables taking precedence
            merged_conf = {**yaml_conf, **env_conf}

            # Check if model is configured
            model_name = merged_conf.get("model")
            if model_name:
                configured_models.setdefault(llm_type, []).append(model_name)

        return configured_models

    except Exception as e:
        # Log error and return empty dict to avoid breaking the application
        logger.warning(f"Failed to load LLM configuration: {e}")
        return {}


# In the future, we will use reasoning_llm and vl_llm for different purposes
# reasoning_llm = get_llm_by_type("reasoning")
# vl_llm = get_llm_by_type("vision")
