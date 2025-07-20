# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import base64
import logging
import os

from src.podcast.graph.state import PodcastState
from src.tools.google_gemini_tts import GoogleGeminiTTS

logger = logging.getLogger(__name__)


def tts_node(state: PodcastState):
    logger.info("Generating audio chunks for podcast...")
    try:
        tts_client = _create_tts_client()
        logger.info(f"Processing {len(state['script'].lines)} lines of script")

        for i, line in enumerate(state["script"].lines):
            # Set voice based on speaker gender
            # Using different voices for male and female speakers
            # For Portuguese content, we'll use more neutral voices
            # TODO: Find Portuguese-specific voices for better pronunciation
            voice_name = "Aoede" if line.speaker == "male" else "Charon"
            logger.info(
                f"Processing line {i+1}/{len(state['script'].lines)} - Speaker: {line.speaker}, Voice: {voice_name}"
            )
            logger.info(f"Text length: {len(line.paragraph)} characters")
            logger.debug(f"Text: {line.paragraph[:100]}...")

            # Skip empty lines
            if not line.paragraph.strip():
                logger.warning(f"Skipping empty line {i+1}")
                continue

            try:
                result = tts_client.text_to_speech(
                    line.paragraph, voice_name=voice_name
                )
                if result["success"]:
                    audio_data = result["audio_data"]
                    state["audio_chunks"].append(audio_data)
                    logger.info(
                        f"Successfully generated audio for line {i+1}, size: {len(audio_data)} bytes"
                    )
                else:
                    logger.error(
                        f"Failed to generate audio for line {i+1}: {result['error']}"
                    )
                    # Continue processing other lines instead of failing completely
                    logger.warning(f"Continuing with remaining lines...")
            except Exception as e:
                logger.error(f"Exception processing line {i+1}: {str(e)}")
                # Continue with other lines
                logger.warning(f"Continuing with remaining lines...")

        logger.info(f"Successfully generated {len(state['audio_chunks'])} audio chunks")
    except Exception as e:
        logger.exception(f"Error in tts_node: {str(e)}")
        raise

    return {
        "audio_chunks": state["audio_chunks"],
    }


def _create_tts_client():
    api_key = os.getenv("GOOGLE_API_KEY", "")
    logger.info(f"GOOGLE_API_KEY present: {bool(api_key)}")
    if not api_key:
        raise Exception("GOOGLE_API_KEY is not set")
    model = os.getenv("GOOGLE_TTS_MODEL", "gemini-2.5-flash-preview-tts")
    voice_name = os.getenv("GOOGLE_TTS_VOICE", "kore")
    logger.info(f"Using TTS model: {model}, voice: {voice_name}")
    return GoogleGeminiTTS(
        api_key=api_key,
        model=model,
        voice_name=voice_name,
    )
