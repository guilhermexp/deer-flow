// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import type {
  ChatEvent,
  InterruptEvent,
  MessageChunkEvent,
  ToolCallChunksEvent,
  ToolCallResultEvent,
  ToolCallsEvent,
} from "../api";
import { deepClone } from "../utils/deep-clone";

import type { Message } from "./types";

// Helper function to try to extract partial JSON data
function tryExtractPartialJSON(str: string): Record<string, unknown> | null {
  try {
    // Try to extract key-value pairs using regex
    const result: Record<string, unknown> = {};
    const keyValueRegex = /"(\w+)":\s*"([^"]*)"/g;
    let match;
    while ((match = keyValueRegex.exec(str)) !== null) {
      if (match[1] && match[2] !== undefined) {
        result[match[1]] = match[2];
      }
    }
    // Also try to extract boolean and number values
    const boolNumRegex = /"(\w+)":\s*(true|false|\d+)/g;
    while ((match = boolNumRegex.exec(str)) !== null) {
      const value = match[2];
      if (match[1] && value !== undefined) {
        if (value === "true") result[match[1]] = true;
        else if (value === "false") result[match[1]] = false;
        else result[match[1]] = parseInt(value, 10);
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

export function mergeMessage(message: Message, event: ChatEvent) {
  if (event.type === "message_chunk") {
    mergeTextMessage(message, event);
  } else if (event.type === "tool_calls" || event.type === "tool_call_chunks") {
    mergeToolCallMessage(message, event);
  } else if (event.type === "tool_call_result") {
    mergeToolCallResultMessage(message, event);
  } else if (event.type === "interrupt") {
    mergeInterruptMessage(message, event);
  }
  if (event.data.finish_reason) {
    message.finishReason = event.data.finish_reason;
    message.isStreaming = false;
    if (message.toolCalls) {
      message.toolCalls.forEach((toolCall) => {
        if (toolCall.argsChunks?.length) {
          try {
            const argsString = toolCall.argsChunks?.join("") || "";
            // Skip parsing if the string is clearly incomplete or malformed
            if (argsString.trim() === "}" || argsString.trim() === "{" || argsString.trim() === "") {
              toolCall.args = {};
              delete toolCall.argsChunks;
              return;
            }
            toolCall.args = JSON.parse(argsString);
            delete toolCall.argsChunks;
          } catch (error) {
            console.error("Failed to parse tool call args:", error);
            console.error("Raw args string:", toolCall.argsChunks?.join("") ?? "");
            // Try to extract partial data if possible
            const rawString = toolCall.argsChunks?.join("") ?? "";
            toolCall.args = { 
              error: "Failed to parse arguments", 
              raw: rawString,
              // Attempt to extract any valid fields
              ...(tryExtractPartialJSON(rawString) ?? {})
            };
            delete toolCall.argsChunks;
          }
        }
      });
    }
  }
  return deepClone(message);
}

function mergeTextMessage(message: Message, event: MessageChunkEvent) {
  if (event.data.content) {
    message.content += event.data.content;
    message.contentChunks.push(event.data.content);
  }
  if (event.data.reasoning_content) {
    message.reasoningContent = (message.reasoningContent ?? "") + event.data.reasoning_content;
    message.reasoningContentChunks = message.reasoningContentChunks ?? [];
    message.reasoningContentChunks.push(event.data.reasoning_content);
  }
}
function convertToolChunkArgs(args: string) {
  // Convert escaped characters in args
  if (!args) return "";
  return args.replace(/&#91;/g, "[").replace(/&#93;/g, "]").replace(/&#123;/g, "{").replace(/&#125;/g, "}");
}
function mergeToolCallMessage(
  message: Message,
  event: ToolCallsEvent | ToolCallChunksEvent,
) {
  if (event.type === "tool_calls" && event.data.tool_calls[0]?.name) {
    message.toolCalls = event.data.tool_calls.map((raw) => ({
      id: raw.id,
      name: raw.name,
      args: raw.args,
      result: undefined,
    }));
  }

  message.toolCalls ??= [];
  for (const chunk of event.data.tool_call_chunks) {
    if (chunk.id) {
      const toolCall = message.toolCalls.find(
        (toolCall) => toolCall.id === chunk.id,
      );
      if (toolCall) {
        toolCall.argsChunks = [convertToolChunkArgs(chunk.args)];
      }
    } else {
      const streamingToolCall = message.toolCalls.find(
        (toolCall) => toolCall.argsChunks?.length,
      );
      if (streamingToolCall) {
        streamingToolCall.argsChunks!.push(convertToolChunkArgs(chunk.args));
      }
    }
  }
}

function mergeToolCallResultMessage(
  message: Message,
  event: ToolCallResultEvent,
) {
  const toolCall = message.toolCalls?.find(
    (toolCall) => toolCall.id === event.data.tool_call_id,
  );
  if (toolCall) {
    toolCall.result = event.data.content;
  }
}

function mergeInterruptMessage(message: Message, event: InterruptEvent) {
  message.isStreaming = false;
  message.options = event.data.options;
}
