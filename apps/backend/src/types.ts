export type ChannelType = 'whatsapp' | 'telegram' | 'slack' | 'sms' | 'email' | 'app';
export type IntentType = 'reminder' | 'note' | 'task' | 'event' | 'serendipity' | 'question' | 'homework' | 'unknown';
export type ContentType = 'text' | 'voice' | 'image' | 'link';
export type ReminderStatus = 'pending' | 'sent' | 'snoozed' | 'cancelled';
export type HomeworkStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type HomeworkPriority = 'low' | 'medium' | 'high';
export type HomeworkSource = 'manual' | 'whatsapp' | 'classroom' | 'telegram' | 'slack';

export interface Memory {
  id: string;
  userId: string;
  content: string;
  contentType: ContentType;
  intent: IntentType | null;
  sourceChannel: ChannelType | null;
  mediaUrl: string | null;
  metadata: Record<string, unknown>;
  embedding: number[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  memoryId: string;
  remindAt: Date;
  rrule: string | null;
  status: ReminderStatus;
  deliveryChannel: ChannelType | null;
  createdAt: Date;
}

export interface UserChannel {
  id: string;
  userId: string;
  channel: ChannelType;
  channelUserId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Workspace {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export interface Briefing {
  id: string;
  userId: string;
  content: string;
  generatedAt: Date;
  memoriesCount: number;
  remindersCount: number;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  prefix: string;
  permissions: string[];
  lastUsed: Date | null;
  createdAt: Date;
}

export interface Homework {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  subject: string | null;
  dueAt: Date | null;
  status: HomeworkStatus;
  priority: HomeworkPriority;
  source: HomeworkSource;
  courseId: string | null;
  classroomAssignmentId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
