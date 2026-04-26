'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, Edit3, Clock, Sparkles, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type Memory } from '@/lib/api';

const intents = {
  reminder: { color: '#F59E0B', label: 'Reminder', icon: Clock },
  note: { color: '#6366F1', label: 'Note', icon: Sparkles },
  task: { color: '#10B981', label: 'Task', icon: Clock },
  event: { color: '#EC4899', label: 'Event', icon: Clock },
  serendipity: { color: '#8B5CF6', label: 'Serendipity', icon: Sparkles },
  question: { color: '#06B6D4', label: 'Question', icon: Sparkles },
  unknown: { color: '#64748B', label: 'Memory', icon: Sparkles },
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

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIntent, setFilterIntent] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const fetchMemories = useCallback(async () => {
    try {
      const response = await api.memories.list();
      setMemories(response.data);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const deleteMemory = async (id: string) => {
    try {
      await api.memories.delete(id);
      setMemories(memories.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const filteredMemories = memories.filter(m => {
    if (filterIntent && m.intent !== filterIntent) return false;
    if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Memories</h1>
          <p className="text-text-secondary mt-1">{memories.length} memories captured</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories with AI..."
            className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-2xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-hover rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 bg-surface border border-border rounded-2xl hover:border-primary transition-colors flex items-center gap-2 ${
            showFilters || filterIntent ? 'border-primary text-primary' : 'text-text-secondary'
          }`}
        >
          <span className="hidden sm:inline text-sm font-medium">Filters</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-4 bg-surface rounded-2xl border border-border">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setFilterIntent(null); setShowFilters(false); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    !filterIntent ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:text-text-primary'
                  }`}
                >
                  All types
                </button>
                {Object.entries(intents).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    onClick={() => { setFilterIntent(key); setShowFilters(false); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      filterIntent === key ? 'text-white' : 'bg-background text-text-secondary hover:text-text-primary'
                    }`}
                    style={filterIntent === key ? { backgroundColor: color } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredMemories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-surface rounded-2xl border border-border"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <p className="text-text-primary text-lg font-medium mb-1">No memories found</p>
          <p className="text-text-secondary">Capture your first thought using Quick Capture or connect a channel</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredMemories.map((memory) => {
              const intent = intents[memory.intent as keyof typeof intents] || intents.unknown;
              const IntentIcon = intent.icon;
              return (
                <motion.div
                  key={memory.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group p-5 bg-surface rounded-2xl border border-border hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => setSelectedMemory(memory)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${intent.color}20` }}
                      >
                        <IntentIcon className="w-4 h-4" style={{ color: intent.color }} />
                      </div>
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: `${intent.color}20`,
                          color: intent.color,
                        }}
                      >
                        {intent.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMemory(memory.id); }}
                        className="p-1.5 text-text-muted hover:text-red-500 hover:bg-background rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-text-primary leading-relaxed line-clamp-3 mb-4">{memory.content}</p>

                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-2">
                      <span>{channelIcons[memory.sourceChannel || 'app']}</span>
                      <span className="capitalize">{memory.sourceChannel || 'app'}</span>
                    </div>
                    <span>{formatRelativeTime(memory.createdAt)}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedMemory(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-surface border border-border rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      {(() => {
                        const intent = intents[selectedMemory.intent as keyof typeof intents] || intents.unknown;
                        const IntentIcon = intent.icon;
                        return <IntentIcon className="w-6 h-6 text-primary" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Memory Details</h3>
                      <p className="text-sm text-text-muted">{formatRelativeTime(selectedMemory.createdAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMemory(null)}
                    className="p-2 hover:bg-background rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <span
                    className="px-3 py-1.5 text-sm font-medium rounded-full"
                    style={{
                      backgroundColor: `${intents[selectedMemory.intent as keyof typeof intents]?.color || '#64748B'}20`,
                      color: intents[selectedMemory.intent as keyof typeof intents]?.color || '#64748B',
                    }}
                  >
                    {intents[selectedMemory.intent as keyof typeof intents]?.label || 'Memory'}
                  </span>
                </div>

                <p className="text-text-primary text-lg leading-relaxed mb-6">{selectedMemory.content}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-background rounded-xl">
                    <p className="text-text-muted mb-1">Channel</p>
                    <p className="text-text-primary flex items-center gap-2">
                      {channelIcons[selectedMemory.sourceChannel || 'app']} {selectedMemory.sourceChannel || 'app'}
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-xl">
                    <p className="text-text-muted mb-1">Created</p>
                    <p className="text-text-primary">{new Date(selectedMemory.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border flex gap-3">
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="flex-1 py-3 bg-background text-text-primary rounded-xl font-medium hover:bg-surface-hover transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { deleteMemory(selectedMemory.id); setSelectedMemory(null); }}
                  className="flex-1 py-3 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}