'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, Clock, Hash, X, Filter, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type Memory } from '@/lib/api';

const intents = {
  reminder: { color: '#F59E0B', label: 'Reminder' },
  note: { color: '#6366F1', label: 'Note' },
  task: { color: '#10B981', label: 'Task' },
  event: { color: '#EC4899', label: 'Event' },
  serendipity: { color: '#8B5CF6', label: 'Serendipity' },
  question: { color: '#06B6D4', label: 'Question' },
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

interface SearchResult {
  memory: Memory;
  score: number;
  highlights: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterIntent, setFilterIntent] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    const searches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(searches);
    localStorage.setItem('recentSearches', JSON.stringify(searches));

    try {
      const response = await api.memories.search(searchQuery);
      setResults(response.data.map((item: { memory: Memory; score: number }) => ({
        memory: item.memory,
        score: item.score,
        highlights: [searchQuery],
      })));
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [recentSearches]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch(query);
    }
  };

  const filteredResults = results.filter(r => {
    if (filterIntent && r.memory.intent !== filterIntent) return false;
    return true;
  });

  const suggestedQueries = [
    'remind me to call mom',
    'meeting with team',
    'project ideas',
    'things I learned this week',
    'travel plans',
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Search className="w-8 h-8 text-primary" />
          Search Memories
        </h1>
        <p className="text-text-secondary">Find anything using natural language</p>
      </motion.div>

      <div className="relative mb-8">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search memories... Try: 'what did I discuss about the project launch?'"
            className="w-full pl-14 pr-14 py-5 bg-surface border border-border rounded-2xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-surface-hover rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          )}
        </div>

        <motion.button
          onClick={() => performSearch(query)}
          disabled={!query.trim() || loading}
          className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-glow transition-all disabled:opacity-50 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>AI Search</span>
            </>
          )}
        </motion.button>
      </div>

      {!hasSearched && (
        <>
          {recentSearches.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8"
            >
              <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent searches
              </h2>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, i) => (
                  <motion.button
                    key={search}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      setQuery(search);
                      performSearch(search);
                    }}
                    className="px-4 py-2 bg-surface border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all flex items-center gap-2"
                  >
                    <Clock className="w-3 h-3" />
                    {search}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Suggested searches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedQueries.map((suggestion, i) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setQuery(suggestion);
                    performSearch(suggestion);
                  }}
                  className="p-4 bg-surface border border-border rounded-xl hover:border-primary/30 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-text-primary">{suggestion}</span>
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-muted">
              {loading ? 'Searching...' : `${filteredResults.length} results for "${query}"`}
            </p>
            <button
              onClick={() => setFilterIntent(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filterIntent ? 'bg-surface text-text-secondary border border-border hover:text-text-primary' : 'bg-primary text-white'
              }`}
            >
              <Filter className="w-3 h-3" />
              {filterIntent ? `Filtered: ${intents[filterIntent as keyof typeof intents]?.label}` : 'All types'}
            </button>
          </div>

          {!loading && (
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(intents).map(([key, { label, color }]) => (
                <button
                  key={key}
                  onClick={() => setFilterIntent(filterIntent === key ? null : key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterIntent === key
                      ? 'text-white'
                      : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
                  }`}
                  style={filterIntent === key ? { backgroundColor: color } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredResults.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-surface rounded-2xl border border-border"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <p className="text-text-primary text-lg font-medium mb-1">No memories found</p>
              <p className="text-text-secondary">Try different keywords or connect AI services for semantic search</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredResults.map((result, i) => {
                  const intent = intents[result.memory.intent as keyof typeof intents] || intents.unknown;
                  return (
                    <motion.div
                      key={result.memory.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-6 bg-surface rounded-2xl border border-border hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: `${intent.color}20`,
                              color: intent.color,
                            }}
                          >
                            {intent.label}
                          </div>
                          <span className="text-xs text-text-muted">
                            {channelIcons[result.memory.sourceChannel || 'app']} {result.memory.sourceChannel || 'app'}
                          </span>
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {Math.round(result.score * 100)}% match
                          </span>
                        </div>
                        <span className="text-xs text-text-muted">{formatRelativeTime(result.memory.createdAt)}</span>
                      </div>

                      <p className="text-text-primary text-lg leading-relaxed mb-3">{result.memory.content}</p>

                      {result.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {result.highlights.map((highlight, hi) => (
                            <span
                              key={hi}
                              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-lg"
                            >
                              matched: {highlight}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}