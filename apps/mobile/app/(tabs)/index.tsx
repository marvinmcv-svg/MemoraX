import { View, Text, TextInput, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Mic, Image, Send, Sparkles, Brain, TrendingUp, Clock } from '@expo/vector-icons';
import { api, type Memory } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MemoryList } from '../../components/ui/MemoryCard';

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
  const [refreshing, setRefreshing] = useState(false);

  const fetchMemories = useCallback(async () => {
    try {
      const response = await api.memories.list();
      setMemories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMemories();
    setRefreshing(false);
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

  const handleViewBriefing = () => {
    console.log('View full briefing pressed');
  };

  const handleAddFirstMemory = () => {
    setQuickCapture('');
  };

  const handleImageUpload = () => {
    console.log('Image upload pressed');
  };

  const stats = [
    { label: 'Total Memories', value: String(memories.length), icon: Brain, color: '#6366F1' },
    { label: 'This Week', value: String(memories.length), icon: TrendingUp, color: '#10B981' },
    { label: 'Quick Capture', value: 'Active', icon: Sparkles, color: '#F59E0B' },
  ];

  return (
    <View className="flex-1 bg-background-base">
      {/* Header */}
      <View className="px-4 pt-14 pb-4">
        <Text className="text-3xl font-bold text-text-primary tracking-tight">
          Welcome back
          <Text className="text-primary-400">.</Text>
        </Text>
        <Text className="text-text-secondary mt-1">Here's your memory overview</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
          />
        }
      >
        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-6">
          {stats.map((stat, i) => (
            <View
              key={stat.label}
              className="flex-1 bg-surface border border-border rounded-2xl p-4"
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon size={20} color={stat.color} />
              </View>
              <Text className="text-2xl font-bold text-text-primary">{stat.value}</Text>
              <Text className="text-xs text-text-muted mt-1">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Daily Briefing Card */}
        <Card variant="elevated" className="mb-6">
          <CardHeader
            title="Daily Briefing"
            description="AI-generated for you"
            icon={<Sparkles size={20} color="#10B981" />}
          />
          <View className="bg-background rounded-xl p-4 border border-border mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Brain size={14} color="#6366F1" />
              <Text className="text-sm text-text-secondary">Recent activity</Text>
            </View>
            {memories.length > 0 ? (
              <Text className="text-text-primary text-sm" numberOfLines={2}>
                "{memories[0].content.slice(0, 80)}..."
              </Text>
            ) : (
              <Text className="text-text-muted text-sm">No memories yet</Text>
            )}
          </View>
          <Button variant="secondary" fullWidth onPress={handleViewBriefing}>
            View full briefing
          </Button>
        </Card>

        {/* Quick Capture */}
        <Card variant="elevated" className="mb-6">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-11 h-11 rounded-xl bg-primary-500/10 items-center justify-center">
              <Sparkles size={20} color="#6366F1" />
            </View>
            <View>
              <Text className="font-semibold text-text-primary">Quick Capture</Text>
              <Text className="text-sm text-text-muted">Add a memory instantly</Text>
            </View>
          </View>

          <View className="relative">
            <TextInput
              value={quickCapture}
              onChangeText={setQuickCapture}
              placeholder="What's on your mind? Try: 'Remind me to call mom tomorrow at 3pm'"
              placeholderTextColor="#64748B"
              multiline
              className="bg-background rounded-xl p-4 text-text-primary min-h-24 text-sm leading-relaxed"
            />
          </View>

          <View className="flex-row items-center justify-between mt-4">
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setIsRecording(!isRecording)}
                className={`p-3 rounded-xl ${isRecording ? 'bg-destructive-500' : 'bg-surface-hover'}`}
              >
                <Mic size={20} color={isRecording ? '#fff' : '#94A3B8'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleImageUpload} className="p-3 rounded-xl bg-surface-hover">
                <Image size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Button onPress={handleSubmitMemory} disabled={!quickCapture.trim()}>
              <Send size={18} color="#fff" />
              <Text className="text-white font-medium ml-2">Capture</Text>
            </Button>
          </View>
        </Card>

        {/* Recent Memories */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-text-primary">Recent Memories</Text>
          <TouchableOpacity onPress={() => console.log('View all pressed')}>
            <Text className="text-sm text-primary-400 font-medium">View all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="space-y-3">
            {[1, 2, 3].map((i) => (
              <View key={i} className="bg-surface rounded-2xl p-4 border border-border h-32" />
            ))}
          </View>
        ) : memories.length === 0 ? (
          <Card variant="default" className="p-8 items-center">
            <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
              <Brain size={32} color="#6366F1" />
            </View>
            <Text className="text-text-secondary text-lg mb-2">Your memory palace is empty</Text>
            <Text className="text-text-muted text-center mb-4">Capture your first thought using Quick Capture above!</Text>
            <Button size="sm" onPress={handleAddFirstMemory}>Add your first memory</Button>
          </Card>
        ) : (
          <MemoryList
            memories={memories}
            onMemoryPress={(memory) => console.log('Memory pressed:', memory.id)}
            onRemind={(memory) => console.log('Remind:', memory.id)}
            onArchive={(memory) => console.log('Archive:', memory.id)}
            onDelete={(memory) => console.log('Delete:', memory.id)}
          />
        )}

        {/* Bottom padding for tab bar */}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
