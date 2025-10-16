# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import os
from typing import List, Optional
from urllib.parse import urlparse

import requests

from src.rag.retriever import Chunk, Document, Resource, Retriever


class RAGFlowProvider(Retriever):
    """
    RAGFlowProvider is a provider that uses RAGFlow to retrieve documents.
    """

    api_url: str
    api_key: str
    page_size: int = 10
    cross_languages: Optional[List[str]] = None

    def __init__(self):
        api_url = os.getenv("RAGFLOW_API_URL")
        if not api_url:
            raise ValueError("RAGFLOW_API_URL is not set")
        self.api_url = api_url

        api_key = os.getenv("RAGFLOW_API_KEY")
        if not api_key:
            raise ValueError("RAGFLOW_API_KEY is not set")
        self.api_key = api_key

        page_size = os.getenv("RAGFLOW_PAGE_SIZE")
        if page_size:
            self.page_size = int(page_size)

        self.cross_languages = None
        cross_languages = os.getenv("RAGFLOW_CROSS_LANGUAGES")
        if cross_languages:
            self.cross_languages = cross_languages.split(",")

    def query_relevant_documents(
        self, query: str, resources: list[Resource] = []
    ) -> list[Document]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        dataset_ids: list[str] = []
        document_ids: list[str] = []

        for resource in resources:
            dataset_id, document_id = parse_uri(resource.uri)
            dataset_ids.append(dataset_id)
            if document_id:
                document_ids.append(document_id)

        payload = {
            "question": query,
            "dataset_ids": dataset_ids,
            "document_ids": document_ids,
            "page_size": self.page_size,
        }

        if self.cross_languages:
            payload["cross_languages"] = self.cross_languages

        response = requests.post(
            f"{self.api_url}/api/v1/retrieval", headers=headers, json=payload
        )

        if response.status_code != 200:
            raise Exception(f"Failed to query documents: {response.text}")

        result = response.json()
        data = result.get("data", {})
        doc_aggs = data.get("doc_aggs", [])
        docs: dict[str, Document] = {
            doc.get("doc_id"): Document(
                id=doc.get("doc_id"),
                title=doc.get("doc_name"),
                chunks=[],
            )
            for doc in doc_aggs
        }

        for chunk in data.get("chunks", []):
            doc = docs.get(chunk.get("document_id"))
            if doc:
                doc.chunks.append(
                    Chunk(
                        content=chunk.get("content"),
                        similarity=chunk.get("similarity"),
                    )
                )

        return list(docs.values())

    def list_resources(self, query: str | None = None) -> list[Resource]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        params = {}
        if query:
            params["name"] = query

        response = requests.get(
            f"{self.api_url}/api/v1/datasets", headers=headers, params=params
        )

        if response.status_code != 200:
            raise Exception(f"Failed to list resources: {response.text}")

        result = response.json()
        resources = []

        for item in result.get("data", []):
            item = Resource(
                uri=f"rag://dataset/{item.get('id')}",
                title=item.get("name", ""),
                description=item.get("description", ""),
            )
            resources.append(item)

        return resources

    def create_dataset(self, name: str, description: str = "") -> dict:
        """Create a new dataset in RAGFlow"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "name": name,
            "description": description,
            "language": "pt",  # Portuguese
            "embedding_model": "BAAI/bge-base-zh-v1.5",  # Default embedding model
            "permission": "me",  # Private dataset
        }

        response = requests.post(
            f"{self.api_url}/api/v1/datasets", headers=headers, json=payload
        )

        if response.status_code not in [200, 201]:
            raise Exception(f"Failed to create dataset: {response.text}")

        return response.json()

    def upload_document(
        self, dataset_id: str, file_data: bytes, filename: str, file_type: str = "pdf"
    ) -> dict:
        """Upload a document to a dataset"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

        files = {"file": (filename, file_data, f"application/{file_type}")}

        data = {
            "dataset_id": dataset_id,
            "parser_id": "naive",  # Default parser
        }

        response = requests.post(
            f"{self.api_url}/api/v1/datasets/{dataset_id}/documents",
            headers=headers,
            files=files,
            data=data,
        )

        if response.status_code not in [200, 201]:
            raise Exception(f"Failed to upload document: {response.text}")

        return response.json()

    def process_document(self, dataset_id: str, document_id: str) -> dict:
        """Process/parse an uploaded document"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        response = requests.post(
            f"{self.api_url}/api/v1/datasets/{dataset_id}/documents/{document_id}/process",
            headers=headers,
        )

        if response.status_code not in [200, 201]:
            raise Exception(f"Failed to process document: {response.text}")

        return response.json()


def parse_uri(uri: str) -> tuple[str, str]:
    parsed = urlparse(uri)
    if parsed.scheme != "rag":
        raise ValueError(f"Invalid URI: {uri}")
    return parsed.path.split("/")[1], parsed.fragment
