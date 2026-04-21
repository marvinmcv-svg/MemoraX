import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, Snooze } from '@expo/vector-icons';
import { api, type Reminder } from '../../lib/api';

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  sent: '#10B981',
  snoozed: '#8B5CF6',
};

function formatRemindTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff < 0) return 'Overdue';
  if (hours < 1) return 'Soon';
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');

  const fetchReminders = useCallback(async () => {
    try {
      const response = await api.reminders.list();
      setReminders(response.data);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReminders();
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-text-primary">Reminders</Text>
        <Text className="text-text-secondary mt-1">Your upcoming and past reminders</Text>
      </View>

      <View className="px-4 mb-4">
        <View className="flex-row gap-2">
          {(['all', 'pending', 'sent'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-4 py-2 rounded-full ${
                filter === f ? 'bg-primary' : 'bg-surface border border-border'
              }`}
            >
              <Text className={`text-sm font-medium ${filter === f ? 'text-white' : 'text-text-secondary'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredReminders}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
        renderItem={({ item }) => (
          <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Clock size={16} color={statusColors[item.status] || '#F59E0B'} />
                  <Text className="text-text-muted text-sm">{formatRemindTime(item.remindAt)}</Text>
                  {item.status === 'sent' && <CheckCircle size={14} color="#10B981" />}
                </View>
                <Text className="text-text-primary">Reminder</Text>
                <Text className="text-text-muted text-xs mt-1">{item.deliveryChannel || 'app'}</Text>
              </View>
              {item.status === 'pending' && (
                <TouchableOpacity className="p-2">
                  <Snooze size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-text-secondary text-sm">Loading reminders...</Text>
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-text-secondary text-sm">No reminders yet.</Text>
            </View>
          )
        }
      />
    </View>
  );
}