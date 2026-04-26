export type ChannelType = 'whatsapp' | 'telegram' | 'slack' | 'sms' | 'email' | 'app';
export type IntentType = 'reminder' | 'note' | 'task' | 'event' | 'serendipity' | 'question' | 'unknown';
export type ContentType = 'text' | 'voice' | 'image' | 'link';
export type PlanType = 'free' | 'pro' | 'team';
export type ReminderStatus = 'pending' | 'sent' | 'snoozed' | 'cancelled';
export type TeamRole = 'owner' | 'admin' | 'member';
export type EntityType = 'PERSON' | 'PLACE' | 'DATE' | 'TOPIC' | 'ORG' | 'EVENT';
export interface User {
    id: string;
    clerkId: string;
    email: string;
    name: string | null;
    timezone: string;
    plan: PlanType;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserChannel {
    id: string;
    userId: string;
    channel: ChannelType;
    channelUserId: string;
    isActive: boolean;
    createdAt: Date;
}
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
export interface MemoryWithEntities extends Memory {
    entities: MemoryEntity[];
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
export interface MemoryEntity {
    id: string;
    memoryId: string;
    entityType: EntityType;
    entityValue: string;
    confidence: number | null;
    neo4jNodeId: string | null;
}
export interface Team {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Date;
}
export interface TeamMember {
    teamId: string;
    userId: string;
    role: TeamRole;
}
export interface Workspace {
    id: string;
    teamId: string;
    name: string;
    description: string | null;
    createdAt: Date;
}
export interface WorkspaceMemory {
    workspaceId: string;
    memoryId: string;
    addedBy: string;
}
export interface Briefing {
    id: string;
    userId: string;
    content: string;
    generatedAt: Date;
    memoriesCount: number;
    remindersCount: number;
}
export interface AIMessage {
    id: string;
    memoryId: string;
    stage: 'classifying' | 'extracting' | 'embedding' | 'complete';
    result?: Record<string, unknown>;
    error?: string;
}
export interface SearchResult {
    memory: Memory;
    score: number;
    highlights: string[];
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export declare const CHANNEL_ICONS: Record<ChannelType, string>;
export declare const INTENT_COLORS: Record<IntentType, string>;
export declare const PLAN_LIMITS: {
    readonly free: {
        readonly memoriesPerMonth: 100;
        readonly remindersPerDay: 10;
        readonly channels: ChannelType[];
        readonly workspaces: 0;
        readonly apiAccess: false;
    };
    readonly pro: {
        readonly memoriesPerMonth: -1;
        readonly remindersPerDay: -1;
        readonly channels: ChannelType[];
        readonly workspaces: 1;
        readonly apiAccess: true;
    };
    readonly team: {
        readonly memoriesPerMonth: -1;
        readonly remindersPerDay: -1;
        readonly channels: ChannelType[];
        readonly workspaces: -1;
        readonly apiAccess: true;
    };
};
