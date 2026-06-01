'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { api, type Memory } from '@/lib/api';
import { MemoryList } from '@/components/ui/MemoryCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

type Intent = 'reminder' | 'note' | 'task' | 'event' | 'serendipity' | 'question' | 'unknown';

const intentFilters: { value: Intent | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: '#64748B' },
  { value: 'reminder', label: 'Reminders', color: '#F59E0B' },
  { value: 'note', label: 'Notes', color: '#6366F1' },
  { value: 'task', label: 'Tasks', color: '#10B981' },
  { value: 'event', label: 'Events', color: '#EC4899' },
  { value: 'serendipity', label: 'Serendipity', color: '#8B5CF6' },
];

const channelFilters = [
  { value: 'all', label: 'All Channels' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'slack', label: 'Slack' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'app', label: 'App' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<Intent | 'all'>('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { addToast } = useToast();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await api.memories.search(query);
      setResults(response.data || []);
    } catch (error) {
      addToast('error', 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredResults = results.filter((memory) => {
    if (selectedIntent !== 'all' && memory.intent !== selectedIntent) return false;
    if (selectedChannel !== 'all' && memory.sourceChannel !== selectedChannel) return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedIntent('all');
    setSelectedChannel('all');
  };

  const hasActiveFilters = selectedIntent !== 'all' || selectedChannel !== 'all';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2">Search Memories</h1>
        <p className="text-text-secondary">Find anything you've captured with natural language search.</p>
      </motion.div>

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search memories... Try: 'what did I discuss about the project?'"
          className="w-full pl-12 pr-32 py-4 bg-surface border border-border rounded-2xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-lg"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Button onClick={handleSearch} loading={loading} size="md">
            Search
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'border-primary-500/30 bg-primary-500/10 text-primary-400'
                  : 'border-border text-text-secondary hover:text-text-primary hover:border-primary-500/30'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>

          {searched && (
            <span className="text-sm text-text-muted">
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 rounded-2xl border border-border bg-surface space-y-6">
                {/* Intent Filter */}
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-3 block">Intent Type</label>
                  <div className="flex flex-wrap gap-2">
                    {intentFilters.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setSelectedIntent(filter.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedIntent === filter.value
                            ? 'bg-surface border border-primary-500/30 text-primary-400'
                            : 'bg-background border border-border text-text-secondary hover:text-text-primary hover:border-primary-500/30'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channel Filter */}
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-3 block">Source Channel</label>
                  <div className="flex flex-wrap gap-2">
                    {channelFilters.map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setSelectedChannel(filter.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedChannel === filter.value
                            ? 'bg-surface border border-primary-500/30 text-primary-400'
                            : 'bg-background border border-border text-text-secondary hover:text-text-primary hover:border-primary-500/30'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
            ))}
          </motion.div>
        ) : searched && filteredResults.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 rounded-2xl border border-border bg-surface text-center"
          >
            <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary text-lg mb-2">No memories found</p>
            <p className="text-text-muted">Try adjusting your search or filters</p>
          </motion.div>
        ) : filteredResults.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <MemoryList
              memories={filteredResults}
              onMemoryClick={(memory) => console.log('Memory clicked:', memory.id)}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 rounded-2xl border border-border bg-surface text-center"
          >
            <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary text-lg mb-2">Search your memories</p>
            <p className="text-text-muted">Type a question or phrase to find related memories</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
