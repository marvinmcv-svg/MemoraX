'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, CheckCircle2, XCircle, Clock, BookOpen, AlertCircle, Trash2, Link2, RefreshCw } from 'lucide-react';
import { api, type Homework, type HomeworkStatus } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const STATUS_CONFIG: Record<HomeworkStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-400 bg-amber-400/10', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-400 bg-blue-400/10', icon: Clock },
  completed: { label: 'Completed', color: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle2 },
  overdue: { label: 'Overdue', color: 'text-red-400 bg-red-400/10', icon: AlertCircle },
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

export default function FamilyDashboardPage() {
  const [role, setRole] = useState<'parent' | 'child' | null>(null);
  const [linkInfo, setLinkInfo] = useState<{ id: string; parentName?: string; childName?: string; parentEmail?: string | null; childEmail?: string | null } | null>(null);
  const [childHomework, setChildHomework] = useState<Homework[]>([]);
  const [childInfo, setChildInfo] = useState<{ id: string; name: string; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [acceptCodeInput, setAcceptCodeInput] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [refreshingChildHw, setRefreshingChildHw] = useState(false);
  const { addToast } = useToast();

  const fetchStatus = useCallback(async () => {
    try {
      const status = await api.family.status();
      setRole(status.role);
      if (status.link) {
        setLinkInfo({
          id: status.link.id,
          parentName: status.link.parentName,
          childName: status.link.childName,
          parentEmail: status.link.parentEmail,
          childEmail: status.link.childEmail,
        });
      }
    } catch (error) {
      console.error('Failed to fetch family status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChildHomework = useCallback(async () => {
    setRefreshingChildHw(true);
    try {
      const data = await api.family.childHomework();
      setChildHomework(data.homework);
      setChildInfo(data.child);
    } catch (error) {
      console.error('Failed to fetch child homework:', error);
      addToast('error', 'Failed to load child homework.');
    } finally {
      setRefreshingChildHw(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (role === 'parent') {
      fetchChildHomework();
    }
  }, [role, fetchChildHomework]);

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const result = await api.family.generateCode();
      setPendingCode(result.linkCode);
      addToast('success', 'Link code generated! Share it with your child.');
    } catch (error) {
      console.error('Failed to generate code:', error);
      addToast('error', 'Failed to generate code.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleAcceptCode = async () => {
    if (!acceptCodeInput.trim()) {
      addToast('error', 'Please enter the link code.');
      return;
    }
    setAccepting(true);
    try {
      const result = await api.family.acceptCode(acceptCodeInput.trim());
      if (result.success) {
        setLinkInfo({ id: result.link.id, parentName: result.link.parentName, parentEmail: result.link.parentEmail });
        setRole('child');
        addToast('success', `You're now linked with ${result.link.parentName}!`);
        setAcceptCodeInput('');
      }
    } catch (error) {
      console.error('Failed to accept code:', error);
      addToast('error', 'Invalid or expired code. Ask your parent for a new one.');
    } finally {
      setAccepting(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink? You\'ll stop seeing each other\'s information.')) return;
    setUnlinking(true);
    try {
      await api.family.unlink();
      setRole(null);
      setLinkInfo(null);
      setChildHomework([]);
      setChildInfo(null);
      setPendingCode(null);
      addToast('success', 'Family link removed.');
    } catch (error) {
      console.error('Failed to unlink:', error);
      addToast('error', 'Failed to unlink. Try again.');
    } finally {
      setUnlinking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', 'Code copied!');
  };

  const stats = {
    total: childHomework.length,
    pending: childHomework.filter(h => h.status === 'pending').length,
    inProgress: childHomework.filter(h => h.status === 'in_progress').length,
    completed: childHomework.filter(h => h.status === 'completed').length,
    overdue: childHomework.filter(h => h.status === 'overdue').length,
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-48 bg-surface-hover rounded-xl" />
          <div className="h-32 bg-surface-hover rounded-2xl" />
          <div className="h-64 bg-surface-hover rounded-2xl" />
        </div>
      </div>
    );
  }

  // No link — show linking options
  if (!role) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-text-primary mb-2 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-violet-400" />
            Family
          </h1>
          <p className="text-text-secondary text-lg">Connect with your family to stay updated on assignments</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Parent option */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl border border-border bg-surface"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">I'm the Parent</h2>
            <p className="text-text-muted mb-4">Generate a link code to share with your child. Once they accept it, you'll see their upcoming assignments.</p>
            {pendingCode ? (
              <div className="p-4 bg-background rounded-xl">
                <p className="text-sm text-text-muted mb-2">Share this code with your child:</p>
                <div className="flex items-center gap-2">
                  <code className="text-2xl font-mono font-bold text-primary tracking-widest">{pendingCode}</code>
                  <button onClick={() => copyToClipboard(pendingCode)} className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-2">Expires in 24 hours</p>
                <Button size="sm" variant="ghost" className="mt-3" onClick={() => setPendingCode(null)}>Generate new code</Button>
              </div>
            ) : (
              <Button leftIcon={<Link2 className="w-4 h-4" />} onClick={handleGenerateCode} loading={generatingCode}>
                Generate Link Code
              </Button>
            )}
          </motion.div>

          {/* Child option */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl border border-border bg-surface"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">I'm the Student</h2>
            <p className="text-text-muted mb-4">Got a code from your parent? Enter it here to let them see your assignments.</p>
            <div className="space-y-3">
              <input
                type="text"
                value={acceptCodeInput}
                onChange={e => setAcceptCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter 8-character code"
                maxLength={8}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-center font-mono text-lg font-bold tracking-widest placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
              <Button onClick={handleAcceptCode} loading={accepting} disabled={acceptCodeInput.length !== 8} className="w-full">
                Accept Code
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-xl border border-border bg-surface text-center"
        >
          <p className="text-sm text-text-muted">Or link via WhatsApp — just send <code className="px-2 py-1 bg-background rounded text-primary font-mono text-sm">accept YOURCODE</code> to MemoraX</p>
        </motion.div>
      </div>
    );
  }

  // Parent view
  if (role === 'parent') {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2 tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-violet-400" />
              Family Dashboard
            </h1>
            <p className="text-text-secondary text-lg">
              Monitoring assignments for <span className="font-semibold text-text-primary">{childInfo?.name ?? 'your child'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<RefreshCw className={`w-4 h-4 ${refreshingChildHw ? 'animate-spin' : ''}`} />} onClick={fetchChildHomework} disabled={refreshingChildHw}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={handleUnlink} disabled={unlinking}>
              Unlink
            </Button>
          </div>
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

        {/* Assignment list */}
        <div className="space-y-3">
          {childHomework.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-2xl">
              <BookOpen className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No assignments found for your child yet.</p>
            </div>
          ) : (
            childHomework.map((hw) => {
              const { text: dueText, isOverdue } = formatDueDate(hw.dueAt);
              const statusCfg = STATUS_CONFIG[hw.status];
              const StatusIcon = statusCfg.icon;

              return (
                <motion.div
                  key={hw.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl border border-border bg-surface hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                        {hw.subject && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{hw.subject}</span>
                        )}
                      </div>
                      <h3 className="text-text-primary font-semibold text-lg truncate">{hw.title}</h3>
                      {hw.description && (
                        <p className="text-text-muted text-sm mt-1 line-clamp-2">{hw.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-text-secondary'}`}>
                        {dueText}
                      </p>
                      {hw.priority === 'high' && (
                        <span className="text-xs text-red-400 font-medium">High priority</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Child view
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-text-primary mb-2 tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-emerald-400" />
          Family
        </h1>
        <p className="text-text-secondary text-lg">You're connected with your family</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl border border-border bg-surface"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-text-primary font-semibold text-lg">{linkInfo?.parentName ?? 'Parent'}</p>
              {linkInfo?.parentEmail && (
                <p className="text-sm text-text-muted">{linkInfo.parentEmail}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Connected</span>
          </div>
        </div>

        <p className="text-text-muted mb-4">
          Your parent can see your upcoming assignments and will receive notifications when deadlines are approaching.
        </p>

        <Button variant="ghost" size="sm" leftIcon={<Trash2 className="w-4 h-4" />} onClick={handleUnlink} disabled={unlinking} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
          Unlink from parent
        </Button>
      </motion.div>
    </div>
  );
}