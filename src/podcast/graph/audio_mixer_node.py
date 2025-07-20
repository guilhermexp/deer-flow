# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import logging

from src.podcast.graph.state import PodcastState

logger = logging.getLogger(__name__)


def audio_mixer_node(state: PodcastState):
    logger.info("Mixing audio chunks for podcast...")
    audio_chunks = state["audio_chunks"]

    # Log details about the chunks
    logger.info(f"Total audio chunks to mix: {len(audio_chunks)}")
    logger.info(f"Total script lines: {len(state['script'].lines)}")

    if len(audio_chunks) != len(state["script"].lines):
        logger.warning(
            f"Mismatch: {len(audio_chunks)} audio chunks vs {len(state['script'].lines)} script lines"
        )

    # Log size of each chunk
    for i, chunk in enumerate(audio_chunks):
        logger.debug(f"Chunk {i+1}: {len(chunk)} bytes")

    combined_audio = b"".join(audio_chunks)
    logger.info(f"Combined audio size: {len(combined_audio)} bytes")
    logger.info("The podcast audio is now ready.")
    return {"output": combined_audio}
