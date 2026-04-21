import { v4 as uuid } from 'uuid';
import type { Memory, Reminder, UserChannel, Workspace, Briefing } from '../types';

const memories: Memory[] = [];
const reminders: Reminder[] = [];
const channels: UserChannel[] = [];
const workspaces: Workspace[] = [];
const briefings: Briefing[] = [];

export const memoryStore = {
  create: (data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Memory => {
    const memory: Memory = {
      ...data,
      id: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memories.push(memory);
    return memory;
  },

  findByUser: (userId: string): Memory[] => {
    return memories.filter(m => m.userId === userId).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  },

  findById: (id: string, userId: string): Memory | undefined => {
    return memories.find(m => m.id === id && m.userId === userId);
  },

  delete: (id: string, userId: string): boolean => {
    const index = memories.findIndex(m => m.id === id && m.userId === userId);
    if (index > -1) {
      memories.splice(index, 1);
      return true;
    }
    return false;
  },

  search: (userId: string, query: string): Memory[] => {
    const lowerQuery = query.toLowerCase();
    return memories
      .filter(m => m.userId === userId && m.content.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
};

export const reminderStore = {
  create: (data: Omit<Reminder, 'id' | 'createdAt'>): Reminder => {
    const reminder: Reminder = {
      ...data,
      id: uuid(),
      createdAt: new Date(),
    };
    reminders.push(reminder);
    return reminder;
  },

  findByUser: (userId: string): Reminder[] => {
    return reminders
      .filter(r => r.userId === userId)
      .sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime());
  },

  findById: (id: string, userId: string): Reminder | undefined => {
    return reminders.find(r => r.id === id && r.userId === userId);
  },

  update: (id: string, userId: string, data: Partial<Reminder>): Reminder | undefined => {
    const reminder = reminders.find(r => r.id === id && r.userId === userId);
    if (reminder) {
      Object.assign(reminder, data);
    }
    return reminder;
  },

  delete: (id: string, userId: string): boolean => {
    const index = reminders.findIndex(r => r.id === id && r.userId === userId);
    if (index > -1) {
      reminders.splice(index, 1);
      return true;
    }
    return false;
  },

  findDue: (): Reminder[] => {
    const now = new Date();
    return reminders.filter(r =>
      r.status === 'pending' && r.remindAt <= now
    );
  }
};

export const channelStore = {
  create: (data: Omit<UserChannel, 'id' | 'createdAt'>): UserChannel => {
    const channel: UserChannel = {
      ...data,
      id: uuid(),
      createdAt: new Date(),
    };
    channels.push(channel);
    return channel;
  },

  findByUser: (userId: string): UserChannel[] => {
    return channels.filter(c => c.userId === userId);
  },

  findByChannelAndUserId: (channel: string, channelUserId: string): UserChannel | undefined => {
    return channels.find(c => c.channel === channel && c.channelUserId === channelUserId);
  },

  delete: (id: string, userId: string): boolean => {
    const index = channels.findIndex(c => c.id === id && c.userId === userId);
    if (index > -1) {
      channels.splice(index, 1);
      return true;
    }
    return false;
  }
};

export const workspaceStore = {
  create: (data: Omit<Workspace, 'id' | 'createdAt'>): Workspace => {
    const workspace: Workspace = {
      ...data,
      id: uuid(),
      createdAt: new Date(),
    };
    workspaces.push(workspace);
    return workspace;
  },

  findByUser: (userId: string): Workspace[] => {
    return workspaces.filter(w => w.teamId === userId);
  },

  findById: (id: string): Workspace | undefined => {
    return workspaces.find(w => w.id === id);
  }
};

export const briefingStore = {
  create: (data: Omit<Briefing, 'id' | 'generatedAt'>): Briefing => {
    const briefing: Briefing = {
      ...data,
      id: uuid(),
      generatedAt: new Date(),
    };
    briefings.push(briefing);
    return briefing;
  },

  findLatestByUser: (userId: string): Briefing | undefined => {
    return briefings
      .filter(b => b.userId === userId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())[0];
  }
};
