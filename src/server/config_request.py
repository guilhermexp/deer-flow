# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from pydantic import BaseModel, Field

from src.server.rag_request import RAGConfigResponse


class ConfigResponse(BaseModel):
    """Response model for server config."""

    rag_config: RAGConfigResponse = Field(..., description="The config of the RAG")
    configured_llms: dict[str, list[str]] = Field(..., description="The configured LLM")
