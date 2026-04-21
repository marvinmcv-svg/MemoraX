'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, Coffee, Trash2 } from 'lucide-react';
import { api, type Reminder } from '../../../../lib/api';

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  sent: '#10B981',
  snoozed: '#8B5CF6',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  sent: 'Sent',
  snoozed: 'Snoozed',
};

function formatRemindTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff < 0) return 'Overdue';
  if (hours < 1) return 'Soon';
  if (hours < 24) return `in ${hours}h`;
  if (days < 7) return `in ${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');

  const fetchReminders = useCallback(async () => {
    try {
      const response = await api.reminders.list();
      setReminders(response.data);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const snoozeReminder = async (id: string) => {
    try {
      await api.reminders.snooze(id, 60);
      fetchReminders();
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await api.reminders.delete(id);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reminders</h1>
          <p className="text-text-secondary mt-1">Your upcoming and past reminders</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {(['all', 'pending', 'sent'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <Clock className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">No reminders found</p>
          <p className="text-text-muted text-sm mt-1">Your future self will thank you!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map(reminder => (
            <div key={reminder.id} className="p-4 bg-surface rounded-xl border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} color={statusColors[reminder.status] || '#F59E0B'} />
                    <span className={`text-sm font-medium ${reminder.status === 'pending' ? 'text-accent' : 'text-secondary'}`}>
                      {formatRemindTime(reminder.remindAt)}
                    </span>
                    {reminder.status === 'sent' && <CheckCircle size={14} color="#10B981" />}
                    {reminder.status === 'snoozed' && <Coffee size={14} color="#8B5CF6" />}
                  </div>
                  <p className="text-text-primary">Reminder</p>
                  <p className="text-text-muted text-xs mt-1">
                    Channel: {reminder.deliveryChannel || 'app'} • Created {new Date(reminder.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {reminder.status === 'pending' && (
                    <button
                      onClick={() => snoozeReminder(reminder.id)}
                      className="p-2 text-text-muted hover:text-accent transition-colors"
                      title="Snooze 1 hour"
                    >
                      <Coffee className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="p-2 text-text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}