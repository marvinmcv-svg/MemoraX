import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter } from '@expo/vector-icons';
import { api, type Memory } from '../../lib/api';

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

export default function MemoriesScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMemories = useCallback(async () => {
    try {
      const response = await api.memories.list();
      setMemories(response.data);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMemories();
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-text-primary">Memories</Text>
        <Text className="text-text-secondary mt-1">All your captured memories</Text>
      </View>

      <View className="px-4 mb-4">
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-surface rounded-xl px-3 border border-border">
            <Search size={20} color="#64748B" />
            <TouchableOpacity className="flex-1">
              <Text className="text-text-muted ml-2 py-3">Search memories...</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="p-3 bg-surface rounded-xl border border-border">
            <Filter size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-surface rounded-xl p-4 mb-3 border border-border">
            <View className="flex-row items-center gap-2 mb-2">
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: `${intents[item.intent as keyof typeof intents]?.color || '#64748B'}20` }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: intents[item.intent as keyof typeof intents]?.color || '#64748B' }}
                >
                  {intents[item.intent as keyof typeof intents]?.label || 'Memory'}
                </Text>
              </View>
              <Text className="text-text-muted text-xs">{item.sourceChannel || 'app'}</Text>
              <View className="flex-1" />
              <Text className="text-text-muted text-xs">{formatRelativeTime(item.createdAt)}</Text>
            </View>
            <Text className="text-text-primary text-sm leading-relaxed">{item.content}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-text-secondary text-sm">Loading memories...</Text>
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-text-secondary text-sm">No memories yet. Start capturing!</Text>
            </View>
          )
        }
      />
    </View>
  );
}