# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT


from langgraph.graph import MessagesState

from ..types import Script


class PodcastState(MessagesState):
    """State for the podcast generation."""

    # Input
    input: str = ""

    # Output
    output: bytes | None = None

    # Assets
    script: Script | None = None
    audio_chunks: list[bytes] = []
