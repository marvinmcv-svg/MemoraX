import { v4 as uuid } from 'uuid';
import { randomBytes } from 'crypto';
import { getDb } from './db';
import { memoryRepository } from '../repositories/memories';
import type { Memory, Reminder, UserChannel, Workspace, Briefing, ApiKey } from '../types';

const useDb = !!getDb();

if (useDb) {
  console.log('[store] Using Postgres-backed stores (DATABASE_URL is set)');
} else {
  console.log('[store] Using in-memory stores (DATABASE_URL is not set — dev/test only)');
}

const memories: Memory[] = [];
const reminders: Reminder[] = [];
const channels: UserChannel[] = [];
const workspaces: Workspace[] = [];
const briefings: Briefing[] = [];
const apiKeys: ApiKey[] = [];

export const __resetStoreForTesting = (): void => {
  memories.length = 0;
  reminders.length = 0;
  channels.length = 0;
  workspaces.length = 0;
  briefings.length = 0;
  apiKeys.length = 0;
};

export const generateApiKey = (): { key: string; prefix: string } => {
  const raw = randomBytes(32).toString('hex');
  return { key: `mxa_${raw}`, prefix: `mxa_${raw.slice(0, 8)}` };
};

export const memoryStore = {
  async create(data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    if (useDb) return memoryRepository.create(data);
    const memory: Memory = {
      ...data,
      id: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memories.push(memory);
    return memory;
  },

  async findByUser(userId: string): Promise<Memory[]> {
    if (useDb) return memoryRepository.findByUser(userId);
    return memories
      .filter(m => m.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async findById(id: string, userId: string): Promise<Memory | undefined> {
    if (useDb) {
      const row = await memoryRepository.findById(id, userId);
      return row ?? undefined;
    }
    return memories.find(m => m.id === id && m.userId === userId);
  },

  async update(
    id: string,
    userId: string,
    data: { content?: string; metadata?: Record<string, unknown> }
  ): Promise<Memory | undefined> {
    if (useDb) {
      const row = await memoryRepository.update(id, userId, data);
      return row ?? undefined;
    }
    const memory = memories.find(m => m.id === id && m.userId === userId);
    if (!memory) return undefined;
    if (data.content !== undefined) memory.content = data.content;
    if (data.metadata !== undefined) memory.metadata = { ...memory.metadata, ...data.metadata };
    memory.updatedAt = new Date();
    return memory;
  },

  async setIntentAndEmbedding(
    id: string,
    intent: Memory['intent'],
    embedding: number[] | null
  ): Promise<Memory | undefined> {
    if (useDb) {
      const row = await memoryRepository.setIntentAndEmbedding(id, intent, embedding);
      return row ?? undefined;
    }
    const memory = memories.find(m => m.id === id);
    if (!memory) return undefined;
    memory.intent = intent;
    memory.embedding = embedding && embedding.length > 0 ? embedding : null;
    memory.updatedAt = new Date();
    return memory;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    if (useDb) return memoryRepository.delete(id, userId);
    const index = memories.findIndex(m => m.id === id && m.userId === userId);
    if (index > -1) {
      memories.splice(index, 1);
      return true;
    }
    return false;
  },

  async search(userId: string, query: string): Promise<Memory[]> {
    if (useDb) return memoryRepository.search(userId, query);
    const lowerQuery = query.toLowerCase();
    return memories
      .filter(m => m.userId === userId && m.content.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
};

export const reminderStore = {
  async create(data: Omit<Reminder, 'id' | 'createdAt'>): Promise<Reminder> {
    const reminder: Reminder = {
      ...data,
      id: uuid(),
      createdAt: new Date(),
    };
    reminders.push(reminder);
    return reminder;
  },

  async findByUser(userId: string): Promise<Reminder[]> {
    return reminders
      .filter(r => r.userId === userId)
      .sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime());
  },

  async findById(id: string, userId: string): Promise<Reminder | undefined> {
    return reminders.find(r => r.id === id && r.userId === userId);
  },

  async update(id: string, userId: string, data: Partial<Reminder>): Promise<Reminder | undefined> {
    const reminder = reminders.find(r => r.id === id && r.userId === userId);
    if (reminder) {
      Object.assign(reminder, data);
    }
    return reminder;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const index = reminders.findIndex(r => r.id === id && r.userId === userId);
    if (index > -1) {
      reminders.splice(index, 1);
      return true;
    }
    return false;
  },

  async findDue(): Promise<Reminder[]> {
    const now = new Date();
    return reminders.filter(r => r.status === 'pending' && r.remindAt <= now);
  }
};

export const channelStore = {
  async create(data: Omit<UserChannel, 'id' | 'createdAt'>): Promise<UserChannel> {
    const channel: UserChannel = {
      ...data,
      id: uuid(),
      createdAt: new Date(),
    };
    channels.push(channel);
    return channel;
  },

  async findByUser(userId: string): Promise<UserChannel[]> {
    return channels.filter(c => c.userId === userId);
  },

  async findByChannelAndUserId(channel: string, channelUserId: string): Promise<UserChannel | undefined> {
    return channels.find(c => c.channel === channel && c.channelUserId === channelUserId);
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const index = channels.findIndex(c => c.id === id && c.userId === userId);
    if (index > -1) {
      channels.splice(index, 1);
      return true;
    }
    return false;
  }
};

export const workspaceStore = {
  async create(data: Omit<Workspace, 'id' | 'createdAt'>): Promise<Workspace> {
    const workspace: Workspace = {
      ...data,
      id: uuid(),
      createdAt: new Date(),
    };
    workspaces.push(workspace);
    return workspace;
  },

  async findByUser(userId: string): Promise<Workspace[]> {
    return workspaces.filter(w => w.teamId === userId);
  },

  async findById(id: string): Promise<Workspace | undefined> {
    return workspaces.find(w => w.id === id);
  }
};

export const briefingStore = {
  async create(data: Omit<Briefing, 'id' | 'generatedAt'>): Promise<Briefing> {
    const briefing: Briefing = {
      ...data,
      id: uuid(),
      generatedAt: new Date(),
    };
    briefings.push(briefing);
    return briefing;
  },

  async findLatestByUser(userId: string): Promise<Briefing | undefined> {
    return briefings
      .filter(b => b.userId === userId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())[0];
  }
};

export const apiKeyStore = {
  async create(data: { userId: string; name: string; permissions?: string[] }): Promise<ApiKey> {
    const { key, prefix } = generateApiKey();
    const apiKey: ApiKey = {
      id: uuid(),
      userId: data.userId,
      name: data.name,
      key,
      prefix,
      permissions: data.permissions ?? ['read', 'write'],
      lastUsed: null,
      createdAt: new Date(),
    };
    apiKeys.push(apiKey);
    return apiKey;
  },

  async findByUser(userId: string): Promise<ApiKey[]> {
    return apiKeys
      .filter(k => k.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async findById(id: string, userId: string): Promise<ApiKey | undefined> {
    return apiKeys.find(k => k.id === id && k.userId === userId);
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const index = apiKeys.findIndex(k => k.id === id && k.userId === userId);
    if (index > -1) {
      apiKeys.splice(index, 1);
      return true;
    }
    return false;
  },
};
