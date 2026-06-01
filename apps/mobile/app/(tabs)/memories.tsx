import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api, type Memory } from '../../lib/api';
import { MemoryCard } from '../../components/ui/MemoryCard';
import { Button } from '../../components/ui/Button';

export default function MemoriesScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    try {
      const response = await api.memories.list();
      setMemories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      Alert.alert('Error', 'Failed to load memories. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMemories();
  }, [fetchMemories]);

  const filteredMemories = memories.filter((memory) => {
    if (!searchQuery.trim()) return true;
    return memory.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDelete = useCallback(async (memory: Memory) => {
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(memory.id);
            try {
              await api.memories.delete(memory.id);
              await fetchMemories();
            } catch (error) {
              console.error('Failed to delete memory:', error);
              Alert.alert('Error', 'Failed to delete memory. Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }, [fetchMemories]);

  const handleRemind = useCallback((memory: Memory) => {
    Alert.prompt?.(
      'Set Reminder',
      `When should we remind you about: "${memory.content.slice(0, 40)}..."?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Set', onPress: () => Alert.alert('Reminder Set', 'We will remind you soon!') },
      ],
      'plain-text',
      'tomorrow at 3pm'
    );
  }, []);

  const handleArchive = useCallback((memory: Memory) => {
    Alert.alert('Archive', 'Archive functionality coming soon');
  }, []);

  const handleFilterPress = useCallback(() => {
    Alert.alert('Filters', 'Filter options coming soon');
  }, []);

  return (
    <View className="flex-1 bg-background-base">
      {/* Header */}
      <View className="px-4 pt-14 pb-4">
        <Text className="text-3xl font-bold text-text-primary tracking-tight">Memories</Text>
        <Text className="text-text-secondary mt-1">
          {memories.length > 0 ? `${memories.length} total` : 'All your captured memories'}
        </Text>
      </View>

      {/* Search & Filter */}
      <View className="px-4 mb-4">
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-surface rounded-xl px-3 border border-border">
            <Search size={18} color="#64748B" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search memories..."
              placeholderTextColor="#64748B"
              className="flex-1 ml-2 py-3 text-text-primary text-sm"
            />
          </View>
          <TouchableOpacity onPress={handleFilterPress} className="p-3 bg-surface rounded-xl border border-border">
            <Filter size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Memories List */}
      <FlatList
        data={filteredMemories}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-24"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
        renderItem={({ item }) => (
          <View className="mb-3">
            <MemoryCard
              memory={item}
              onPress={() => Alert.alert('Memory', item.content)}
              onRemind={() => handleRemind(item)}
              onArchive={() => handleArchive(item)}
              onDelete={() => handleDelete(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  className="bg-surface rounded-2xl p-4 border border-border mb-3"
                  style={{ height: 128 }}
                />
              ))}
            </View>
          ) : searchQuery ? (
            <View className="bg-surface rounded-2xl p-8 items-center">
              <Text className="text-text-secondary text-lg mb-2">No results found</Text>
              <Text className="text-text-muted text-sm">Try a different search term</Text>
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-8 items-center">
              <Text className="text-text-secondary text-lg mb-2">No memories yet</Text>
              <Text className="text-text-muted text-sm mb-4">Start capturing your thoughts!</Text>
              <Button size="sm" leftIcon={<Plus size={16} color="#fff" />} onPress={() => router.push('/(tabs)' as any)}>
                Capture your first
              </Button>
            </View>
          )
        }
      />
    </View>
  );
}
