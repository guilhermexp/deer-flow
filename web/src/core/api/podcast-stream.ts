// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { resolveServiceURL } from "./resolve-service-url";

export interface PodcastProgress {
  stage: string;
  progress: number;
  message: string;
}

export interface PodcastComplete {
  audio_data: string;
  mime_type: string;
  size: number;
}

export interface PodcastStreamCallbacks {
  onProgress?: (progress: PodcastProgress) => void;
  onComplete?: (data: PodcastComplete) => void;
  onError?: (error: string) => void;
}

export async function generatePodcastWithProgress(
  content: string,
  callbacks: PodcastStreamCallbacks
): Promise<string> {
  const response = await fetch(resolveServiceURL("podcast/generate-stream"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          const eventType = line.slice(6).trim();
          const nextLine = lines[lines.indexOf(line) + 1];

          if (nextLine?.startsWith("data:")) {
            const data = JSON.parse(nextLine.slice(5).trim());

            switch (eventType) {
              case "progress":
                callbacks.onProgress?.(data);
                break;
              case "complete":
                callbacks.onComplete?.(data);
                // Convert base64 audio to blob URL
                const audioBlob = base64ToBlob(data.audio_data, data.mime_type);
                const audioUrl = URL.createObjectURL(audioBlob);
                return audioUrl;
              case "error":
                callbacks.onError?.(data.error);
                throw new Error(data.error);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  throw new Error("Stream ended without completion");
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
