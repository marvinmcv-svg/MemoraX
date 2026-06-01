const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      return res.json();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('Request failed');
}

export interface Memory {
  id: string;
  userId: string;
  content: string;
  contentType: string;
  intent: string;
  sourceChannel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  memoryId: string;
  remindAt: string;
  rrule: string | null;
  status: string;
  deliveryChannel: string | null;
  createdAt: string;
}

export const api = {
  memories: {
    list: () =>
      apiRequest<{ data: Memory[]; total: number; page: number; pageSize: number; hasMore: boolean }>(
        '/api/v1/memories'
      ),
    get: (id: string) => apiRequest<Memory>(`/api/v1/memories/${id}`),
    create: (data: { content: string; contentType?: string; sourceChannel?: string }) =>
      apiRequest<Memory>('/api/v1/memories', { method: 'POST', body: data }),
    delete: (id: string) =>
      apiRequest<{ success: boolean }>(`/api/v1/memories/${id}`, { method: 'DELETE' }),
    search: async (query: string): Promise<{ data: Memory[]; query: string }> => {
      const response = await apiRequest<{ data: { memory: Memory; score: number }[]; query: string }>(
        '/api/v1/memories/search',
        { method: 'POST', body: { query } }
      );
      return {
        query: response.query,
        data: response.data.map((r) => r.memory),
      };
    },
  },

  reminders: {
    list: () => apiRequest<{ data: Reminder[] }>('/api/v1/reminders'),
    get: (id: string) => apiRequest<Reminder>(`/api/v1/reminders/${id}`),
    create: (data: { memoryId: string; remindAt: string; deliveryChannel?: string }) =>
      apiRequest<Reminder>('/api/v1/reminders', { method: 'POST', body: data }),
    update: (id: string, data: Partial<Reminder>) =>
      apiRequest<Reminder>(`/api/v1/reminders/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) =>
      apiRequest<{ success: boolean }>(`/api/v1/reminders/${id}`, { method: 'DELETE' }),
    snooze: (id: string, minutes: number) =>
      apiRequest<Reminder>(`/api/v1/reminders/${id}/snooze`, { method: 'POST', body: { minutes } }),
  },
};