# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import re

from pydantic import BaseModel, Field, field_validator

from src.config.report_style import ReportStyle
from src.rag.retriever import Resource


class ContentItem(BaseModel):
    type: str = Field(..., description="The type of content (text, image, etc.)")
    text: str | None = Field(None, description="The text content if type is 'text'")
    image_url: str | None = Field(
        None, description="The image URL if type is 'image'"
    )


class ChatMessage(BaseModel):
    role: str = Field(
        ..., description="The role of the message sender (user or assistant)"
    )
    content: str | list[ContentItem] = Field(
        ...,
        description="The content of the message, either a string or a list of content items",
    )

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Validate role is one of the allowed values"""
        allowed_roles = ['user', 'assistant', 'system']
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of {allowed_roles}")
        return v

    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str | list[ContentItem]) -> str | list[ContentItem]:
        """Validate and sanitize content"""
        if isinstance(v, str):
            # Max length validation
            if len(v) > 50000:
                raise ValueError("Content text must not exceed 50000 characters")
            # Remove control characters
            sanitized = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', v)
            return sanitized
        return v


class ChatRequest(BaseModel):
    messages: list[ChatMessage] | None = Field(
        [], description="History of messages between the user and the assistant"
    )
    resources: list[Resource] | None = Field(
        [], description="Resources to be used for the research"
    )
    debug: bool | None = Field(False, description="Whether to enable debug logging")
    thread_id: str | None = Field(
        "__default__", description="A specific conversation identifier"
    )
    max_plan_iterations: int | None = Field(
        1, description="The maximum number of plan iterations"
    )
    max_step_num: int | None = Field(
        3, description="The maximum number of steps in a plan"
    )
    max_search_results: int | None = Field(
        3, description="The maximum number of search results"
    )
    auto_accepted_plan: bool | None = Field(
        False, description="Whether to automatically accept the plan"
    )
    interrupt_feedback: str | None = Field(
        None, description="Interrupt feedback from the user on the plan"
    )
    mcp_settings: dict | None = Field(
        None, description="MCP settings for the chat request"
    )
    enable_background_investigation: bool | None = Field(
        True, description="Whether to get background investigation before plan"
    )
    report_style: ReportStyle | None = Field(
        ReportStyle.ACADEMIC, description="The style of the report"
    )
    enable_deep_thinking: bool | None = Field(
        False, description="Whether to enable deep thinking"
    )
    model: str | None = Field(
        None,
        description="The model to use for the chat (e.g., 'google/gemini-2.5-pro', 'moonshotai/kimi-k2')",
    )
    enable_clarification: bool | None = Field(
        None,
        description="Whether to enable multi-turn clarification (default: None, uses State default=False)",
    )
    max_clarification_rounds: int | None = Field(
        None,
        description="Maximum number of clarification rounds (default: None, uses State default=3)",
    )


class TTSRequest(BaseModel):
    text: str = Field(
        ...,
        description="The text to convert to speech",
        min_length=1,
        max_length=1024
    )
    voice_type: str | None = Field(
        "BV700_V2_streaming", description="The voice type to use"
    )
    encoding: str | None = Field("mp3", description="The audio encoding format")
    speed_ratio: float | None = Field(1.0, description="Speech speed ratio", ge=0.5, le=2.0)
    volume_ratio: float | None = Field(1.0, description="Speech volume ratio", ge=0.1, le=2.0)
    pitch_ratio: float | None = Field(1.0, description="Speech pitch ratio", ge=0.5, le=2.0)
    text_type: str | None = Field("plain", description="Text type (plain or ssml)")
    with_frontend: int | None = Field(
        1, description="Whether to use frontend processing"
    )
    frontend_type: str | None = Field("unitTson", description="Frontend type")

    @field_validator('text')
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        """Remove control characters and validate encoding"""
        # Remove control characters (except newlines and tabs)
        sanitized = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', v)
        # Ensure valid UTF-8 encoding
        return sanitized.encode('utf-8', errors='ignore').decode('utf-8')


class GeneratePodcastRequest(BaseModel):
    content: str = Field(..., description="The content of the podcast", min_length=1, max_length=100000)

    @field_validator('content')
    @classmethod
    def sanitize_content(cls, v: str) -> str:
        """Remove control characters from content"""
        return re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', v)


class GeneratePPTRequest(BaseModel):
    content: str = Field(..., description="The content of the ppt", min_length=1, max_length=100000)

    @field_validator('content')
    @classmethod
    def sanitize_content(cls, v: str) -> str:
        """Remove control characters from content"""
        return re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', v)


class GenerateProseRequest(BaseModel):
    prompt: str = Field(..., description="The content of the prose", min_length=1, max_length=10000)
    option: str = Field(..., description="The option of the prose writer")
    command: str | None = Field(
        "", description="The user custom command of the prose writer", max_length=1000
    )

    @field_validator('prompt', 'command')
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        """Remove control characters"""
        if not v:
            return v
        return re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', v)


class EnhancePromptRequest(BaseModel):
    prompt: str = Field(..., description="The original prompt to enhance", min_length=1, max_length=10000)
    context: str | None = Field(
        "", description="Additional context about the intended use", max_length=5000
    )
    report_style: str | None = Field(
        "academic", description="The style of the report"
    )

    @field_validator('prompt', 'context')
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        """Remove control characters"""
        if not v:
            return v
        return re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', v)

    @field_validator('report_style')
    @classmethod
    def validate_style(cls, v: str) -> str:
        """Validate report style"""
        allowed_styles = ['academic', 'popular_science', 'news', 'social_media']
        if v and v.lower() not in allowed_styles:
            raise ValueError(f"Report style must be one of {allowed_styles}")
        return v.lower() if v else "academic"
