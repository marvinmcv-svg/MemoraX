import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus } from '@expo/vector-icons';
import { api, type Memory } from '../../lib/api';
import { MemoryList } from '../../components/ui/MemoryCard';
import { Button } from '../../components/ui/Button';

export default function MemoriesScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMemories = useCallback(async () => {
    try {
      const response = await api.memories.list();
      setMemories(response.data || []);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMemories();
  }, [fetchMemories]);

  const filteredMemories = memories.filter((memory) => {
    if (!searchQuery.trim()) return true;
    return memory.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleFilterPress = () => {
    console.log('Filter pressed');
  };

  const handleAddMemory = () => {
    console.log('Add memory pressed');
  };

  return (
    <View className="flex-1 bg-background-base">
      {/* Header */}
      <View className="px-4 pt-14 pb-4">
        <Text className="text-3xl font-bold text-text-primary tracking-tight">Memories</Text>
        <Text className="text-text-secondary mt-1">All your captured memories</Text>
      </View>

      {/* Search& Filter */}
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
            <MemoryList
              memories={[item]}
              onMemoryPress={(memory) => console.log('Memory pressed:', memory.id)}
              onRemind={(memory) => console.log('Remind:', memory.id)}
              onArchive={(memory) => console.log('Archive:', memory.id)}
              onDelete={(memory) => console.log('Delete:', memory.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View className="space-y-3">
              {[1, 2, 3].map((i) => (
                <View key={i} className="bg-surface rounded-2xl p-4 border border-border h-32" />
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
              <Button size="sm" leftIcon={<Plus size={16} color="#fff" />} onPress={handleAddMemory}>
                Add memory
              </Button>
            </View>
          )
        }
      />
    </View>
  );
}
