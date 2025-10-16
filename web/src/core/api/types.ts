// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import type { Option } from "../messages";

// ============================================
// User Schemas
// ============================================
// IMPORTANT: These schemas MUST match src/server/schemas.py
// Any changes to UserResponse must be synchronized between:
// - Backend: src/server/schemas.py
// - Frontend: web/src/core/api/types.ts

/**
 * User response schema - synchronized with backend UserResponse
 * @see src/server/schemas.py:UserResponse
 */
export interface UserResponse {
  /** User database ID */
  id: number;

  /** User email address (validated as EmailStr in backend) */
  email: string;

  /** Username (1-100 chars) */
  username: string;

  /** Clerk user ID */
  clerk_id: string;

  /** User account active status */
  is_active: boolean;

  /** Account creation timestamp (UTC, ISO 8601) */
  created_at: string;

  /** Last update timestamp (UTC, ISO 8601) */
  updated_at: string;
}

/**
 * Schema for creating a new user
 * @see src/server/schemas.py:UserCreateRequest
 */
export interface UserCreateRequest {
  /** User email address */
  email: string;

  /** Username (3-100 chars) */
  username: string;

  /** Clerk user ID */
  clerk_id: string;
}

/**
 * Schema for updating user information
 * @see src/server/schemas.py:UserUpdateRequest
 */
export interface UserUpdateRequest {
  /** User email address (optional) */
  email?: string;

  /** Username (3-100 chars, optional) */
  username?: string;

  /** User account active status (optional) */
  is_active?: boolean;
}

// ============================================
// Tool Calls
// ============================================

export interface ToolCall {
  type: "tool_call";
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolCallChunk {
  type: "tool_call_chunk";
  index: number;
  id: string;
  name: string;
  args: string;
}

// Events

interface GenericEvent<T extends string, D extends object> {
  type: T;
  data: {
    id: string;
    thread_id: string;
    agent: "coordinator" | "planner" | "researcher" | "coder" | "reporter";
    role: "user" | "assistant" | "tool";
    finish_reason?: "stop" | "tool_calls" | "interrupt";
  } & D;
}

export interface MessageChunkEvent
  extends GenericEvent<
    "message_chunk",
    {
      content?: string;
      reasoning_content?: string;
    }
  > {}

export interface ToolCallsEvent
  extends GenericEvent<
    "tool_calls",
    {
      tool_calls: ToolCall[];
      tool_call_chunks: ToolCallChunk[];
    }
  > {}

export interface ToolCallChunksEvent
  extends GenericEvent<
    "tool_call_chunks",
    {
      tool_call_chunks: ToolCallChunk[];
    }
  > {}

export interface ToolCallResultEvent
  extends GenericEvent<
    "tool_call_result",
    {
      tool_call_id: string;
      content?: string;
    }
  > {}

export interface InterruptEvent
  extends GenericEvent<
    "interrupt",
    {
      options: Option[];
    }
  > {}

export type ChatEvent =
  | MessageChunkEvent
  | ToolCallsEvent
  | ToolCallChunksEvent
  | ToolCallResultEvent
  | InterruptEvent;
