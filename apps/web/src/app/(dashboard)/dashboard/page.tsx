'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Sparkles, ArrowRight, Hash, Plus, Bell, X } from 'lucide-react';
import { api, type Memory, type Reminder } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MemoryList } from '@/components/ui/MemoryCard';
import { QuickCapture } from '@/components/features/QuickCapture';
import { useToast } from '@/components/ui/Toast';

function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DashboardPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [remindModal, setRemindModal] = useState<{ memory: Memory; remindAt: string } | null(null);
  const [submittingRemind, setSubmittingRemind] = useState(false);
  const { addToast } = useToast();

  const fetchMemories = useCallback(async () => {
    try {
      const response = await api.memories.list();
      setMemories(response.data.slice(0, 5));
      setTotalCount(response.total);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      addToast('error', 'Failed to load memories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekCount = memories.filter(m => new Date(m.createdAt) >= oneWeekAgo).length;

  const stats = [
    { label: 'Total Memories', value: String(totalCount), icon: Brain, color: 'primary' },
    { label: 'This Week', value: String(thisWeekCount), icon: TrendingUp, color: 'secondary' },
    { label: 'Recent (Dashboard)', value: String(memories.length), icon: Sparkles, color: 'accent' },
  ];

  const handleRemind = (memory: Memory) => {
    const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
    setRemindModal({ memory, remindAt: toLocalDatetimeInputValue(defaultDate) });
  };

  const submitRemind = async () => {
    if (!remindModal) return;
    const { memory, remindAt } = remindModal;
    setSubmittingRemind(true);
    try {
      const isoRemindAt = new Date(remindAt).toISOString();
      const reminder: Reminder = await api.reminders.create({
        memoryId: memory.id,
        remindAt: isoRemindAt,
      });
      addToast('success', `Reminder set for "${memory.content.slice(0, 30)}..."`);
      setRemindModal(null);
      console.log('Reminder created:', reminder.id);
    } catch (error) {
      console.error('Failed to create reminder:', error);
      addToast('error', 'Failed to set reminder. Please try again.');
    } finally {
      setSubmittingRemind(false);
    }
  };

  const handleArchive = async (memory: Memory) => {
    try {
      addToast('info', `Archive coming soon for "${memory.content.slice(0, 30)}..."`);
    } catch (error) {
      addToast('error', 'Failed to archive memory.');
    }
  };

  const handleDelete = async (memory: Memory) => {
    if (!confirm(`Delete this memory?\n\n"${memory.content.slice(0, 80)}"`)) return;
    try {
      await api.memories.delete(memory.id);
      setMemories(prev => prev.filter(m => m.id !== memory.id));
      setTotalCount(prev => Math.max(0, prev - 1));
      addToast('success', 'Memory deleted.');
    } catch (error) {
      console.error('Failed to delete memory:', error);
      addToast('error', 'Failed to delete memory. Please try again.');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-text-primary mb-2 tracking-tight">
          Welcome back
          <span className="text-gradient-primary">.</span>
        </h1>
        <p className="text-text-secondary text-lg">Here's what's happening with your memories today.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative p-6 rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary-500/30 transition-all duration-300"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                stat.color === 'primary' ? 'bg-primary-500/10' :
                stat.color === 'secondary' ? 'bg-secondary-500/10' :
                'bg-accent-500/10'
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.color === 'primary' ? 'text-primary-400' :
                  stat.color === 'secondary' ? 'text-secondary-400' :
                  'text-accent-400'
                }`} />
              </div>
            </div>

            <p className="text-3xl font-bold text-text-primary mb-1">{stat.value}</p>
            <p className="text-sm text-text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Capture */}
        <div className="lg:col-span-2">
          <QuickCapture onSuccess={fetchMemories} />
        </div>

        {/* Daily Briefing */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-secondary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <Card variant="default" padding="md" className="relative">
            <CardHeader
              title="Daily Briefing"
              description="Your AI-generated digest"
              icon={<Sparkles className="w-5 h-5 text-secondary-400" />}
            />

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
                  <Brain className="w-4 h-4 text-primary-400" />
                  <span>Recent activity</span>
                </div>
                {memories.length > 0 ? (
                  <p className="text-text-primary text-sm">
                    Last memory: "{memories[0].content.slice(0, 50)}..."
                  </p>
                ) : (
                  <p className="text-text-muted text-sm">No memories yet</p>
                )}
              </div>

              <Button variant="secondary" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                View full briefing
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Memories */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary-400" />
            Recent Memories
          </h2>
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            View all
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-surface rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : memories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 rounded-2xl border border-border bg-surface text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-text-secondary text-lg mb-2">Your memory palace is empty.</p>
              <p className="text-text-muted mb-6">Capture your first thought using Quick Capture above!</p>
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                Add your first memory
              </Button>
            </motion.div>
          ) : (
            <MemoryList
              memories={memories}
              onMemoryClick={(memory) => console.log('Memory clicked:', memory.id)}
              onRemind={handleRemind}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {remindModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !submittingRemind && setRemindModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface border border-border rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Set Reminder</h3>
                    <p className="text-xs text-text-muted line-clamp-1">{remindModal.memory.content}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRemindModal(null)}
                  disabled={submittingRemind}
                  className="p-2 hover:bg-background rounded-xl transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    When to remind you
                  </label>
                  <input
                    type="datetime-local"
                    value={remindModal.remindAt}
                    onChange={(e) => setRemindModal({ ...remindModal, remindAt: e.target.value })}
                    disabled={submittingRemind}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border flex gap-3">
                <button
                  onClick={() => setRemindModal(null)}
                  disabled={submittingRemind}
                  className="flex-1 py-3 bg-background text-text-primary rounded-xl font-medium hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRemind}
                  disabled={submittingRemind || !remindModal.remindAt}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submittingRemind ? 'Setting...' : 'Set Reminder'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
