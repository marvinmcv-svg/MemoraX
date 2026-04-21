'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Brain, Clock, TrendingUp, Sparkles, Plus, Mic, Image, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, type Memory } from '@/lib/api';

export const dynamic = 'force-dynamic';

const intents = {
  reminder: { color: '#F59E0B', label: 'Reminder' },
  note: { color: '#6366F1', label: 'Note' },
  task: { color: '#10B981', label: 'Task' },
  event: { color: '#EC4899', label: 'Event' },
  serendipity: { color: '#8B5CF6', label: 'Serendipity' },
  unknown: { color: '#64748B', label: 'Memory' },
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
  const [quickCapture, setQuickCapture] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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

  const handleSubmitMemory = useCallback(async () => {
    if (!quickCapture.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.memories.create({ content: quickCapture });
      setQuickCapture('');
      fetchMemories();
    } catch (error) {
      console.error('Failed to create memory:', error);
    } finally {
      setSubmitting(false);
    }
  }, [quickCapture, submitting, fetchMemories]);

  const stats = [
    { label: 'Total Memories', value: String(memories.length), change: 'this session', icon: Brain },
    { label: 'Reminders Today', value: '0', change: 'upcoming', icon: Clock },
    { label: 'This Week', value: String(memories.length), change: '+0', icon: TrendingUp },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome back</h1>
        <p className="text-text-secondary">Here&apos;s what&apos;s happening with your memories today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-2xl border border-border bg-surface"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1">{stat.value}</p>
            <p className="text-sm text-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">Quick Capture</h2>
                <p className="text-sm text-text-muted">Add a new memory instantly</p>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={quickCapture}
                onChange={(e) => setQuickCapture(e.target.value)}
                placeholder="What&apos;s on your mind? Remind me to..., Note: ..., Remember that..."
                className="w-full h-32 p-4 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-primary transition-colors"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-surface-hover text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary transition-colors">
                  <Image className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSubmitMemory}
                  disabled={submitting || !quickCapture.trim()}
                  className="p-2 rounded-lg bg-primary text-white hover:bg-primary-glow transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-background rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scaleY: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                        className="w-1 h-8 bg-primary rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-text-secondary">Recording... Tap mic to stop</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-surface">
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

            <button className="w-full py-2 text-sm text-primary hover:text-primary-glow transition-colors text-left">
              View full briefing →
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Recent Memories</h2>
          <Link href="/dashboard/memories" className="text-sm text-primary hover:text-primary-glow">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-surface animate-pulse">
                <div className="h-4 bg-surface-hover rounded w-1/4 mb-3" />
                <div className="h-3 bg-surface-hover rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : memories.length === 0 ? (
          <div className="p-8 rounded-xl border border-border bg-surface text-center">
            <p className="text-text-secondary">No memories yet. Capture your first thought above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="p-4 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: `${intents[memory.intent as keyof typeof intents]?.color || '#64748B'}20`,
                        color: intents[memory.intent as keyof typeof intents]?.color || '#64748B',
                      }}
                    >
                      {intents[memory.intent as keyof typeof intents]?.label || 'Memory'}
                    </span>
                    <span className="text-xs text-text-muted">
                      {memory.sourceChannel || 'app'}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted">{formatRelativeTime(memory.createdAt)}</span>
                </div>
                <p className="text-text-primary leading-relaxed">{memory.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
