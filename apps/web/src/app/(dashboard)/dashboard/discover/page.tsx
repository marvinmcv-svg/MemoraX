'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Clock, Lightbulb, ChevronRight, Brain, Archive, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SerendipityMemory {
  memoryId: string;
  content: string;
  intent: string;
  sourceChannel: string | null;
  createdAt: string;
  score: number;
  reason: string;
}

const intentColors: Record<string, string> = {
  reminder: '#F59E0B',
  note: '#6366F1',
  task: '#10B981',
  event: '#EC4899',
  serendipity: '#8B5CF6',
  unknown: '#64748B',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DiscoverPage() {
  const [memories, setMemories] = useState<SerendipityMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [surfacedIds, setSurfacedIds] = useState<Set<string>>(new Set());

  const fetchDiscover = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.kg.discover();
      setMemories((result.memories as SerendipityMemory[]) || []);
    } catch (error) {
      console.error('Failed to fetch discoveries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscover();
  }, [fetchDiscover]);

  const handleMarkSurfaced = async (memoryId: string) => {
    try {
      await api.kg.markSurfaced(memoryId);
      setSurfacedIds(prev => new Set([...prev, memoryId]));
    } catch (error) {
      console.error('Failed to mark surfaced:', error);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-secondary-400" />
          Discover
        </h1>
        <p className="text-text-secondary">
          Serendipitous memories resurfaced based on your activity patterns
        </p>
      </motion.div>

      {/* Header Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-500/10 border border-secondary-500/20">
            <Lightbulb className="w-4 h-4 text-secondary-400" />
            <span className="text-sm text-secondary-400 font-medium">
              {memories.length} memories surfaced today
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchDiscover}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Discovery Cards */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-48 bg-surface rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : memories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-12 rounded-2xl border border-border bg-surface text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary-500/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-secondary-400" />
            </div>
            <p className="text-text-secondary text-lg mb-2">No discoveries today</p>
            <p className="text-text-muted text-sm mb-6">
              Check back later for serendipitous memory resurfacing
            </p>
            <Button onClick={fetchDiscover} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Check again
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memories.map((memory, i) => {
              const isSurfaced = surfacedIds.has(memory.memoryId);
              const intentColor = intentColors[memory.intent] || intentColors.unknown;

              return (
                <motion.div
                  key={memory.memoryId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative p-6 rounded-2xl border bg-surface overflow-hidden transition-all ${
                    isSurfaced
                      ? 'border-secondary-500/30 opacity-75'
                      : 'border-border hover:border-primary-500/30'
                  }`}
                >
                  {/* Score indicator */}
                  <div className="absolute top-4 right-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: `${intentColor}20`,
                        color: intentColor,
                      }}
                    >
                      {Math.round(memory.score * 100)}
                    </div>
                  </div>

                  {/* Intent badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium uppercase"
                      style={{
                        backgroundColor: `${intentColor}20`,
                        color: intentColor,
                      }}
                    >
                      {memory.intent}
                    </span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(memory.createdAt)}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-text-primary text-base leading-relaxed mb-4 pr-12">
                    "{memory.content}"
                  </p>

                  {/* Reason */}
                  <div className="flex items-start gap-2 mb-4 p-3 bg-background rounded-xl">
                    <Lightbulb className="w-4 h-4 text-accent-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-text-secondary">{memory.reason}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => console.log('View memory:', memory.memoryId)}
                      className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      View memory
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {!isSurfaced ? (
                      <button
                        onClick={() => handleMarkSurfaced(memory.memoryId)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-500/10 text-secondary-400 hover:bg-secondary-500/20 transition-colors text-sm font-medium"
                      >
                        <Archive className="w-4 h-4" />
                        Save for later
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-500/10 text-secondary-400 text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Saved
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-6 rounded-2xl border border-border bg-surface"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h3 className="text-text-primary font-semibold mb-1">How serendipity works</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Our AI analyzes your memory patterns, timing, and content to surface memories that you might not have thought about recently but could be relevant now. Memories are eligible after 7 days and are surfaced based on contextual relevance and time-of-day patterns.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}