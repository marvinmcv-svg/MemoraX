import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { clsx } from 'clsx';
import { Bell, Archive, Trash2, Sparkles } from '@expo/vector-icons';
import type { Memory } from '../../lib/api';

type Intent = 'reminder' | 'note' | 'task' | 'event' | 'serendipity' | 'question' | 'unknown';

const intentConfig: Record<Intent, { color: string; bgColor: string; label: string }> = {
  reminder: { color: '#F59E0B', bgColor: 'bg-accent-500/20', label: 'Reminder' },
  note: { color: '#6366F1', bgColor: 'bg-primary-500/20', label: 'Note' },
  task: { color: '#10B981', bgColor: 'bg-secondary-500/20', label: 'Task' },
  event: { color: '#EC4899', bgColor: 'bg-pink-500/20', label: 'Event' },
  serendipity: { color: '#8B5CF6', bgColor: 'bg-purple-500/20', label: 'Serendipity' },
  question: { color: '#3B82F6', bgColor: 'bg-blue-500/20', label: 'Question' },
  unknown: { color: '#64748B', bgColor: 'bg-surface', label: 'Memory' },
};

const channelConfig: Record<string, { emoji: string; label: string }> = {
  whatsapp: { emoji: '💬', label: 'WhatsApp' },
  telegram: { emoji: '✈️', label: 'Telegram' },
  slack: { emoji: '⚡', label: 'Slack' },
  sms: { emoji: '📱', label: 'SMS' },
  email: { emoji: '📧', label: 'Email' },
  app: { emoji: '🌐', label: 'App' },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface MemoryCardProps {
  memory: Memory;
  onPress?: () => void;
  onRemind?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function MemoryCard({ memory, onPress, onRemind, onArchive, onDelete, compact = false }: MemoryCardProps) {
  const intent = (memory.intent as Intent) || 'unknown';
  const config = intentConfig[intent];
  const channel = channelConfig[memory.sourceChannel || 'app'];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={clsx(
        'bg-surface border border-border rounded-2xl overflow-hidden',
        'active:border-primary-500/30 transition-colors'
      )}
    >
      {/* Header */}
      <View className={clsx('p-4', compact && 'p-3')}>
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className={clsx('px-2 py-1 rounded-full', config.bgColor)}>
              <Text className="text-xs font-medium" style={{ color: config.color }}>
                {config.label}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-background">
              <Text className="text-xs">{channel.emoji}</Text>
              <Text className="text-xs text-text-muted uppercase">{channel.label}</Text>
            </View>
          </View>
          <Text className="text-xs text-text-muted">{formatRelativeTime(memory.createdAt)}</Text>
        </View>

        {/* Content */}
        <Text
          className={clsx(
            'text-text-primary leading-relaxed',
            compact ? 'text-sm line-clamp-2' : 'text-sm line-clamp-3'
          )}
          numberOfLines={compact ? 2 : 3}
        >
          {memory.content}
        </Text>

        {/* Footer - Actions */}
        <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-border/50">
          {onRemind && (
            <TouchableOpacity
              onPress={onRemind}
              className="p-2 rounded-lg active:bg-accent-500/10"
            >
              <Bell size={16} color="#F59E0B" />
            </TouchableOpacity>
          )}
          {onArchive && (
            <TouchableOpacity
              onPress={onArchive}
              className="p-2 rounded-lg active:bg-surface-hover"
            >
              <Archive size={16} color="#64748B" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              className="p-2 rounded-lg active:bg-destructive-500/10"
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
          <View className="flex-1" />
          {memory.metadata && Object.keys(memory.metadata).length > 0 && (
            <View className="flex-row items-center gap-1">
              <Sparkles size={12} color="#6366F1" />
              <Text className="text-xs text-text-muted">AI</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface MemoryListProps {
  memories: Memory[];
  onMemoryPress?: (memory: Memory) => void;
  onRemind?: (memory: Memory) => void;
  onArchive?: (memory: Memory) => void;
  onDelete?: (memory: Memory) => void;
  emptyState?: React.ReactNode;
}

export function MemoryList({ memories, onMemoryPress, onRemind, onArchive, onDelete, emptyState }: MemoryListProps) {
  if (memories.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <View className="space-y-3">
      {memories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          onPress={onMemoryPress ? () => onMemoryPress(memory) : undefined}
          onRemind={onRemind ? () => onRemind(memory) : undefined}
          onArchive={onArchive ? () => onArchive(memory) : undefined}
          onDelete={onDelete ? () => onDelete(memory) : undefined}
        />
      ))}
    </View>
  );
}
