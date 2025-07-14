# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

"""
Text-to-Speech module using Google Gemini TTS API.
"""

import logging
import wave
from typing import Optional, Dict, Any
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GoogleGeminiTTS:
    """
    Client for Google Gemini Text-to-Speech API.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-2.5-flash-preview-tts",
        voice_name: str = "kore",
    ):
        """
        Initialize the Google Gemini TTS client.

        Args:
            api_key: API key for authentication
            model: Model to use (default: gemini-2.5-flash-preview-tts)
            voice_name: Voice to use (default: Kore)
        """
        self.api_key = api_key
        self.model = model
        self.voice_name = voice_name
        self.client = genai.Client(api_key=api_key)

    def text_to_speech(
        self,
        text: str,
        voice_name: Optional[str] = None,
        output_format: str = "wav",
        sample_rate: int = 24000,
        sample_width: int = 2,
        channels: int = 1,
    ) -> Dict[str, Any]:
        """
        Convert text to speech using Google Gemini TTS API.

        Args:
            text: Text to convert to speech
            voice_name: Voice to use (overrides default)
            output_format: Output format (currently only wav is supported)
            sample_rate: Sample rate for audio (default: 24000)
            sample_width: Sample width in bytes (default: 2)
            channels: Number of audio channels (default: 1)

        Returns:
            Dictionary containing the success status and audio data
        """
        try:
            # Use provided voice_name or fall back to default
            voice_to_use = voice_name or self.voice_name
            
            logger.debug(f"Sending TTS request for text: {text[:50]}...")
            logger.debug(f"Using voice: {voice_to_use}")
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=voice_to_use,
                            )
                        )
                    ),
                )
            )

            # Extract audio data from response
            audio_data = response.candidates[0].content.parts[0].inline_data.data

            # Convert to WAV format if needed
            if output_format == "wav":
                audio_bytes = self._create_wav_bytes(
                    audio_data, channels, sample_rate, sample_width
                )
            else:
                # For now, we only support WAV format
                audio_bytes = audio_data

            return {
                "success": True,
                "audio_data": audio_bytes,
                "format": output_format,
                "voice_used": voice_to_use,
            }

        except Exception as e:
            logger.exception(f"Error in Google Gemini TTS API call: {str(e)}")
            return {
                "success": False,
                "error": f"TTS API call error: {str(e)}",
                "audio_data": None,
            }

    def _create_wav_bytes(
        self, pcm_data: bytes, channels: int, rate: int, sample_width: int
    ) -> bytes:
        """
        Create WAV file bytes from PCM data.

        Args:
            pcm_data: Raw PCM audio data
            channels: Number of channels
            rate: Sample rate
            sample_width: Sample width in bytes

        Returns:
            WAV file as bytes
        """
        import io
        
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(sample_width)
            wf.setframerate(rate)
            wf.writeframes(pcm_data)
        
        wav_buffer.seek(0)
        return wav_buffer.read()

    def set_voice(self, voice_name: str):
        """
        Set the default voice for this client.

        Args:
            voice_name: Name of the voice to use
        """
        self.voice_name = voice_name