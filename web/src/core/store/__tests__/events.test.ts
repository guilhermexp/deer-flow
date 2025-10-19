/**
 * Testes para o sistema de eventos do store
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { storeEvents } from "../events";
import type { StoreEvent } from "../events";

describe("storeEvents", () => {
  beforeEach(() => {
    // Limpar todos os listeners antes de cada teste
    storeEvents.removeAllListeners();
  });

  describe("on/off", () => {
    it("deve registrar e chamar listener", async () => {
      const listener = vi.fn();
      const message = {
        id: "1",
        threadId: "thread1",
        content: "Test",
        contentChunks: ["Test"],
        role: "user" as const,
      };

      storeEvents.on("MESSAGE_APPENDED", listener);
      await storeEvents.emit({ type: "MESSAGE_APPENDED", message });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        type: "MESSAGE_APPENDED",
        message,
      });
    });

    it("deve remover listener com função retornada", async () => {
      const listener = vi.fn();
      const message = {
        id: "1",
        threadId: "thread1",
        content: "Test",
        contentChunks: ["Test"],
        role: "user" as const,
      };

      const unsubscribe = storeEvents.on("MESSAGE_APPENDED", listener);

      await storeEvents.emit({ type: "MESSAGE_APPENDED", message });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      await storeEvents.emit({ type: "MESSAGE_APPENDED", message });
      expect(listener).toHaveBeenCalledTimes(1); // Não deve ser chamado novamente
    });

    it("deve remover listener com off", async () => {
      const listener = vi.fn();
      const message = {
        id: "1",
        threadId: "thread1",
        content: "Test",
        contentChunks: ["Test"],
        role: "user" as const,
      };

      storeEvents.on("MESSAGE_APPENDED", listener);
      storeEvents.off("MESSAGE_APPENDED", listener);

      await storeEvents.emit({ type: "MESSAGE_APPENDED", message });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("emit", () => {
    it("deve chamar múltiplos listeners", async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const message = {
        id: "1",
        threadId: "thread1",
        content: "Test",
        contentChunks: ["Test"],
        role: "user" as const,
      };

      storeEvents.on("MESSAGE_UPDATED", listener1);
      storeEvents.on("MESSAGE_UPDATED", listener2);

      await storeEvents.emit({ type: "MESSAGE_UPDATED", message });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it("deve executar listeners assíncronos", async () => {
      const results: number[] = [];

      storeEvents.on("SYNC_STARTED", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(1);
      });

      storeEvents.on("SYNC_STARTED", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        results.push(2);
      });

      await storeEvents.emit({ type: "SYNC_STARTED" });

      // Ambos devem ter sido executados
      expect(results).toContain(1);
      expect(results).toContain(2);
    });

    it("deve capturar erros em listeners", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock implementation to suppress console.error during tests
      });
      const goodListener = vi.fn();

      storeEvents.on("SYNC_ERROR", () => {
        throw new Error("Test error");
      });

      storeEvents.on("SYNC_ERROR", goodListener);

      const error = new Error("Sync failed");
      await storeEvents.emit({ type: "SYNC_ERROR", error });

      expect(goodListener).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("Erro no listener para SYNC_ERROR:"),
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it("não deve chamar listeners de outros tipos de evento", async () => {
      const messageListener = vi.fn();
      const syncListener = vi.fn();

      storeEvents.on("MESSAGE_APPENDED", messageListener);
      storeEvents.on("SYNC_STARTED", syncListener);

      await storeEvents.emit({ type: "SYNC_STARTED" });

      expect(syncListener).toHaveBeenCalled();
      expect(messageListener).not.toHaveBeenCalled();
    });
  });

  describe("removeAllListeners", () => {
    it("deve remover todos os listeners de um tipo", async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const otherListener = vi.fn();

      storeEvents.on("MESSAGE_APPENDED", listener1);
      storeEvents.on("MESSAGE_APPENDED", listener2);
      storeEvents.on("MESSAGE_UPDATED", otherListener);

      storeEvents.removeAllListeners("MESSAGE_APPENDED");

      const message = {
        id: "1",
        threadId: "thread1",
        content: "Test",
        contentChunks: ["Test"],
        role: "user" as const,
      };
      await storeEvents.emit({ type: "MESSAGE_APPENDED", message });
      await storeEvents.emit({ type: "MESSAGE_UPDATED", message });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(otherListener).toHaveBeenCalled();
    });

    it("deve remover todos os listeners quando sem parâmetro", async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      storeEvents.on("MESSAGE_APPENDED", listener1);
      storeEvents.on("SYNC_STARTED", listener2);

      storeEvents.removeAllListeners();

      const message = {
        id: "1",
        threadId: "thread1",
        content: "Test",
        contentChunks: ["Test"],
        role: "user" as const,
      };
      await storeEvents.emit({ type: "MESSAGE_APPENDED", message });
      await storeEvents.emit({ type: "SYNC_STARTED" });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe("tipos de eventos", () => {
    it("deve suportar todos os tipos de eventos definidos", async () => {
      const events: StoreEvent[] = [
        {
          type: "MESSAGE_APPENDED",
          message: {
            id: "1",
            threadId: "thread1",
            content: "Test",
            contentChunks: ["Test"],
            role: "user",
          },
        },
        {
          type: "MESSAGE_UPDATED",
          message: {
            id: "1",
            threadId: "thread1",
            content: "Updated",
            contentChunks: ["Updated"],
            role: "user",
          },
        },
        {
          type: "MESSAGES_UPDATED",
          messages: [
            {
              id: "1",
              threadId: "thread1",
              content: "Test",
              contentChunks: ["Test"],
              role: "user",
            },
          ],
        },
        {
          type: "CONVERSATION_CREATED",
          conversationId: "conv1",
          title: "New Chat",
        },
        {
          type: "CONVERSATION_UPDATED",
          conversationId: "conv1",
          updates: { title: "Updated" },
        },
        { type: "SYNC_STARTED" },
        { type: "SYNC_COMPLETED" },
        { type: "SYNC_ERROR", error: new Error("Test") },
      ];

      for (const event of events) {
        const listener = vi.fn();
        storeEvents.on(event.type, listener);
        await storeEvents.emit(event);
        expect(listener).toHaveBeenCalledWith(event);
      }
    });
  });
});
