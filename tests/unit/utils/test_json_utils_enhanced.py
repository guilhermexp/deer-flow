# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import json
from unittest.mock import patch

from src.utils.json_utils import repair_json_output, sanitize_args


class TestSanitizeArgs:
    """Tests for sanitize_args function."""

    def test_sanitize_string_with_brackets(self):
        """Test sanitization of string containing brackets."""
        input_str = "array[0] = {key: value}"
        expected = "array&#91;0&#93; = &#123;key: value&#125;"
        result = sanitize_args(input_str)
        assert result == expected

    def test_sanitize_non_string_input(self):
        """Test that non-string inputs return empty string."""
        assert sanitize_args(123) == ""
        assert sanitize_args(None) == ""
        assert sanitize_args([1, 2, 3]) == ""
        assert sanitize_args({"key": "value"}) == ""

    def test_sanitize_empty_string(self):
        """Test sanitization of empty string."""
        assert sanitize_args("") == ""

    def test_sanitize_string_without_special_chars(self):
        """Test string without special characters remains unchanged."""
        input_str = "hello world"
        assert sanitize_args(input_str) == input_str

    def test_sanitize_complex_json_like_string(self):
        """Test sanitization of complex JSON-like string."""
        input_str = '{"items": [1, 2, 3], "nested": {"value": true}}'
        expected = '&#123;"items": &#91;1, 2, 3&#93;, "nested": &#123;"value": true&#125;&#125;'
        result = sanitize_args(input_str)
        assert result == expected


class TestRepairJsonOutput:
    """Tests for repair_json_output function."""

    def test_valid_json_object(self):
        """Test that valid JSON object is preserved."""
        valid_json = '{"name": "test", "value": 123}'
        result = repair_json_output(valid_json)
        # Should be valid JSON
        assert json.loads(result) == {"name": "test", "value": 123}

    def test_valid_json_array(self):
        """Test that valid JSON array is preserved."""
        valid_json = '[1, 2, 3, "test"]'
        result = repair_json_output(valid_json)
        assert json.loads(result) == [1, 2, 3, "test"]

    def test_malformed_json_repair(self):
        """Test repair of malformed JSON."""
        malformed_json = '{"name": "test", "value": 123,}'  # trailing comma
        result = repair_json_output(malformed_json)
        # Should be repaired and valid
        parsed = json.loads(result)
        assert parsed == {"name": "test", "value": 123}

    def test_non_json_string_unchanged(self):
        """Test that non-JSON strings remain unchanged."""
        non_json = "This is just a regular string"
        result = repair_json_output(non_json)
        assert result == non_json

    def test_whitespace_trimming(self):
        """Test that whitespace is trimmed."""
        json_with_whitespace = '  {"key": "value"}  '
        result = repair_json_output(json_with_whitespace)
        assert json.loads(result) == {"key": "value"}

    def test_primitive_value_not_repaired(self):
        """Test that primitive values are not repaired as JSON."""
        with patch('src.utils.json_utils.json_repair.loads') as mock_loads:
            mock_loads.return_value = "just a string"  # primitive value
            result = repair_json_output('"just a string"')
            assert result == '"just a string"'

    def test_json_repair_exception_handling(self):
        """Test that JSON repair exceptions are handled gracefully."""
        with patch('src.utils.json_utils.json_repair.loads') as mock_loads:
            mock_loads.side_effect = Exception("Repair failed")

            malformed_json = '{"incomplete": '
            result = repair_json_output(malformed_json)
            assert result == malformed_json  # Should return original on failure

    @patch('src.utils.json_utils.logger')
    def test_logging_on_non_dict_or_list(self, mock_logger):
        """Test that warning is logged when repaired content is not dict/list."""
        with patch('src.utils.json_utils.json_repair.loads') as mock_loads:
            mock_loads.return_value = "primitive string"

            repair_json_output('"primitive string"')
            mock_logger.warning.assert_called_with(
                "Repaired content is not a valid JSON object or array."
            )

    @patch('src.utils.json_utils.logger')
    def test_logging_on_repair_failure(self, mock_logger):
        """Test that warning is logged when JSON repair fails."""
        with patch('src.utils.json_utils.json_repair.loads') as mock_loads:
            mock_loads.side_effect = ValueError("Invalid JSON")

            repair_json_output('{"invalid": json}')
            mock_logger.warning.assert_called_with("JSON repair failed: Invalid JSON")

    def test_unicode_preservation(self):
        """Test that unicode characters are preserved."""
        unicode_json = '{"message": "Hello 世界", "emoji": "🌍"}'
        result = repair_json_output(unicode_json)
        parsed = json.loads(result)
        assert parsed["message"] == "Hello 世界"
        assert parsed["emoji"] == "🌍"

    def test_ensure_ascii_false(self):
        """Test that ensure_ascii=False is used in json.dumps."""
        unicode_json = '{"text": "café"}'
        result = repair_json_output(unicode_json)
        # Should contain actual unicode characters, not escaped
        assert "café" in result
        assert "\\u" not in result
