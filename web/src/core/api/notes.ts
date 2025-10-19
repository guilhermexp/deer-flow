// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { apiClient } from "./client";

export interface Note {
  id: number;
  title: string;
  content?: string;
  source?: string;
  source_url?: string;
  transcript?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  title: string;
  content?: string;
  source?: string;
  source_url?: string;
  transcript?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}

export interface NoteUpdate extends Partial<NoteCreate> {}

export interface NoteStats {
  total_notes: number;
  notes_by_source: Record<string, number>;
  recent_sources: string[];
}

export interface ExtractContentResponse {
  source: string;
  title: string;
  source_url: string;
  transcript: string;
  summary: string;
  metadata: Record<string, unknown>;
}

export const notesApi = {
  async getNotes(params?: {
    search?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<Note[]> {
    const response = await apiClient.get<Note[]>("/notes/", { params });
    return response.data;
  },

  async getNote(id: number): Promise<Note> {
    const response = await apiClient.get<Note>(`/notes/${id}`);
    return response.data;
  },

  async createNote(data: NoteCreate): Promise<Note> {
    const response = await apiClient.post<Note>("/notes/", data);
    return response.data;
  },

  async updateNote(id: number, data: NoteUpdate): Promise<Note> {
    const response = await apiClient.put<Note>(`/notes/${id}`, data);
    return response.data;
  },

  async deleteNote(id: number): Promise<void> {
    await apiClient.delete(`/notes/${id}`);
  },

  async getStats(): Promise<NoteStats> {
    const response = await apiClient.get<NoteStats>("/notes/stats");
    return response.data;
  },

  async extractContent(url: string): Promise<ExtractContentResponse> {
    const response = await apiClient.post<ExtractContentResponse>(
      "/notes/extract",
      { url }
    );
    return response.data;
  },

  async summarizeNote(
    id: number
  ): Promise<{ note_id: number; summary: string }> {
    const response = await apiClient.post<{ note_id: number; summary: string }>(
      `/notes/summarize/${id}`
    );
    return response.data;
  },
};
