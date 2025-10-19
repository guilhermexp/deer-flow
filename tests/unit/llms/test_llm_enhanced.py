# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
from unittest.mock import MagicMock, patch

import pytest

from src.llms.llm import (
    _create_llm_use_conf,
    _get_config_file_path,
    _get_env_llm_conf,
    _get_llm_type_config_keys,
    _llm_cache,
    get_configured_llm_models,
    get_llm_by_type,
    get_llm_token_limit_by_type,
)


class TestGetConfigFilePath:
    """Tests for _get_config_file_path function."""

    def test_config_file_path_returns_correct_path(self):
        """Test that config file path is correctly constructed."""
        result = _get_config_file_path()
        assert result.endswith("conf.yaml")
        assert "deer-flow" in result


class TestGetLlmTypeConfigKeys:
    """Tests for _get_llm_type_config_keys function."""

    def test_returns_expected_mapping(self):
        """Test that the function returns expected LLM type mapping."""
        expected = {
            "reasoning": "REASONING_MODEL",
            "basic": "BASIC_MODEL",
            "vision": "VISION_MODEL",
            "code": "CODE_MODEL",
        }
        result = _get_llm_type_config_keys()
        assert result == expected


class TestGetEnvLlmConf:
    """Tests for _get_env_llm_conf function."""

    def test_extracts_environment_variables(self):
        """Test extraction of LLM configuration from environment variables."""
        env_vars = {
            "BASIC_MODEL__api_key": "test-key",
            "BASIC_MODEL__base_url": "https://api.example.com",
            "BASIC_MODEL__model": "gpt-4",
            "OTHER_VAR": "should-be-ignored",
            "REASONING_MODEL__api_key": "other-key"
        }

        with patch.dict(os.environ, env_vars, clear=True):
            result = _get_env_llm_conf("basic")

            expected = {
                "api_key": "test-key",
                "base_url": "https://api.example.com",
                "model": "gpt-4"
            }
            assert result == expected

    def test_empty_result_when_no_matching_vars(self):
        """Test that empty dict is returned when no matching environment variables."""
        with patch.dict(os.environ, {"OTHER_VAR": "value"}, clear=True):
            result = _get_env_llm_conf("nonexistent")
            assert result == {}

    def test_case_insensitive_key_conversion(self):
        """Test that environment variable keys are converted to lowercase."""
        env_vars = {
            "BASIC_MODEL__API_KEY": "test-key",
            "BASIC_MODEL__Base_URL": "https://api.example.com"
        }

        with patch.dict(os.environ, env_vars, clear=True):
            result = _get_env_llm_conf("basic")
            assert "api_key" in result
            assert "base_url" in result


class TestCreateLlmUseConf:
    """Tests for _create_llm_use_conf function."""

    def test_unknown_llm_type_raises_error(self):
        """Test that unknown LLM type raises ValueError."""
        with pytest.raises(ValueError, match="Unknown LLM type: unknown"):
            _create_llm_use_conf("unknown", {})

    def test_invalid_llm_configuration_raises_error(self):
        """Test that invalid LLM configuration raises ValueError."""
        conf = {"BASIC_MODEL": "not-a-dict"}
        with pytest.raises(ValueError, match="Invalid LLM configuration"):
            _create_llm_use_conf("basic", conf)

    def test_no_configuration_raises_error(self):
        """Test that no configuration raises ValueError."""
        conf = {"BASIC_MODEL": {}}
        with patch('src.llms.llm._get_env_llm_conf', return_value={}):
            with pytest.raises(ValueError, match="No configuration found"):
                _create_llm_use_conf("basic", conf)

    @patch('src.llms.llm.ChatGoogleGenerativeAI')
    @patch('src.llms.llm._get_env_llm_conf')
    def test_google_aistudio_configuration(self, mock_env_conf, mock_google_ai):
        """Test Google AI Studio specific configuration."""
        mock_env_conf.return_value = {}
        mock_google_ai.return_value = MagicMock()

        conf = {
            "BASIC_MODEL": {
                "platform": "google_aistudio",
                "api_key": "test-key",
                "model": "gemini-pro",
                "base_url": "should-be-removed"
            }
        }

        _create_llm_use_conf("basic", conf)

        # Verify Google AI Studio was called with correct parameters
        call_args = mock_google_ai.call_args[1]
        assert call_args["google_api_key"] == "test-key"
        assert call_args["model"] == "gemini-pro"
        assert "base_url" not in call_args
        assert "platform" not in call_args

    @patch('src.llms.llm.AzureChatOpenAI')
    @patch('src.llms.llm._get_env_llm_conf')
    def test_azure_openai_configuration(self, mock_env_conf, mock_azure):
        """Test Azure OpenAI configuration."""
        mock_env_conf.return_value = {}
        mock_azure.return_value = MagicMock()

        conf = {
            "BASIC_MODEL": {
                "azure_endpoint": "https://test.openai.azure.com",
                "api_key": "test-key",
                "model": "gpt-4"
            }
        }

        _create_llm_use_conf("basic", conf)
        mock_azure.assert_called_once()

    @patch('src.llms.llm.ChatDashscope')
    @patch('src.llms.llm._get_env_llm_conf')
    def test_dashscope_configuration(self, mock_env_conf, mock_dashscope):
        """Test Dashscope configuration."""
        mock_env_conf.return_value = {}
        mock_dashscope.return_value = MagicMock()

        conf = {
            "REASONING_MODEL": {
                "base_url": "https://dashscope.aliyuncs.com",
                "api_key": "test-key",
                "model": "qwen-reasoning"
            }
        }

        _create_llm_use_conf("reasoning", conf)

        call_args = mock_dashscope.call_args[1]
        assert call_args["extra_body"]["enable_thinking"] is True

    @patch('src.llms.llm.ChatDeepSeek')
    @patch('src.llms.llm._get_env_llm_conf')
    def test_deepseek_reasoning_configuration(self, mock_env_conf, mock_deepseek):
        """Test DeepSeek reasoning configuration."""
        mock_env_conf.return_value = {}
        mock_deepseek.return_value = MagicMock()

        conf = {
            "REASONING_MODEL": {
                "base_url": "https://api.deepseek.com",
                "api_key": "test-key",
                "model": "deepseek-reasoning"
            }
        }

        _create_llm_use_conf("reasoning", conf)

        call_args = mock_deepseek.call_args[1]
        assert call_args["api_base"] == "https://api.deepseek.com"

    @patch('src.llms.llm.ChatOpenAI')
    @patch('src.llms.llm._get_env_llm_conf')
    def test_openai_configuration(self, mock_env_conf, mock_openai):
        """Test OpenAI configuration."""
        mock_env_conf.return_value = {}
        mock_openai.return_value = MagicMock()

        conf = {
            "BASIC_MODEL": {
                "api_key": "test-key",
                "model": "gpt-4",
                "base_url": "https://api.openai.com"
            }
        }

        _create_llm_use_conf("basic", conf)
        mock_openai.assert_called_once()

    @patch('src.llms.llm.httpx.Client')
    @patch('src.llms.llm.httpx.AsyncClient')
    @patch('src.llms.llm.ChatOpenAI')
    @patch('src.llms.llm._get_env_llm_conf')
    def test_ssl_verification_disabled(self, mock_env_conf, mock_openai, mock_async_client, mock_client):
        """Test configuration with SSL verification disabled."""
        mock_env_conf.return_value = {}
        mock_openai.return_value = MagicMock()
        mock_client_instance = MagicMock()
        mock_async_client_instance = MagicMock()
        mock_client.return_value = mock_client_instance
        mock_async_client.return_value = mock_async_client_instance

        conf = {
            "BASIC_MODEL": {
                "api_key": "test-key",
                "model": "gpt-4",
                "verify_ssl": False
            }
        }

        _create_llm_use_conf("basic", conf)

        mock_client.assert_called_with(verify=False)
        mock_async_client.assert_called_with(verify=False)


