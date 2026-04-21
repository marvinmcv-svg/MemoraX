'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Trash2, Edit3 } from 'lucide-react';
import { api, type Memory } from '../../../../lib/api';

const intents = {
  reminder: { color: '#F59E0B', label: 'Reminder' },
  note: { color: '#6366F1', label: 'Note' },
  task: { color: '#10B981', label: 'Task' },
  event: { color: '#EC4899', label: 'Event' },
  serendipity: { color: '#8B5CF6', label: 'Serendipity' },
  question: { color: '#06B6D4', label: 'Question' },
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

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIntent, setFilterIntent] = useState<string | null>(null);

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
          <h1 className="text-2xl font-bold text-text-primary">Memories</h1>
          <p className="text-text-secondary mt-1">All your captured memories</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <button className="p-2 bg-surface border border-border rounded-xl hover:border-primary transition-colors">
          <Filter className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterIntent(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            !filterIntent ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:text-text-primary'
          }`}
        >
          All
        </button>
        {Object.entries(intents).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setFilterIntent(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filterIntent === key ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary">No memories found</p>
          <p className="text-text-muted text-sm mt-1">Capture your first thought above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMemories.map(memory => (
            <div key={memory.id} className="p-4 bg-surface rounded-xl border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: `${intents[memory.intent as keyof typeof intents]?.color || '#64748B'}20`,
                      color: intents[memory.intent as keyof typeof intents]?.color || '#64748B',
                    }}
                  >
                    {intents[memory.intent as keyof typeof intents]?.label || 'Memory'}
                  </span>
                  <span className="text-xs text-text-muted">{memory.sourceChannel || 'app'}</span>
                  <span className="text-xs text-text-muted">{formatRelativeTime(memory.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMemory(memory.id)}
                    className="p-1.5 text-text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-text-primary leading-relaxed">{memory.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}