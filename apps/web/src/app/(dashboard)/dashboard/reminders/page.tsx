'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, Coffee, Trash2, Bell, Plus, X, ChevronRight, AlarmClock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type Reminder } from '@/lib/api';

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  sent: '#10B981',
  snoozed: '#8B5CF6',
  cancelled: '#64748B',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  sent: 'Sent',
  snoozed: 'Snoozed',
  cancelled: 'Cancelled',
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const pendingCount = reminders.filter(r => r.status === 'pending').length;
  const upcomingReminders = filteredReminders.filter(r => r.status === 'pending').slice(0, 3);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Reminders</h1>
          <p className="text-text-secondary mt-1">
            {pendingCount > 0 ? `${pendingCount} reminders pending` : 'All caught up!'}
          </p>
        </div>
        <motion.button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-glow transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          <span>New Reminder</span>
        </motion.button>
      </div>

      {upcomingReminders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
            <AlarmClock className="w-4 h-4" />
            Coming up next
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingReminders.map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-surface rounded-2xl border border-border bg-gradient-to-br from-accent/5 to-transparent"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">{formatRemindTime(reminder.remindAt)}</span>
                </div>
                <p className="text-text-primary font-medium">Reminder #{reminder.id.slice(0, 8)}</p>
                <p className="text-xs text-text-muted mt-1">
                  Via {reminder.deliveryChannel || 'app'}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        {(['all', 'pending', 'sent'] as const).map((f, i) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-accent text-white text-xs rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredReminders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-surface rounded-2xl border border-border"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Bell className="w-8 h-8 text-accent" />
          </div>
          <p className="text-text-primary text-lg font-medium mb-1">No reminders</p>
          <p className="text-text-secondary">Your future self will thank you!</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredReminders.map(reminder => (
              <motion.div
                key={reminder.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group p-5 bg-surface rounded-2xl border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${statusColors[reminder.status] || '#64748B'}20` }}
                    >
                      {reminder.status === 'sent' ? (
                        <CheckCircle className="w-6 h-6 text-secondary" />
                      ) : reminder.status === 'snoozed' ? (
                        <Coffee className="w-6 h-6 text-purple-400" />
                      ) : (
                        <Clock className="w-6 h-6 text-accent" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${statusColors[reminder.status] || '#64748B'}20`,
                            color: statusColors[reminder.status] || '#64748B',
                          }}
                        >
                          {statusLabels[reminder.status] || reminder.status}
                        </span>
                        <span className="text-sm text-text-muted">{formatRemindTime(reminder.remindAt)}</span>
                      </div>
                      <p className="text-text-primary font-medium">Reminder #{reminder.id.slice(0, 8)}</p>
                      <p className="text-text-muted text-sm mt-1">
                        Via {reminder.deliveryChannel || 'app'} • Created {new Date(reminder.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {reminder.status === 'pending' && (
                      <button
                        onClick={() => snoozeReminder(reminder.id)}
                        className="p-2 text-text-muted hover:text-purple-400 hover:bg-background rounded-xl transition-colors"
                        title="Snooze 1 hour"
                      >
                        <Coffee className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="p-2 text-text-muted hover:text-red-500 hover:bg-background rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface border border-border rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-text-primary">Create Reminder</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-background rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-text-secondary text-center py-8">
                  Reminder creation will be available once the backend is connected.
                </p>
              </div>

              <div className="p-4 border-t border-border flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-background text-text-primary rounded-xl font-medium hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors"
                >
                  Create Reminder
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}