class TestGetLlmByType:
    """Tests for get_llm_by_type function."""

    def setUp(self):
        """Clear cache before each test."""
        _llm_cache.clear()

    @patch('src.llms.llm.load_yaml_config')
    @patch('src.llms.llm._create_llm_use_conf')
    def test_returns_cached_instance(self, mock_create_llm, mock_load_config):
        """Test that cached LLM instance is returned."""
        # Clear cache first
        _llm_cache.clear()

        mock_llm = MagicMock()
        mock_create_llm.return_value = mock_llm
        mock_load_config.return_value = {"BASIC_MODEL": {"api_key": "test"}}

        # First call should create and cache
        result1 = get_llm_by_type("basic")

        # Second call should return cached instance
        result2 = get_llm_by_type("basic")

        assert result1 is result2
        assert mock_create_llm.call_count == 1

    @patch('src.llms.llm.load_yaml_config')
    @patch('src.llms.llm._create_llm_use_conf')
    def test_creates_new_instance_when_not_cached(self, mock_create_llm, mock_load_config):
        """Test that new LLM instance is created when not cached."""
        _llm_cache.clear()

        mock_llm = MagicMock()
        mock_create_llm.return_value = mock_llm
        mock_load_config.return_value = {"BASIC_MODEL": {"api_key": "test"}}

        result = get_llm_by_type("basic")

        assert result is mock_llm
        assert "basic" in _llm_cache


class TestGetConfiguredLlmModels:
    """Tests for get_configured_llm_models function."""

    @patch('src.llms.llm.load_yaml_config')
    @patch('src.llms.llm._get_env_llm_conf')
    def test_returns_configured_models(self, mock_env_conf, mock_load_config):
        """Test that configured models are returned correctly."""
        mock_load_config.return_value = {
            "BASIC_MODEL": {"model": "gpt-4"},
            "REASONING_MODEL": {"model": "deepseek-reasoning"},
            "VISION_MODEL": {"model": "gpt-4-vision"}
        }
        mock_env_conf.return_value = {}

        result = get_configured_llm_models()

        expected = {
            "basic": ["gpt-4"],
            "reasoning": ["deepseek-reasoning"],
            "vision": ["gpt-4-vision"]
        }

        assert result == expected

    @patch('src.llms.llm.load_yaml_config')
    def test_handles_exception_gracefully(self, mock_load_config):
        """Test that exceptions are handled gracefully."""
        mock_load_config.side_effect = Exception("Config error")

        result = get_configured_llm_models()

        assert result == {}


class TestGetLlmTokenLimitByType:
    """Tests for get_llm_token_limit_by_type function."""

    @patch('src.llms.llm.load_yaml_config')
    def test_returns_token_limit(self, mock_load_config):
        """Test that token limit is returned correctly."""
        mock_load_config.return_value = {
            "BASIC_MODEL": {"token_limit": 4096}
        }

        result = get_llm_token_limit_by_type("basic")

        assert result == 4096

    @patch('src.llms.llm.load_yaml_config')
    def test_returns_none_when_not_configured(self, mock_load_config):
        """Test that None is returned when token limit is not configured."""
        mock_load_config.return_value = {
            "BASIC_MODEL": {}
        }

        result = get_llm_token_limit_by_type("basic")

        assert result is None
