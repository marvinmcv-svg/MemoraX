import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, Animated, Keyboard } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, SlidersHorizontal, Brain, Sparkles } from '@expo/vector-icons';
import { api, type Memory } from '../../lib/api';
import { MemoryList } from '../../components/ui/MemoryCard';

type Intent = 'reminder' | 'note' | 'task' | 'event' | 'serendipity' | 'question' | 'unknown';

const intentFilters: { value: Intent | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'reminder', label: 'Reminders' },
  { value: 'note', label: 'Notes' },
  { value: 'task', label: 'Tasks' },
  { value: 'event', label: 'Events' },
  { value: 'question', label: 'Questions' },
];

const channelFilters = [
  { value: 'all', label: 'All' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'slack', label: 'Slack' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'app', label: 'App' },
];

const recentSuggestions = [
  'What did I discuss about the project?',
  'Meetings this week',
  'Reminders for tomorrow',
  'Notes about the team',
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<Intent | 'all'>('all');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);
    try {
      const response = await api.memories.search(query);
      setResults(response.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      const message = error instanceof Error ? error.message : 'Search failed. Please try again.';
      Alert.alert('Search Error', message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setSelectedIntent('all');
    setSelectedChannel('all');
    inputRef.current?.focus();
  };

  const useSuggestion = (suggestion: string) => {
    setQuery(suggestion);
  };

  const filteredResults = results.filter((memory) => {
    if (selectedIntent !== 'all' && memory.intent !== selectedIntent) return false;
    if (selectedChannel !== 'all' && memory.sourceChannel !== selectedChannel) return false;
    return true;
  });

  const hasActiveFilters = selectedIntent !== 'all' || selectedChannel !== 'all';

  return (
    <View className="flex-1 bg-background-base">
      {/* Header */}
      <View className="px-4 pt-14 pb-4">
        <Text className="text-3xl font-bold text-text-primary tracking-tight">Search</Text>
        <Text className="text-text-secondary mt-1">Find anything with natural language</Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center bg-surface border border-border rounded-2xl px-4">
          <Search size={20} color="#64748B" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onKeyPress={handleKeyPress}
            onSubmitEditing={handleSearch}
            placeholder="What did I discuss about..."
            placeholderTextColor="#64748B"
            returnKeyType="search"
            autoCorrect={false}
            className="flex-1 ml-3 py-4 text-text-primary text-base"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} activeOpacity={0.7} className="p-1">
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Toggle & Result Count */}
        <View className="flex-row items-center justify-between mt-3">
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.7}
            className={`flex-row items-center gap-2 px-3 py-2 rounded-xl border ${
              showFilters || hasActiveFilters
                ? 'border-primary-500/30 bg-primary-500/10'
                : 'border-border bg-surface'
            }`}
          >
            <SlidersHorizontal size={14} color={showFilters || hasActiveFilters ? '#6366F1' : '#94A3B8'} />
            <Text
              className={`text-sm font-medium ${
                showFilters || hasActiveFilters ? 'text-primary-400' : 'text-text-secondary'
              }`}
            >
              Filters
            </Text>
          </TouchableOpacity>

          {searched && !loading && (
            <Text className="text-sm text-text-muted">
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <Animated.View
            style={{ opacity: fadeAnim }}
            className="mt-3 p-4 bg-surface rounded-2xl border border-border"
          >
            <Text className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
              Intent
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {intentFilters.map((filter) => {
                const isActive = selectedIntent === filter.value;
                return (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() => setSelectedIntent(filter.value)}
                    activeOpacity={0.7}
                    className={`px-3 py-1.5 rounded-full border ${
                      isActive ? 'border-primary-500/30 bg-primary-500/10' : 'border-border bg-background'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        isActive ? 'text-primary-400' : 'text-text-secondary'
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
              Channel
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {channelFilters.map((filter) => {
                const isActive = selectedChannel === filter.value;
                return (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() => setSelectedChannel(filter.value)}
                    activeOpacity={0.7}
                    className={`px-3 py-1.5 rounded-full border ${
                      isActive ? 'border-primary-500/30 bg-primary-500/10' : 'border-border bg-background'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        isActive ? 'text-primary-400' : 'text-text-secondary'
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}
      </View>

      {/* Results */}
      <FlatList
        data={filteredResults}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-24"
        keyboardShouldPersistTaps="handled"
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
            <View>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  className="bg-surface rounded-2xl p-4 border border-border h-32 mb-3"
                />
              ))}
            </View>
          ) : searched ? (
            <View className="bg-surface rounded-2xl p-8 items-center border border-border">
              <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
                <Search size={32} color="#6366F1" />
              </View>
              <Text className="text-text-secondary text-lg mb-2">No memories found</Text>
              <Text className="text-text-muted text-sm text-center mb-4">
                Try adjusting your search or filters
              </Text>
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Suggestions */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <Sparkles size={14} color="#6366F1" />
                  <Text className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    Try asking
                  </Text>
                </View>
                <View className="gap-2">
                  {recentSuggestions.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      onPress={() => useSuggestion(suggestion)}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-3 p-3 bg-surface rounded-xl border border-border"
                    >
                      <Brain size={16} color="#6366F1" />
                      <Text className="flex-1 text-text-primary text-sm">{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tips */}
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                  Search tips
                </Text>
                <View className="gap-1.5">
                  <Text className="text-text-secondary text-sm leading-relaxed">
                    • Use natural language - ask questions like you would a person
                  </Text>
                  <Text className="text-text-secondary text-sm leading-relaxed">
                    • Be specific - "meeting with John about Q4" works better than "meeting"
                  </Text>
                  <Text className="text-text-secondary text-sm leading-relaxed">
                    • Use filters to narrow down by type or channel
                  </Text>
                </View>
              </View>
            </Animated.View>
          )
        }
      />
    </View>
  );
}
