/**
 * Migration service for localStorage to Supabase
 */

import { getSupabaseClient } from '~/lib/supabase/client';

import { conversationsService } from './conversations';
import { messagesService } from './messages';

interface MigrationResult {
  success: boolean;
  migratedThreads?: number;
  migratedMessages?: number;
  error?: string;
}

interface LocalThread {
  id: string;
  createdAt?: string;
  title?: string;
  messages: LocalMessage[];
}

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  contentChunks?: string[];
}

export async function migrateLocalStorageToSupabase(): Promise<MigrationResult> {
  try {
    const supabase = getSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado'
      };
    }

    // Get threads from localStorage
    const threadsData = localStorage.getItem('deer-flow-threads');
    if (!threadsData) {
      return {
        success: true,
        migratedThreads: 0,
        migratedMessages: 0
      };
    }

    let threads: LocalThread[];
    try {
      threads = JSON.parse(threadsData);
    } catch (parseError) {
      return {
        success: false,
        error: parseError instanceof Error ? parseError.message : 'Erro ao parsear dados'
      };
    }

    let migratedThreads = 0;
    let migratedMessages = 0;

    // Migrate each thread
    for (const thread of threads) {
      try {
        // Create conversation
        await conversationsService.createConversation({
          id: thread.id,
          title: thread.title || 'Conversa sem título',
          created_at: thread.createdAt || new Date().toISOString()
        });
        migratedThreads++;

        // Migrate messages
        if (thread.messages && Array.isArray(thread.messages)) {
          for (const message of thread.messages) {
            try {
              await messagesService.createMessage({
                id: message.id,
                threadId: thread.id,
                role: message.role,
                content: message.content,
                contentChunks: message.contentChunks || [message.content]
              });
              migratedMessages++;
            } catch (messageError) {
              console.error('Error migrating message:', messageError);
              // Continue with other messages
            }
          }
        }
      } catch (threadError) {
        console.error('Error migrating thread:', threadError);
        throw threadError; // Stop migration if thread creation fails
      }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem('deer-flow-threads');

    return {
      success: true,
      migratedThreads,
      migratedMessages
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}