'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Network, RefreshCw, Search, Users, Calendar, Tag, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

interface Entity {
  id: string;
  type: string;
  value: string;
  memoryId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface Stats {
  entities: number;
  relationships: number;
  types: string[];
}

const typeConfig: Record<string, { icon: typeof Users; color: string; bgColor: string }> = {
  person: { icon: Users, color: '#6366F1', bgColor: 'bg-primary-500/10' },
  date: { icon: Calendar, color: '#10B981', bgColor: 'bg-secondary-500/10' },
  location: { icon: Tag, color: '#F59E0B', bgColor: 'bg-accent-500/10' },
  topic: { icon: Tag, color: '#EC4899', bgColor: 'bg-pink-500/10' },
  organization: { icon: Users, color: '#8B5CF6', bgColor: 'bg-purple-500/10' },
};

const defaultTypeConfig = { icon: Tag, color: '#64748B', bgColor: 'bg-surface' };

export default function KnowledgeGraphPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const fetchGraphData = useCallback(async () => {
    try {
      const [statsData, entitiesData] = await Promise.all([
        api.kg.stats(),
        api.kg.entities(selectedType ? { type: selectedType } : undefined),
      ]);
      setStats(statsData);
      setEntities((entitiesData.data as Entity[]) || []);
    } catch (error) {
      console.error('Failed to fetch knowledge graph:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const result = await api.kg.search(searchQuery);
      setEntities((result.results as unknown as { entity: Entity }[]).map(r => r.entity));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntities = stats?.types || [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Network className="w-8 h-8 text-primary" />
          Knowledge Graph
        </h1>
        <p className="text-text-secondary">Explore entities and relationships extracted from your memories</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border border-border bg-surface"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm mb-1">Total Entities</p>
              <p className="text-3xl font-bold text-text-primary">{stats?.entities || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <Network className="w-6 h-6 text-primary-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border border-border bg-surface"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm mb-1">Relationships</p>
              <p className="text-3xl font-bold text-text-primary">{stats?.relationships || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-secondary-500/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-secondary-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border border-border bg-surface"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm mb-1">Entity Types</p>
              <p className="text-3xl font-bold text-text-primary">{stats?.types?.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-accent-500/10 flex items-center justify-center">
              <Tag className="w-6 h-6 text-accent-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search entities in the knowledge graph..."
            className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => fetchGraphData()}
          className="p-3 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Entity Type Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedType === null
              ? 'bg-primary-500 text-white'
              : 'bg-surface border border-border text-text-secondary hover:border-primary-500/30'
          }`}
        >
          All Types
        </button>
        {(stats?.types || []).map(type => {
          const config = typeConfig[type] || defaultTypeConfig;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                selectedType === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface border border-border text-text-secondary hover:border-primary-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: config.color }} />
              {type}
            </button>
          );
        })}
      </div>

      {/* Entity Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : entities.length === 0 ? (
        <div className="p-12 rounded-2xl border border-border bg-surface text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <Network className="w-8 h-8 text-primary-400" />
          </div>
          <p className="text-text-secondary text-lg mb-2">No entities found</p>
          <p className="text-text-muted text-sm">Entities will appear as you capture more memories</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((entity, i) => {
            const config = typeConfig[entity.type] || defaultTypeConfig;
            const IconComponent = config.icon;
            return (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-2xl border border-border bg-surface hover:border-primary-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <span className="text-xs text-text-muted uppercase">{entity.type}</span>
                </div>
                <h3 className="text-text-primary font-semibold mb-1 group-hover:text-primary transition-colors">
                  {entity.value}
                </h3>
                {entity.metadata && Object.keys(entity.metadata).length > 0 && (
                  <p className="text-xs text-text-muted">
                    {Object.keys(entity.metadata).length} metadata fields
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}