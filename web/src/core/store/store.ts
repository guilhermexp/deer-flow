// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { nanoid } from "nanoid";
import { toast } from "sonner";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { chatStream, generatePodcast } from "../api";
import type { Message, Resource } from "../messages";
import { mergeMessage } from "../messages";
import { parseJSON } from "../utils";

import { addToHistory, useHistoryStore } from "./history-store";
import { getChatStreamSettings } from "./settings-store";
import { storeEvents } from "./events";

const THREAD_ID = nanoid();

export const useStore = create<{
  responding: boolean;
  threadId: string | undefined;
  messageIds: string[];
  messages: Map<string, Message>;
  researchIds: string[];
  researchPlanIds: Map<string, string>;
  researchReportIds: Map<string, string>;
  researchActivityIds: Map<string, string[]>;
  ongoingResearchId: string | null;
  openResearchId: string | null;
  isLoadingHistory: boolean;

  appendMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  updateMessages: (messages: Message[]) => void;
  openResearch: (researchId: string | null) => void;
  closeResearch: () => void;
  setOngoingResearch: (researchId: string | null) => void;
  loadConversation: (messages: Message[], threadId: string) => void;
  clearConversation: () => void;
}>((set) => ({
  responding: false,
  threadId: THREAD_ID,
  messageIds: [],
  messages: new Map<string, Message>(),
  researchIds: [],
  researchPlanIds: new Map<string, string>(),
  researchReportIds: new Map<string, string>(),
  researchActivityIds: new Map<string, string[]>(),
  ongoingResearchId: null,
  openResearchId: null,
  isLoadingHistory: false,

  appendMessage(message: Message) {
    set((state) => ({
      messageIds: [...state.messageIds, message.id],
      messages: new Map(state.messages).set(message.id, message),
    }));
    
    // Emitir evento após atualizar o store
    storeEvents.emit({ type: 'MESSAGE_APPENDED', message });
  },
  updateMessage(message: Message) {
    set((state) => ({
      messages: new Map(state.messages).set(message.id, message),
    }));
    
    // Emitir evento após atualizar o store
    storeEvents.emit({ type: 'MESSAGE_UPDATED', message });
  },
  updateMessages(messages: Message[]) {
    set((state) => {
      const newMessages = new Map(state.messages);
      messages.forEach((m) => newMessages.set(m.id, m));
      return { messages: newMessages };
    });
    
    // Emitir evento após atualizar o store
    storeEvents.emit({ type: 'MESSAGES_UPDATED', messages });
  },
  openResearch(researchId: string | null) {
    set({ openResearchId: researchId });
  },
  closeResearch() {
    set({ openResearchId: null });
  },
  setOngoingResearch(researchId: string | null) {
    set({ ongoingResearchId: researchId });
  },
  loadConversation(messages: Message[], threadId: string) {
    // Set loading state
    set({ isLoadingHistory: true });
    
    // Process messages in chunks to avoid blocking UI
    setTimeout(() => {
      const messageMap = new Map<string, Message>();
      const messageIds: string[] = [];
      const researchIds: string[] = [];
      const researchPlanIds = new Map<string, string>();
      const researchReportIds = new Map<string, string>();
      const researchActivityIds = new Map<string, string[]>();
      
      // Process messages in batches to improve performance
      const BATCH_SIZE = 50;
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);
        
        batch.forEach((msg) => {
          messageMap.set(msg.id, msg);
          messageIds.push(msg.id);
          
          // Reconstruct research-related maps only for relevant messages
          if (msg.agent === "planner" && msg.role === "assistant") {
            const researchId = msg.id;
            researchIds.push(researchId);
            researchPlanIds.set(researchId, msg.id);
          } else if (msg.agent === "reporter" && msg.role === "assistant" && researchIds.length > 0) {
            const researchId = researchIds[researchIds.length - 1];
            if (researchId) {
              researchReportIds.set(researchId, msg.id);
            }
          } else if ((msg.agent === "researcher" || msg.agent === "coder") && researchIds.length > 0) {
            const researchId = researchIds[researchIds.length - 1];
            if (researchId) {
              const activities = researchActivityIds.get(researchId) || [];
              activities.push(msg.id);
              researchActivityIds.set(researchId, activities);
            }
          }
        });
      }
      
      set({
        threadId,
        messageIds,
        messages: messageMap,
        researchIds,
        researchPlanIds,
        researchReportIds,
        researchActivityIds,
        responding: false,
        ongoingResearchId: null,
        openResearchId: researchIds.length > 0 ? researchIds[researchIds.length - 1] : null,
        isLoadingHistory: false,
      });
    }, 0);
  },
  clearConversation() {
    set({
      threadId: nanoid(),
      messageIds: [],
      messages: new Map(),
      researchIds: [],
      researchPlanIds: new Map(),
      researchReportIds: new Map(),
      researchActivityIds: new Map(),
      responding: false,
      ongoingResearchId: null,
      openResearchId: null,
      isLoadingHistory: false,
    });
  },
}));

