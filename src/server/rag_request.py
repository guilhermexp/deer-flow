# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from pydantic import BaseModel, Field

from src.rag.retriever import Resource


class RAGConfigResponse(BaseModel):
    """Response model for RAG config."""

    provider: str | None = Field(
        None, description="The provider of the RAG, default is ragflow"
    )


class RAGResourceRequest(BaseModel):
    """Request model for RAG resource."""

    query: str | None = Field(
        None, description="The query of the resource need to be searched"
    )


class RAGResourcesResponse(BaseModel):
    """Response model for RAG resources."""

    resources: list[Resource] = Field(..., description="The resources of the RAG")


class RAGUploadResponse(BaseModel):
    """Response model for RAG document upload."""

    success: bool = Field(..., description="Whether the upload was successful")
    dataset_id: str = Field(
        ..., description="ID of the dataset where document was uploaded"
    )
    document_id: str | None = Field(None, description="ID of the uploaded document")
    resource: Resource | None = Field(
        None, description="Resource reference for the uploaded document"
    )
    error: str | None = Field(None, description="Error message if upload failed")
