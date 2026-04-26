"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_LIMITS = exports.INTENT_COLORS = exports.CHANNEL_ICONS = void 0;
exports.CHANNEL_ICONS = {
    whatsapp: '💬',
    telegram: '✈️',
    slack: '⚡',
    sms: '📱',
    email: '📧',
    app: '🌐'
};
exports.INTENT_COLORS = {
    reminder: '#F59E0B',
    note: '#6366F1',
    task: '#10B981',
    event: '#EC4899',
    serendipity: '#8B5CF6',
    question: '#3B82F6',
    unknown: '#64748B'
};
exports.PLAN_LIMITS = {
    free: {
        memoriesPerMonth: 100,
        remindersPerDay: 10,
        channels: ['whatsapp', 'telegram', 'sms', 'email', 'app'],
        workspaces: 0,
        apiAccess: false
    },
    pro: {
        memoriesPerMonth: -1,
        remindersPerDay: -1,
        channels: ['whatsapp', 'telegram', 'slack', 'sms', 'email', 'app'],
        workspaces: 1,
        apiAccess: true
    },
    team: {
        memoriesPerMonth: -1,
        remindersPerDay: -1,
        channels: ['whatsapp', 'telegram', 'slack', 'sms', 'email', 'app'],
        workspaces: -1,
        apiAccess: true
    }
};
