'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, TrendingUp, Sparkles, ArrowRight, Hash, Plus, Search } from 'lucide-react';
import { api, type Memory } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MemoryList } from '@/components/ui/MemoryCard';
import { QuickCapture } from '@/components/features/QuickCapture';

const intents = {
  reminder: { color: '#F59E0B', label: 'Reminder' },
  note: { color: '#6366F1', label: 'Note' },
  task: { color: '#10B981', label: 'Task' },
  event: { color: '#EC4899', label: 'Event' },
  serendipity: { color: '#8B5CF6', label: 'Serendipity' },
  unknown: { color: '#64748B', label: 'Memory' },
};

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
    { label: 'Total Memories', value: String(memories.length), icon: Brain, color: 'primary' },
    { label: 'This Week', value: String(memories.length), icon: TrendingUp, color: 'secondary' },
    { label: 'Quick Capture', value: 'Active', icon: Sparkles, color: 'accent' },
  ];

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
              onRemind={(memory) => console.log('Remind:', memory.id)}
              onArchive={(memory) => console.log('Archive:', memory.id)}
              onDelete={(memory) => console.log('Delete:', memory.id)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
