import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Mic, Image, Send, Sparkles } from '@expo/vector-icons';
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

export default function HomeScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [quickCapture, setQuickCapture] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMemories = useCallback(async () => {
    try {
      const response = await api.memories.list();
      setMemories(response.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleSubmitMemory = async () => {
    if (!quickCapture.trim()) return;

    try {
      await api.memories.create({ content: quickCapture });
      setQuickCapture('');
      fetchMemories();
    } catch (error) {
      console.error('Failed to create memory:', error);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-text-primary">Welcome back</Text>
        <Text className="text-text-secondary mt-1">Here's your memory overview</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Sparkles size={20} color="#6366F1" />
            </View>
            <View>
              <Text className="text-text-primary font-semibold">Daily Briefing</Text>
              <Text className="text-text-muted text-sm">AI-generated for you</Text>
            </View>
          </View>
          <Text className="text-text-secondary text-sm leading-relaxed">
            You have {memories.length} memories captured. Connect AI services for personalized daily briefings.
          </Text>
        </View>

        <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
          <Text className="text-text-primary font-semibold mb-3">Quick Capture</Text>
          <View className="relative">
            <TextInput
              value={quickCapture}
              onChangeText={setQuickCapture}
              placeholder="What's on your mind?"
              placeholderTextColor="#64748B"
              multiline
              className="bg-background rounded-xl p-3 text-text-primary min-h-20 text-sm"
            />
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                onPress={() => setIsRecording(!isRecording)}
                className={`p-3 rounded-xl ${isRecording ? 'bg-red-500' : 'bg-surface-hover'}`}
              >
                <Mic size={20} color={isRecording ? '#fff' : '#94A3B8'} />
              </TouchableOpacity>
              <TouchableOpacity className="p-3 rounded-xl bg-surface-hover">
                <Image size={20} color="#94A3B8" />
              </TouchableOpacity>
              <View className="flex-1" />
              <TouchableOpacity
                onPress={handleSubmitMemory}
                className="p-3 rounded-xl bg-primary"
              >
                <Send size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text className="text-lg font-semibold text-text-primary mb-3">Recent Memories</Text>
        <View className="space-y-3 mb-6">
          {loading ? (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-text-secondary text-sm">Loading...</Text>
            </View>
          ) : memories.length === 0 ? (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-text-secondary text-sm">No memories yet. Capture your first thought above!</Text>
            </View>
          ) : (
            memories.map((memory) => (
              <View key={memory.id} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row items-center gap-2 mb-2">
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${intents[memory.intent as keyof typeof intents]?.color || '#64748B'}20` }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: intents[memory.intent as keyof typeof intents]?.color || '#64748B' }}
                    >
                      {intents[memory.intent as keyof typeof intents]?.label || 'Memory'}
                    </Text>
                  </View>
                  <Text className="text-text-muted text-xs">{memory.sourceChannel || 'app'}</Text>
                  <View className="flex-1" />
                  <Text className="text-text-muted text-xs">{formatRelativeTime(memory.createdAt)}</Text>
                </View>
                <Text className="text-text-primary text-sm leading-relaxed">{memory.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}