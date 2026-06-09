'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Clock, CheckCircle2, AlertCircle, Circle, X, Edit2, Trash2 } from 'lucide-react';
import { api, type Homework, type HomeworkStatus } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const STATUS_CONFIG: Record<HomeworkStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-400 bg-amber-400/10', icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-blue-400 bg-blue-400/10', icon: Clock },
  completed: { label: 'Completed', color: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle2 },
  overdue: { label: 'Overdue', color: 'text-red-400 bg-red-400/10', icon: AlertCircle },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-slate-400' },
  medium: { label: 'Medium', color: 'text-amber-400' },
  high: { label: 'High', color: 'text-red-400' },
};

function formatDueDate(dateStr: string | null): { text: string; isOverdue: boolean } {
  if (!dateStr) return { text: 'No due date', isOverdue: false };
  const date = new Date(dateStr);
  const now = new Date();
  const isOverdue = date < now;
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let text: string;
  if (diffDays === 0) text = 'Due today';
  else if (diffDays === 1) text = 'Due tomorrow';
  else if (diffDays === -1) text = 'Due yesterday';
  else if (diffDays < -1) text = `Overdue by ${Math.abs(diffDays)} days`;
  else if (diffDays <= 7) text = `Due in ${diffDays} days`;
  else text = `Due ${date.toLocaleDateString()}`;

  return { text, isOverdue };
}

export default function HomeworkPage() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHw, setEditingHw] = useState<Homework | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    dueAt: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const { addToast } = useToast();

  const fetchHomework = useCallback(async () => {
    try {
      const response = await api.homework.list();
      setHomework(response.data);
    } catch (error) {
      console.error('Failed to fetch homework:', error);
      addToast('error', 'Failed to load homework.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  const stats = {
    total: homework.length,
    pending: homework.filter(h => h.status === 'pending').length,
    inProgress: homework.filter(h => h.status === 'in_progress').length,
    completed: homework.filter(h => h.status === 'completed').length,
    overdue: homework.filter(h => h.status === 'overdue').length,
  };

  const handleStatusChange = async (hw: Homework, newStatus: HomeworkStatus) => {
    try {
      const updated = await api.homework.updateStatus(hw.id, newStatus);
      setHomework(prev => prev.map(h => h.id === hw.id ? updated.homework : h));
      addToast('success', `Status updated to ${STATUS_CONFIG[newStatus].label}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      addToast('error', 'Failed to update status.');
    }
  };

  const handleDelete = async (hw: Homework) => {
    if (!confirm(`Delete "${hw.title}"?`)) return;
    try {
      await api.homework.delete(hw.id);
      setHomework(prev => prev.filter(h => h.id !== hw.id));
      addToast('success', 'Homework deleted.');
    } catch (error) {
      console.error('Failed to delete homework:', error);
      addToast('error', 'Failed to delete homework.');
    }
  };

  const openAddModal = () => {
    setFormData({ title: '', description: '', subject: '', dueAt: '', priority: 'medium' });
    setEditingHw(null);
    setShowAddModal(true);
  };

  const openEditModal = (hw: Homework) => {
    setFormData({
      title: hw.title,
      description: hw.description ?? '',
      subject: hw.subject ?? '',
      dueAt: hw.dueAt ? new Date(hw.dueAt).toISOString().slice(0, 16) : '',
      priority: hw.priority,
    });
    setEditingHw(hw);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      addToast('error', 'Title is required.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingHw) {
        const updated = await api.homework.update(editingHw.id, {
          title: formData.title.trim(),
          description: formData.description || null,
          subject: formData.subject || null,
          dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
          priority: formData.priority,
        });
        setHomework(prev => prev.map(h => h.id === editingHw.id ? updated.homework : h));
        addToast('success', 'Homework updated.');
      } else {
        const created = await api.homework.create({
          title: formData.title.trim(),
          description: formData.description || null,
          subject: formData.subject || null,
          dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
          priority: formData.priority,
        });
        setHomework(prev => [created.homework, ...prev]);
        addToast('success', 'Homework added.');
      }
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to save homework:', error);
      addToast('error', 'Failed to save homework.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2 tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-orange-400" />
            Homework
          </h1>
          <p className="text-text-secondary text-lg">Track and manage your assignments</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Add Assignment
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'text-text-primary' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
          { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl border border-border bg-surface"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Homework List */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : homework.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 rounded-2xl border border-border bg-surface text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-text-secondary text-lg mb-2">No homework yet</p>
            <p className="text-text-muted mb-6">Add your first assignment or send it via WhatsApp</p>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
              Add Assignment
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {homework.map((hw, i) => {
              const statusCfg = STATUS_CONFIG[hw.status];
              const StatusIcon = statusCfg.icon;
              const { text: dueText, isOverdue } = formatDueDate(hw.dueAt);
              return (
                <motion.div
                  key={hw.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl border border-border bg-surface hover:border-orange-500/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Status Button */}
                    <button
                      onClick={() => {
                        const nextStatus: HomeworkStatus = hw.status === 'pending' ? 'in_progress'
                          : hw.status === 'in_progress' ? 'completed'
                          : hw.status === 'completed' ? 'pending'
                          : hw.status === 'overdue' ? 'in_progress' : 'pending';
                        handleStatusChange(hw, nextStatus);
                      }}
                      className="mt-1 flex-shrink-0 w-6 h-6"
                    >
                      <StatusIcon className={`w-6 h-6 ${statusCfg.color.split(' ')[0]}`} />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text-primary truncate">{hw.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${PRIORITY_CONFIG[hw.priority].color} bg-surface-hover`}>
                          {PRIORITY_CONFIG[hw.priority].label}
                        </span>
                      </div>

                      {hw.subject && (
                        <p className="text-sm text-text-secondary mb-1">{hw.subject}</p>
                      )}

                      {hw.description && (
                        <p className="text-sm text-text-muted mb-2 line-clamp-2">{hw.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <span className={`flex items-center gap-1 ${isOverdue && hw.status !== 'completed' ? 'text-red-400' : 'text-text-muted'}`}>
                          <Clock className="w-4 h-4" />
                          {dueText}
                        </span>
                        <span className="text-text-muted">
                          {hw.source === 'whatsapp' ? 'Via WhatsApp' : hw.source === 'classroom' ? 'Via Google Classroom' : 'Manual'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(hw)}
                        className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-text-muted" />
                      </button>
                      <button
                        onClick={() => handleDelete(hw)}
                        className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitting && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-surface border border-border rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-primary">
                  {editingHw ? 'Edit Assignment' : 'Add Assignment'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="p-2 hover:bg-background rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Math Chapter 5 Exercises"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    value={formData.dueAt}
                    onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Assignment details..."
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Priority</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          formData.priority === p
                            ? p === 'low' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                            : p === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-surface-hover text-text-muted hover:text-text-primary'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 bg-background text-text-primary rounded-xl font-medium hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingHw ? 'Update' : 'Add'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}