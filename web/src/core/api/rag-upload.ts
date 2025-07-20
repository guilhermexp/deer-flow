// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import type { Resource } from "../messages";
import { resolveServiceURL } from "./resolve-service-url";

export interface RAGUploadResponse {
  success: boolean;
  dataset_id: string;
  document_id?: string;
  resource?: Resource;
  error?: string;
}

export async function uploadToRAG(
  file: File,
  datasetName: string = "My Documents",
  datasetDescription: string = "Documents uploaded via chat"
): Promise<RAGUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("dataset_name", datasetName);
  formData.append("dataset_description", datasetDescription);

  const response = await fetch(resolveServiceURL("rag/upload"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}