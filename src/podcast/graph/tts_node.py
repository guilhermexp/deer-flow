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
            # Note: gemini-2.5-flash-preview-tts may have different voice names
            voice_name = "Puck" if line.speaker == "male" else "Kore"
            logger.info(f"Processing line {i+1}/{len(state['script'].lines)} - Speaker: {line.speaker}, Voice: {voice_name}")
            logger.debug(f"Text: {line.paragraph[:50]}...")
            
            result = tts_client.text_to_speech(line.paragraph, voice_name=voice_name)
            if result["success"]:
                audio_data = result["audio_data"]
                state["audio_chunks"].append(audio_data)
                logger.info(f"Successfully generated audio for line {i+1}")
            else:
                logger.error(f"Failed to generate audio for line {i+1}: {result['error']}")
                raise Exception(f"TTS failed: {result['error']}")
                
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
