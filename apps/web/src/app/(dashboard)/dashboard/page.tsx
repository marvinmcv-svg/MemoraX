'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Brain, Clock, TrendingUp, Sparkles, ChevronRight, ArrowRight, Hash, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type Memory } from '@/lib/api';
import { QuickCapture } from '@/components/features/QuickCapture';

const intents = {
  reminder: { color: '#F59E0B', label: 'Reminder' },
  note: { color: '#6366F1', label: 'Note' },
  task: { color: '#10B981', label: 'Task' },
  event: { color: '#EC4899', label: 'Event' },
  serendipity: { color: '#8B5CF6', label: 'Serendipity' },
  unknown: { color: '#64748B', label: 'Memory' },
};

const channelIcons: Record<string, string> = {
  whatsapp: '💬',
  telegram: '✈️',
  slack: '⚡',
  sms: '📱',
  email: '📧',
  app: '🌐',
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

export default function DashboardPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = useCallback(async () => {
    try {
      const response = await api.memories.list();
      setMemories(response.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const stats = [
    { label: 'Total Memories', value: String(memories.length), icon: Brain },
    { label: 'This Week', value: String(memories.length), icon: TrendingUp },
    { label: 'Quick Capture', value: 'Active', icon: Sparkles },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Welcome back
          <span className="text-gradient">.</span>
        </h1>
        <p className="text-text-secondary text-lg">Here&apos;s what&apos;s happening with your memories today.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl border border-border bg-surface hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">{stat.value}</p>
            <p className="text-sm text-text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <QuickCapture onSuccess={fetchMemories} />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border border-border bg-surface"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">Daily Briefing</h2>
              <p className="text-sm text-text-muted">Your AI-generated digest</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Good morning!</h3>
              <p className="text-text-primary text-sm leading-relaxed">
                You have {memories.length} memories captured.
                Connect AI services for personalized daily briefings.
              </p>
            </div>

            <div className="p-4 bg-background rounded-xl border border-border">
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                <Brain className="w-4 h-4 text-primary" />
                <span>Recent activity</span>
              </div>
              {memories.length > 0 ? (
                <p className="text-text-primary text-sm">
                  Last memory: &quot;{memories[0].content.slice(0, 50)}...&quot;
                </p>
              ) : (
                <p className="text-text-muted text-sm">No memories yet</p>
              )}
            </div>

            <button className="w-full py-3 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
              <span>View full briefing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            Recent Memories
          </h2>
          <Link
            href="/dashboard/memories"
            className="text-sm text-primary hover:text-primary-glow flex items-center gap-1 transition-colors"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : memories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 rounded-2xl border border-border bg-surface text-center"
          >
            <Brain className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">Your memory palace is empty.</p>
            <p className="text-text-muted text-sm mt-1">Capture your first thought using Quick Capture above!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {memories.map((memory, i) => {
                const intent = intents[memory.intent as keyof typeof intents] || intents.unknown;
                return (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-5 rounded-2xl border border-border bg-surface hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${intent.color}20`,
                            color: intent.color,
                          }}
                        >
                          {intent.label}
                        </span>
                        <span className="text-xs text-text-muted">
                          {channelIcons[memory.sourceChannel || 'app']} {memory.sourceChannel || 'app'}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted">{formatRelativeTime(memory.createdAt)}</span>
                    </div>
                    <p className="text-text-primary leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                      {memory.content}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}