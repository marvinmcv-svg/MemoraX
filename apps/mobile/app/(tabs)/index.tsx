import { View, Text, TextInput, TouchableOpacity, ScrollView, RefreshControl, Alert, Animated } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, Image, Send, Sparkles, Brain, TrendingUp } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api, type Memory } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MemoryList } from '../../components/ui/MemoryCard';

export default function HomeScreen() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [quickCapture, setQuickCapture] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fetchMemories = useCallback(async () => {
    try {
      const response = await api.memories.list();
      setMemories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch memories';
      Alert.alert('Error', message);
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

  const thisWeekCount = memories.filter((m) => {
    const created = new Date(m.createdAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return created >= weekAgo;
  }).length;

  const handleSubmitMemory = useCallback(async () => {
    if (!quickCapture.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.memories.create({ content: quickCapture.trim() });
      setQuickCapture('');
      await fetchMemories();
    } catch (error) {
      console.error('Failed to create memory:', error);
      const message = error instanceof Error ? error.message : 'Failed to create memory';
      Alert.alert('Capture Failed', message);
    } finally {
      setSubmitting(false);
    }
  }, [quickCapture, submitting, fetchMemories]);

  const handleAddFirstMemory = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleImageUpload = useCallback(() => {
    Alert.alert('Coming Soon', 'Image upload is coming in a future update.');
  }, []);

  const stats = [
    { label: 'Total Memories', value: String(memories.length), icon: Brain, color: '#6366F1' },
    { label: 'This Week', value: String(thisWeekCount), icon: TrendingUp, color: '#10B981' },
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
        <Animated.View style={{ opacity: fadeAnim }} className="flex-row gap-3 mb-6">
          {stats.map((stat) => (
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
        </Animated.View>

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
          <Button variant="secondary" fullWidth onPress={() => router.push('/(tabs)/reminders' as any)}>
            View upcoming reminders
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
              ref={inputRef}
              value={quickCapture}
              onChangeText={setQuickCapture}
              placeholder="What's on your mind? Try: 'Remind me to call mom tomorrow at 3pm'"
              placeholderTextColor="#64748B"
              multiline
              editable={!submitting}
              className="bg-background rounded-xl p-4 text-text-primary text-sm leading-relaxed"
              style={{ minHeight: 96 }}
            />
          </View>

          <View className="flex-row items-center justify-between mt-4">
            <View className="flex-row gap-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsRecording(!isRecording)}
                className={`p-3 rounded-xl ${isRecording ? 'bg-destructive-500' : 'bg-surface-hover'}`}
              >
                <Mic size={20} color={isRecording ? '#fff' : '#94A3B8'} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleImageUpload}
                className="p-3 rounded-xl bg-surface-hover"
              >
                <Image size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Button
              onPress={handleSubmitMemory}
              disabled={!quickCapture.trim() || submitting}
              loading={submitting}
              leftIcon={<Send size={18} color="#fff" />}
            >
              Capture
            </Button>
          </View>
        </Card>

        {/* Recent Memories */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-text-primary">Recent Memories</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/memories' as any)}>
            <Text className="text-sm text-primary-400 font-medium">View all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="bg-surface rounded-2xl p-4 border border-border mb-3"
                style={{ height: 128 }}
              />
            ))}
          </View>
        ) : memories.length === 0 ? (
          <Card variant="default" className="p-8 items-center">
            <View className="w-16 h-16 rounded-2xl bg-primary-500/10 items-center justify-center mb-4">
              <Brain size={32} color="#6366F1" />
            </View>
            <Text className="text-text-secondary text-lg mb-2">Your memory palace is empty</Text>
            <Text className="text-text-muted text-center mb-4">Capture your first thought using Quick Capture above!</Text>
            <Button size="sm" onPress={handleAddFirstMemory}>
              Start typing
            </Button>
          </Card>
        ) : (
          <MemoryList
            memories={memories.slice(0, 5)}
            onMemoryPress={(memory) => router.push({ pathname: '/(tabs)/memories' as any })}
            onRemind={(memory) => Alert.alert('Set Reminder', `Set reminder for: ${memory.content.slice(0, 40)}...`)}
            onArchive={(memory) => Alert.alert('Archive', `Archive: ${memory.content.slice(0, 40)}...`)}
            onDelete={(memory) => {
              Alert.alert('Delete Memory', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.memories.delete(memory.id);
                      await fetchMemories();
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete memory');
                    }
                  },
                },
              ]);
            }}
          />
        )}

        {/* Bottom padding for tab bar */}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}