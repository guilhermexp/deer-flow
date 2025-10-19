import { v4 as uuidv4 } from "uuid";

export interface ChatSession {
  id: string;
  noteId: string;
  createdAt: string;
  lastActivity: string;
  messages: Array<{
    id: number;
    type: "assistant" | "user";
    content: string;
    timestamp: string;
    sessionId: string;
  }>;
}

export interface ChatMessage {
  id: number;
  type: "assistant" | "user";
  content: string;
  timestamp: string;
  sessionId: string;
}

/**
 * Gera um ID único para uma nova sessão de chat
 */
export function generateSessionId(): string {
  return uuidv4();
}

/**
 * Cria uma nova sessão de chat para uma nota específica
 */
export function createChatSession(noteId: string): ChatSession {
  const sessionId = generateSessionId();
  const now = new Date().toISOString();

  return {
    id: sessionId,
    noteId,
    createdAt: now,
    lastActivity: now,
    messages: [
      {
        id: 1,
        type: "assistant",
        content: "Olá! Como posso ajudar você com esta nota hoje?",
        timestamp: now,
        sessionId,
      },
    ],
  };
}

/**
 * Adiciona uma nova mensagem a uma sessão existente
 */
export function addMessageToSession(
  session: ChatSession,
  content: string,
  type: "assistant" | "user"
): ChatSession {
  const now = new Date().toISOString();
  const newMessage: ChatMessage = {
    id: session.messages.length + 1,
    type,
    content,
    timestamp: now,
    sessionId: session.id,
  };

  return {
    ...session,
    lastActivity: now,
    messages: [...session.messages, newMessage],
  };
}

/**
 * Atualiza a última atividade da sessão
 */
export function updateSessionActivity(session: ChatSession): ChatSession {
  return {
    ...session,
    lastActivity: new Date().toISOString(),
  };
}

/**
 * Formata dados da sessão para envio ao webhook
 */
export function formatSessionForWebhook(session: ChatSession) {
  return {
    sessionId: session.id,
    noteId: session.noteId,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    messageCount: session.messages.length,
    conversation: session.messages.map((msg) => ({
      id: msg.id,
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp,
    })),
  };
}
