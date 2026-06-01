'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Brain, Clock, Sparkles, MoreHorizontal, Archive, Bell, Trash2, Edit3 } from 'lucide-react';
import type { Memory } from '@/lib/api';

type Intent = 'reminder' | 'note' | 'task' | 'event' | 'serendipity' | 'question' | 'unknown';

const intentConfig: Record<Intent, { color: string; bgColor: string; label: string; icon: React.ElementType }> = {
  reminder: { color: 'text-accent-400', bgColor: 'bg-accent-500/20', label: 'Reminder', icon: Bell },
  note: { color: 'text-primary-400', bgColor: 'bg-primary-500/20', label: 'Note', icon: Edit3 },
  task: { color: 'text-secondary-400', bgColor: 'bg-secondary-500/20', label: 'Task', icon: Brain },
  event: { color: 'text-pink-400', bgColor: 'bg-pink-500/20', label: 'Event', icon: Clock },
  serendipity: { color: 'text-purple-400', bgColor: 'bg-purple-500/20', label: 'Serendipity', icon: Sparkles },
  question: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Question', icon: Brain },
  unknown: { color: 'text-text-muted', bgColor: 'bg-surface', label: 'Memory', icon: Brain },
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
  onClick?: () => void;
  onArchive?: () => void;
  onRemind?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

export function MemoryCard({ memory, onClick, onArchive, onRemind, onDelete, compact = false }: MemoryCardProps) {
  const intent = (memory.intent as Intent) || 'unknown';
  const config = intentConfig[intent];
  const channel = channelConfig[memory.sourceChannel || 'app'];
  const IntentIcon = config.icon;

  return (
<motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01, borderColor: 'rgba(99, 102, 241, 0.3)' }}
      transition={{ duration: 0.15 }}
      className={clsx(
        'group relative bg-surface border border-border rounded-2xl overflow-hidden',
        'transition-all duration-200',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent pointer-events-none" />

      <div className={clsx('p-5', compact && 'p-4')}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Intent Badge */}
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                config.bgColor,
                config.color
              )}
            >
              <IntentIcon className="w-3 h-3" />
              {config.label}
            </span>

            {/* Channel Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-text-muted bg-background">
              <span>{channel.emoji}</span>
              <span className="text-[10px] uppercase">{channel.label}</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRemind && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemind(); }}
                className="p-1.5 rounded-lg text-text-muted hover:text-accent-400 hover:bg-accent-500/10 transition-colors"
                title="Set reminder"
              >
                <Bell className="w-4 h-4" />
              </button>
            )}
            {onArchive && (
              <button
                onClick={(e) => { e.stopPropagation(); onArchive(); }}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                title="Archive"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg text-text-muted hover:text-destructive-500 hover:bg-destructive-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className={clsx(
          'text-text-primary leading-relaxed',
          compact ? 'line-clamp-2' : 'line-clamp-3'
        )}>
          {memory.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <span className="text-xs text-text-muted">
            {formatRelativeTime(memory.createdAt)}
          </span>
          {memory.metadata && Object.keys(memory.metadata).length > 0 && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI processed
            </span>
          )}
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 rounded-2xl shadow-glow-primary opacity-20" />
      </div>
    </motion.div>
  );
}

interface MemoryListProps {
  memories: Memory[];
  onMemoryClick?: (memory: Memory) => void;
  onRemind?: (memory: Memory) => void;
  onArchive?: (memory: Memory) => void;
  onDelete?: (memory: Memory) => void;
  emptyState?: React.ReactNode;
}

export function MemoryList({ memories, onMemoryClick, onRemind, onArchive, onDelete, emptyState }: MemoryListProps) {
  if (memories.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="grid gap-4">
      {memories.map((memory, i) => (
        <motion.div
          key={memory.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <MemoryCard
            memory={memory}
            onClick={onMemoryClick ? () => onMemoryClick(memory) : undefined}
            onRemind={onRemind ? () => onRemind(memory) : undefined}
            onArchive={onArchive ? () => onArchive(memory) : undefined}
            onDelete={onDelete ? () => onDelete(memory) : undefined}
          />
        </motion.div>
      ))}
    </div>
  );
}
