/**
 * Serviço de mensagens usando REST API
 * Nota: As mensagens são armazenadas no campo 'messages' da conversa
 */

import type { Message } from "~/core/messages";

import { conversationsApiService } from "./conversations";

export const messagesApiService = {
  /**
   * Buscar mensagens de uma conversa
   */
  async getConversationMessages(thread_id: string): Promise<Message[]> {
    try {
      const conversation =
        await conversationsApiService.getByThreadId(thread_id);
      if (!conversation) {
        return [];
      }

      // As mensagens estão armazenadas no campo messages da conversa
      return conversation.messages || [];
    } catch (error) {
      console.error("Erro ao buscar mensagens da conversa:", error);
      return [];
    }
  },

  /**
   * Criar mensagem (adiciona à conversa)
   */
  async createMessage(message: Message): Promise<Message> {
    try {
      // Buscar conversa existente
      const conversation = await conversationsApiService.getByThreadId(
        message.threadId
      );

      if (conversation) {
        // Adicionar mensagem à lista existente
        const updatedMessages = [...(conversation.messages || []), message];

        // Limitar a 200 mensagens
        const limitedMessages = updatedMessages.slice(-200);

        // Atualizar conversa
        await conversationsApiService.update(message.threadId, {
          messages: limitedMessages,
        });
      } else {
        // Criar nova conversa com a mensagem
        const title =
          message.role === "user" && message.content.length > 50
            ? message.content.substring(0, 50) + "..."
            : "Nova conversa";

        const query = message.role === "user" ? message.content : "";

        await conversationsApiService.create({
          thread_id: message.threadId,
          title,
          query,
          messages: [message],
        });
      }

      return message;
    } catch (error) {
      console.error("Erro ao criar mensagem:", error);
      throw error;
    }
  },

  /**
   * Atualizar mensagem
   */
  async updateMessage(messageId: string, message: Message): Promise<Message> {
    try {
      // Buscar conversa
      const conversation = await conversationsApiService.getByThreadId(
        message.threadId
      );

      if (!conversation) {
        throw new Error("Conversa não encontrada");
      }

      // Encontrar e atualizar mensagem
      const messages = conversation.messages || [];
      const messageIndex = messages.findIndex(
        (m: Message) => m.id === messageId
      );

      if (messageIndex === -1) {
        throw new Error("Mensagem não encontrada");
      }

      messages[messageIndex] = message;

      // Atualizar conversa
      await conversationsApiService.update(message.threadId, {
        messages,
      });

      return message;
    } catch (error) {
      console.error("Erro ao atualizar mensagem:", error);
      throw error;
    }
  },

  /**
   * Deletar mensagem
   */
  async deleteMessage(thread_id: string, messageId: string): Promise<void> {
    try {
      // Buscar conversa
      const conversation =
        await conversationsApiService.getByThreadId(thread_id);

      if (!conversation) {
        throw new Error("Conversa não encontrada");
      }

      // Filtrar mensagem
      const messages = (conversation.messages || []).filter(
        (m: Message) => m.id !== messageId
      );

      // Atualizar conversa
      await conversationsApiService.update(thread_id, {
        messages,
      });
    } catch (error) {
      console.error("Erro ao deletar mensagem:", error);
      throw error;
    }
  },

  /**
   * Verificar se tabela existe (compatibilidade com código antigo)
   * No REST API, sempre retorna true
   */
  async checkMessagesTableExists(): Promise<boolean> {
    return true;
  },
};
