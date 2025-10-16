import { api } from './http-client';
import type { AuthenticatedApiClient } from '~/hooks/use-authenticated-api';

export interface Reminder {
  id: string;
  title: string;
  time?: string;
  category?: string;
  created_at?: string;
}

/**
 * Create reminders API service with authentication
 * Use this factory function with the useAuthenticatedApi hook
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const authApi = useAuthenticatedApi();
 *   const remindersApi = createRemindersApiService(authApi);
 *
 *   const fetchReminders = async () => {
 *     const reminders = await remindersApi.getTodayReminders();
 *   };
 * }
 * ```
 */
export function createRemindersApiService(apiClient: AuthenticatedApiClient) {
  return {
    async getTodayReminders(): Promise<Reminder[]> {
      try {
        const response = await apiClient.get<Reminder[]>('/reminders/today');
        return response || [];
      } catch (error) {
        console.error('Failed to fetch today reminders:', error);
        // Return empty array for now - can be implemented later
        return [];
      }
    },

    async createReminder(reminder: Omit<Reminder, 'id' | 'created_at'>): Promise<Reminder> {
      try {
        const response = await apiClient.post<Reminder>('/reminders', reminder);
        return response;
      } catch (error) {
        console.error('Failed to create reminder:', error);
        throw error;
      }
    },

    async updateReminder(id: string, reminder: Partial<Reminder>): Promise<Reminder> {
      try {
        const response = await apiClient.put<Reminder>(`/reminders/${id}`, reminder);
        return response;
      } catch (error) {
        console.error('Failed to update reminder:', error);
        throw error;
      }
    },

    async deleteReminder(id: string): Promise<void> {
      try {
        await apiClient.delete(`/reminders/${id}`);
      } catch (error) {
        console.error('Failed to delete reminder:', error);
        throw error;
      }
    }
  };
}

// Legacy service without authentication (deprecated)
// Use createRemindersApiService with useAuthenticatedApi hook instead
export const remindersApiService = {
  async getTodayReminders(): Promise<Reminder[]> {
    try {
      const response = await api.get<Reminder[]>('/reminders/today');
      return response || [];
    } catch (error) {
      console.error('Failed to fetch today reminders:', error);
      return [];
    }
  },

  async createReminder(reminder: Omit<Reminder, 'id' | 'created_at'>): Promise<Reminder> {
    try {
      const response = await api.post<Reminder>('/reminders', reminder);
      return response;
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw error;
    }
  },

  async updateReminder(id: string, reminder: Partial<Reminder>): Promise<Reminder> {
    try {
      const response = await api.put<Reminder>(`/reminders/${id}`, reminder);
      return response;
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  },

  async deleteReminder(id: string): Promise<void> {
    try {
      await api.delete(`/reminders/${id}`);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  }
};
