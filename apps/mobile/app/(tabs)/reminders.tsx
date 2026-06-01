import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, Bell, BellOff, Trash2 } from '@expo/vector-icons';
import { api, type Reminder } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { color: '#F59E0B', bgColor: 'bg-accent-500/20', icon: Bell },
  sent: { color: '#10B981', bgColor: 'bg-secondary-500/20', icon: CheckCircle },
  snoozed: { color: '#8B5CF6', bgColor: 'bg-purple-500/20', icon: Clock },
  cancelled: { color: '#64748B', bgColor: 'bg-surface', icon: BellOff },
};

function formatRemindTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff < 0) return 'Overdue';
  if (hours < 1) return 'In less than an hour';
  if (hours < 24) return `In ${hours} hour${hours !== 1 ? 's' : ''}`;
  if (days < 7) return `In ${days} day${days !== 1 ? 's' : ''}`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const snoozeOptions = [
  { label: '15 minutes', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '1 day', minutes: 60 * 24 },
];

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [snoozingId, setSnoozingId] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      const response = await api.reminders.list();
      setReminders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      Alert.alert('Error', 'Failed to load reminders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReminders();
  }, [fetchReminders]);

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = reminders.filter((r) => r.status === 'pending').length;

  const handleSnooze = useCallback((reminderId: string) => {
    Alert.alert(
      'Snooze Reminder',
      'Snooze for how long?',
      [
        ...snoozeOptions.map((opt) => ({
          text: opt.label,
          onPress: async () => {
            setSnoozingId(reminderId);
            try {
              await api.reminders.snooze(reminderId, opt.minutes);
              await fetchReminders();
            } catch (error) {
              console.error('Failed to snooze reminder:', error);
              Alert.alert('Error', 'Failed to snooze reminder. Please try again.');
            } finally {
              setSnoozingId(null);
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [fetchReminders]);

  const handleDelete = useCallback(async (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.reminders.delete(reminderId);
              await fetchReminders();
            } catch (error) {
              console.error('Failed to delete reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder. Please try again.');
            }
          },
        },
      ]
    );
  }, [fetchReminders]);

  return (
    <View className="flex-1 bg-background-base">
      {/* Header */}
      <View className="px-4 pt-14 pb-4">
        <Text className="text-3xl font-bold text-text-primary tracking-tight">Reminders</Text>
        <Text className="text-text-secondary mt-1">
          {pendingCount > 0 ? `${pendingCount} upcoming` : 'All caught up!'}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="px-4 mb-4">
        <View className="flex-row gap-2 bg-surface rounded-2xl p-1.5 border border-border">
          {(['all', 'pending', 'sent'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
              className={`flex-1 px-4 py-2.5 rounded-xl ${
                filter === f ? 'bg-primary-500' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm font-medium text-center ${
                  filter === f ? 'text-white' : 'text-text-secondary'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reminders List */}
      <FlatList
        data={filteredReminders}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-24"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
        renderItem={({ item }) => {
          const config = statusConfig[item.status] || statusConfig.pending;
          const StatusIcon = config.icon;
          const isSnoozing = snoozingId === item.id;

          return (
            <Card variant="interactive" className="mb-3">
              <View className="p-4">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View className={`w-8 h-8 rounded-lg ${config.bgColor} items-center justify-center`}>
                      <StatusIcon size={16} color={config.color} />
                    </View>
                    <View>
                      <Text className="text-sm font-medium" style={{ color: config.color }}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                      <Text className="text-xs text-text-muted">{formatRemindTime(item.remindAt)}</Text>
                    </View>
                  </View>
                  {item.status === 'pending' && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleSnooze(item.id)}
                        disabled={isSnoozing}
                        activeOpacity={0.7}
                        className="p-2 rounded-lg bg-surface-hover"
                      >
                        <Clock size={16} color="#94A3B8" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        activeOpacity={0.7}
                        className="p-2 rounded-lg bg-surface-hover"
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <Text className="text-text-primary text-sm leading-relaxed mb-2">
                  Memory: {item.memoryId.slice(0, 8)}...
                </Text>

                <View className="flex-row items-center justify-between pt-2 border-t border-border/50">
                  <View className="flex-row items-center gap-1">
                    <Bell size={12} color="#64748B" />
                    <Text className="text-xs text-text-muted">
                      {item.deliveryChannel || 'app'} • {formatFullDate(item.remindAt)}
                    </Text>
                  </View>
                  {item.rrule && (
                    <View className="px-2 py-0.5 rounded-full bg-surface">
                      <Text className="text-xs text-text-muted">Recurring</Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  className="bg-surface rounded-2xl border border-border mb-3"
                  style={{ height: 128 }}
                />
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-8 items-center border border-border">
              <View className="w-16 h-16 rounded-2xl bg-accent-500/10 items-center justify-center mb-4">
                <Bell size={32} color="#F59E0B" />
              </View>
              <Text className="text-text-secondary text-lg mb-2">
                {filter === 'pending' ? 'No pending reminders' : filter === 'sent' ? 'No sent reminders' : 'No reminders yet'}
              </Text>
              <Text className="text-text-muted text-sm text-center">
                Reminders you set will appear here
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
