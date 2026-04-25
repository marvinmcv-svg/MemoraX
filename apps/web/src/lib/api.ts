const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://memorax-backend.up.railway.app';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

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

export interface Briefing {
  id: string;
  userId: string;
  content: string;
  generatedAt: string;
  memoriesCount: number;
  remindersCount: number;
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
    search: (query: string) =>
      apiRequest<{ data: { memory: Memory; score: number }[]; query: string }>('/api/v1/memories/search', {
        method: 'POST',
        body: { query },
      }),
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

  channels: {
    list: () => apiRequest<{ data: unknown[] }>('/api/v1/channels'),
    connect: (channel: string, channelUserId: string) =>
      apiRequest<unknown>('/api/v1/channels/connect', { method: 'POST', body: { channel, channelUserId } }),
  },

  briefing: {
    generate: () => apiRequest<Briefing>('/api/v1/briefing/generate', { method: 'POST' }),
    latest: () => apiRequest<Briefing>('/api/v1/briefing/latest'),
  },

  ai: {
    classify: (content: string) =>
      apiRequest<{ intent: string; confidence: number; reasoning: string }>('/api/v1/ai/classify', {
        method: 'POST',
        body: { content },
      }),
    extract: (content: string) =>
      apiRequest<{ entities: unknown[]; relationships: unknown[] }>('/api/v1/ai/extract', {
        method: 'POST',
        body: { content },
      }),
  },
};