export async function sendMessage(
  content?: string,
  {
    interruptFeedback,
    resources,
  }: {
    interruptFeedback?: string;
    resources?: Array<Resource>;
  } = {},
  options: { abortSignal?: AbortSignal } = {},
) {
  const currentThreadId = useStore.getState().threadId || THREAD_ID;
  
  if (content != null) {
    appendMessage({
      id: nanoid(),
      threadId: currentThreadId,
      role: "user",
      content: content,
      contentChunks: [content],
      resources,
    });
    
    // Add to history only for new conversations
    const existingConversation = useHistoryStore.getState().getConversationByThreadId(currentThreadId);
    if (!existingConversation) {
      addToHistory(content, currentThreadId);
    }
  }

  const settings = getChatStreamSettings();
  const stream = chatStream(
    content ?? "[REPLAY]",
    {
      thread_id: currentThreadId,
      interrupt_feedback: interruptFeedback,
      resources,
      auto_accepted_plan: settings.autoAcceptedPlan,
      enable_deep_thinking: settings.enableDeepThinking ?? false,
      enable_background_investigation:
        settings.enableBackgroundInvestigation ?? true,
      max_plan_iterations: settings.maxPlanIterations,
      max_step_num: settings.maxStepNum,
      max_search_results: settings.maxSearchResults,
      report_style: settings.reportStyle,
      mcp_settings: settings.mcpSettings,
      model: settings.selectedModel,
    },
    options,
  );

  setResponding(true);
  let messageId: string | undefined;
  try {
    for await (const event of stream) {
      const { type, data } = event;
      messageId = data.id;
      let message: Message | undefined;
      if (type === "tool_call_result") {
        message = findMessageByToolCallId(data.tool_call_id);
      } else if (!existsMessage(messageId)) {
        message = {
          id: messageId,
          threadId: data.thread_id,
          agent: data.agent,
          role: data.role,
          content: "",
          contentChunks: [],
          reasoningContent: "",
          reasoningContentChunks: [],
          isStreaming: true,
          interruptFeedback,
        };
        appendMessage(message);
      }
      message ??= getMessage(messageId);
      if (message) {
        message = mergeMessage(message, event);
        updateMessage(message);
      }
    }
  } catch (error) {
    console.error("Error in chat stream:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast(`An error occurred: ${errorMessage}. Please try again.`);
    // Update message status.
    const isAborted = error instanceof Error && error.name === "AbortError";
    if (messageId != null && !isAborted) {
      const message = getMessage(messageId);
      if (message?.isStreaming) {
        message.isStreaming = false;
        useStore.getState().updateMessage(message);
      }
    }
    useStore.getState().setOngoingResearch(null);
  } finally {
    setResponding(false);
    
    // Update conversation messages in history
    const messages = Array.from(useStore.getState().messages.values());
    useHistoryStore.getState().updateConversationMessages(currentThreadId, messages);
  }
}

function setResponding(value: boolean) {
  useStore.setState({ responding: value });
}

function existsMessage(id: string) {
  return useStore.getState().messageIds.includes(id);
}

function getMessage(id: string) {
  return useStore.getState().messages.get(id);
}

function findMessageByToolCallId(toolCallId: string) {
  return Array.from(useStore.getState().messages.values())
    .reverse()
    .find((message) => {
      if (message.toolCalls) {
        return message.toolCalls.some((toolCall) => toolCall.id === toolCallId);
      }
      return false;
    });
}

function appendMessage(message: Message) {
  if (
    message.agent === "coder" ||
    message.agent === "reporter" ||
    message.agent === "researcher"
  ) {
    if (!getOngoingResearchId()) {
      const id = message.id;
      appendResearch(id);
      openResearch(id);
    }
    appendResearchActivity(message);
  }
  useStore.getState().appendMessage(message);
}

function updateMessage(message: Message) {
  if (
    getOngoingResearchId() &&
    message.agent === "reporter" &&
    !message.isStreaming
  ) {
    useStore.getState().setOngoingResearch(null);
  }
  useStore.getState().updateMessage(message);
}

function getOngoingResearchId() {
  return useStore.getState().ongoingResearchId;
}

function appendResearch(researchId: string) {
  let planMessage: Message | undefined;
  const reversedMessageIds = [...useStore.getState().messageIds].reverse();
  for (const messageId of reversedMessageIds) {
    const message = getMessage(messageId);
    if (message?.agent === "planner") {
      planMessage = message;
      break;
    }
  }
  const messageIds = [researchId];
  messageIds.unshift(planMessage!.id);
  useStore.setState({
    ongoingResearchId: researchId,
    researchIds: [...useStore.getState().researchIds, researchId],
    researchPlanIds: new Map(useStore.getState().researchPlanIds).set(
      researchId,
      planMessage!.id,
    ),
    researchActivityIds: new Map(useStore.getState().researchActivityIds).set(
      researchId,
      messageIds,
    ),
  });
}

function appendResearchActivity(message: Message) {
  const researchId = getOngoingResearchId();
  if (researchId) {
    const researchActivityIds = useStore.getState().researchActivityIds;
    const current = researchActivityIds.get(researchId)!;
    if (!current.includes(message.id)) {
      useStore.setState({
        researchActivityIds: new Map(researchActivityIds).set(researchId, [
          ...current,
          message.id,
        ]),
      });
    }
    if (message.agent === "reporter") {
      useStore.setState({
        researchReportIds: new Map(useStore.getState().researchReportIds).set(
          researchId,
          message.id,
        ),
      });
    }
  }
}

export function openResearch(researchId: string | null) {
  useStore.getState().openResearch(researchId);
}

export function closeResearch() {
  useStore.getState().closeResearch();
}

export async function listenToPodcast(researchId: string) {
  const planMessageId = useStore.getState().researchPlanIds.get(researchId);
  const reportMessageId = useStore.getState().researchReportIds.get(researchId);
  if (planMessageId && reportMessageId) {
    const planMessage = getMessage(planMessageId)!;
    const title = parseJSON(planMessage.content, { title: "Untitled" }).title;
    const reportMessage = getMessage(reportMessageId);
    if (reportMessage?.content) {
      appendMessage({
        id: nanoid(),
        threadId: THREAD_ID,
        role: "user",
        content: "Please generate a podcast for the above research.",
        contentChunks: [],
      });
      const podCastMessageId = nanoid();
      const podcastObject = { title, researchId };
      const podcastMessage: Message = {
        id: podCastMessageId,
        threadId: THREAD_ID,
        role: "assistant",
        agent: "podcast",
        content: JSON.stringify(podcastObject),
        contentChunks: [],
        reasoningContent: "",
        reasoningContentChunks: [],
        isStreaming: true,
      };
      appendMessage(podcastMessage);
      // Generating podcast...
      let audioUrl: string | undefined;
      try {
        audioUrl = await generatePodcast(reportMessage.content);
      } catch (e) {
        console.error(e);
        useStore.setState((state) => ({
          messages: new Map(useStore.getState().messages).set(
            podCastMessageId,
            {
              ...state.messages.get(podCastMessageId)!,
              content: JSON.stringify({
                ...podcastObject,
                error: e instanceof Error ? e.message : "Unknown error",
              }),
              isStreaming: false,
            },
          ),
        }));
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        if (errorMsg.includes("500")) {
          toast("Podcast generation service is not available. Please check if TTS API keys are configured.");
        } else {
          toast(`Failed to generate podcast: ${errorMsg}`);
        }
        return;
      }
      useStore.setState((state) => ({
        messages: new Map(useStore.getState().messages).set(podCastMessageId, {
          ...state.messages.get(podCastMessageId)!,
          content: JSON.stringify({ ...podcastObject, audioUrl }),
          isStreaming: false,
        }),
      }));
    }
  }
}

export function useResearchMessage(researchId: string) {
  return useStore(
    useShallow((state) => {
      const messageId = state.researchPlanIds.get(researchId);
      return messageId ? state.messages.get(messageId) : undefined;
    }),
  );
}

export function useMessage(messageId: string | null | undefined) {
  return useStore(
    useShallow((state) =>
      messageId ? state.messages.get(messageId) : undefined,
    ),
  );
}

export function useMessageIds() {
  return useStore(useShallow((state) => state.messageIds));
}

export function useLastInterruptMessage() {
  return useStore(
    useShallow((state) => {
      if (state.messageIds.length >= 2) {
        const lastMessage = state.messages.get(
          state.messageIds[state.messageIds.length - 1]!,
        );
        return lastMessage?.finishReason === "interrupt" ? lastMessage : null;
      }
      return null;
    }),
  );
}

export function useLastFeedbackMessageId() {
  const waitingForFeedbackMessageId = useStore(
    useShallow((state) => {
      if (state.messageIds.length >= 2) {
        const lastMessage = state.messages.get(
          state.messageIds[state.messageIds.length - 1]!,
        );
        if (lastMessage && lastMessage.finishReason === "interrupt") {
          return state.messageIds[state.messageIds.length - 2];
        }
      }
      return null;
    }),
  );
  return waitingForFeedbackMessageId;
}

export function useToolCalls() {
  return useStore(
    useShallow((state) => {
      return state.messageIds
        ?.map((id) => getMessage(id)?.toolCalls)
        .filter((toolCalls) => toolCalls != null)
        .flat();
    }),
  );
}
