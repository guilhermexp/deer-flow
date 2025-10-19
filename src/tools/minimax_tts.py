# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

"""
Text-to-Speech module using Minimax TTS API.
"""

import logging
from typing import Any

import requests

logger = logging.getLogger(__name__)


class MinimaxTTS:
    """
    Client for Minimax Text-to-Speech API.
    """

    def __init__(
        self,
        api_key: str,
        group_id: str,
        model: str = "speech-02-hd",
        voice_id: str = "Wise_Woman",
        host: str = "api.minimax.io",
    ):
        """
        Initialize the Minimax TTS client.

        Args:
            api_key: API key for authentication
            group_id: Group ID from Minimax
            model: Model to use (speech-02-hd, speech-02-turbo, speech-01-hd, speech-01-turbo)
            voice_id: Voice ID to use
            host: API host
        """
        self.api_key = api_key
        self.group_id = group_id
        self.model = model
        self.voice_id = voice_id
        self.host = host
        self.api_url = f"https://{host}/v1/t2a_v2?GroupId={group_id}"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def text_to_speech(
        self,
        text: str,
        speed: float = 1.0,
        volume: float = 1.0,
        pitch: int = 0,
        format: str = "mp3",
        sample_rate: int = 32000,
        bitrate: int = 128000,
        language_boost: str | None = "Portuguese",
    ) -> dict[str, Any]:
        """
        Convert text to speech using Minimax TTS API.

        Args:
            text: Text to convert to speech (max 5000 characters)
            speed: Speech speed ratio
            volume: Speech volume ratio
            pitch: Speech pitch adjustment (integer value)
            format: Audio format (mp3, wav, etc.)
            sample_rate: Audio sample rate
            bitrate: Audio bitrate
            language_boost: Language/dialect for recognition boost

        Returns:
            Dictionary containing the API response and hex-encoded audio data
        """
        if len(text) > 5000:
            logger.error(f"Text length exceeds 5000 characters: {len(text)}")
            return {"success": False, "error": "Text too long", "audio_data": None}

        request_data = {
            "model": self.model,
            "text": text,
            "stream": False,
            "voice_setting": {
                "voice_id": self.voice_id,
                "speed": speed,
                "vol": volume,
                "pitch": pitch,
            },
            "audio_setting": {
                "sample_rate": sample_rate,
                "bitrate": bitrate,
                "format": format,
                "channel": 1,
            },
        }

        if language_boost:
            request_data["language_boost"] = language_boost

        try:
            sanitized_text = text.replace("\r\n", "").replace("\n", "")
            logger.debug(f"Sending TTS request for text: {sanitized_text[:50]}...")

            response = requests.post(
                self.api_url, json=request_data, headers=self.headers
            )
            response_json = response.json()

            if response.status_code != 200:
                logger.error(f"TTS API error: {response_json}")
                return {"success": False, "error": response_json, "audio_data": None}

            base_resp = response_json.get("base_resp", {})
            if base_resp.get("status_code") != 0:
                logger.error(f"TTS API error: {base_resp.get('status_msg')}")
                return {
                    "success": False,
                    "error": base_resp.get("status_msg"),
                    "audio_data": None,
                }

            data = response_json.get("data", {})
            if data.get("status") != 2 or "audio" not in data:
                logger.error(f"TTS API returned invalid data: {response_json}")
                return {
                    "success": False,
                    "error": "Invalid audio data returned",
                    "audio_data": None,
                }

            # Convert hex audio to bytes
            hex_audio = data["audio"]
            audio_bytes = bytes.fromhex(hex_audio)

            return {
                "success": True,
                "response": response_json,
                "audio_data": audio_bytes,
                "extra_info": response_json.get("extra_info", {}),
            }

        except Exception as e:
            logger.exception(f"Error in TTS API call: {str(e)}")
            return {
                "success": False,
                "error": f"TTS API call error: {str(e)}",
                "audio_data": None,
            }
