/**
 * Sistema de eventos para sincronização entre store e Supabase
 */

import type { Message } from "~/core/messages";

export type StoreEvent = 
  | { type: 'MESSAGE_APPENDED'; message: Message }
  | { type: 'MESSAGE_UPDATED'; message: Message }
  | { type: 'MESSAGES_UPDATED'; messages: Message[] }
  | { type: 'CONVERSATION_CREATED'; conversationId: string; title?: string }
  | { type: 'CONVERSATION_UPDATED'; conversationId: string; updates: any }
  | { type: 'SYNC_STARTED' }
  | { type: 'SYNC_COMPLETED' }
  | { type: 'SYNC_ERROR'; error: Error };

export interface StoreEventListener {
  (event: StoreEvent): void | Promise<void>;
}

class EventEmitter {
  private listeners = new Map<string, Set<StoreEventListener>>();
  
  on(eventType: StoreEvent['type'], listener: StoreEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(listener);
    
    // Retorna função para remover o listener
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }
  
  off(eventType: StoreEvent['type'], listener: StoreEventListener): void {
    this.listeners.get(eventType)?.delete(listener);
  }
  
  async emit(event: StoreEvent): Promise<void> {
    const listeners = this.listeners.get(event.type);
    if (!listeners) return;
    
    // Executa listeners em paralelo
    const promises: Promise<void>[] = [];
    
    for (const listener of listeners) {
      promises.push(
        Promise.resolve(listener(event)).catch(error => {
          console.error(`Erro no listener para ${event.type}:`, error);
        })
      );
    }
    
    await Promise.all(promises);
  }
  
  removeAllListeners(eventType?: StoreEvent['type']): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

export const storeEvents = new EventEmitter();