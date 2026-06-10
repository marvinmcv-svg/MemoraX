'use client';

import { useState, useEffect } from 'react';
import { Settings, User, Bell, Shield, Palette, Database, LogOut, ChevronRight, Link2, RefreshCw, CheckCircle2, XCircle, BookOpen, Users, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-c00c.up.railway.app';

interface ClassroomStatus {
  connected: boolean;
  expiresAt: string | null;
  homeworkCount?: number;
  needsRefresh?: boolean;
}

interface FamilyStatus {
  role: 'parent' | 'child' | null;
  link: {
    id: string;
    parentName?: string;
    childName?: string;
    parentEmail?: string | null;
    childEmail?: string | null;
    status: string;
    linkedAt: string;
  } | null;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [classroomStatus, setClassroomStatus] = useState<ClassroomStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [familyStatus, setFamilyStatus] = useState<FamilyStatus | null>(null);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [acceptCodeInput, setAcceptCodeInput] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const { addToast } = useToast();

  const googleConnected = searchParams.get('google_connected');
  const googleError = searchParams.get('google_error');

  useEffect(() => {
    if (googleConnected === 'true') {
      addToast('success', 'Google Classroom connected successfully!');
    } else if (googleError) {
      const errorMessages: Record<string, string> = {
        access_denied: 'Google authorization was cancelled',
        token_exchange_failed: 'Failed to connect to Google. Please try again.',
      };
      addToast('error', errorMessages[googleError] || `Google connection failed: ${googleError}`);
    }
  }, [googleConnected, googleError, addToast]);

  useEffect(() => {
    checkClassroomStatus();
    checkFamilyStatus();
  }, []);

  const checkClassroomStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/google/status`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setClassroomStatus(data);
      }
    } catch (error) {
      console.error('Failed to check classroom status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFamilyStatus = async () => {
    try {
      const status = await api.family.status();
      setFamilyStatus(status);
    } catch (error) {
      console.error('Failed to check family status:', error);
    } finally {
      setFamilyLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    setConnecting(true);
    window.location.href = `${API_URL}/api/v1/auth/google`;
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm("Disconnect Google Classroom? Your synced assignments will remain but won't update automatically.")) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/google`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setClassroomStatus({ connected: false, expiresAt: null });
        addToast('success', 'Google Classroom disconnected.');
      }
    } catch (error) {
      addToast('error', 'Failed to disconnect Google Classroom.');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/classroom/sync`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        addToast('success', `Synced! ${data.sync.assignmentsCreated} new, ${data.sync.assignmentsUpdated} updated.`);
        checkClassroomStatus();
      } else {
        addToast('error', 'Sync failed. Make sure Google Classroom is connected.');
      }
    } catch (error) {
      addToast('error', 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const result = await api.family.generateCode();
      setPendingCode(result.linkCode);
      addToast('success', 'Link code generated! Share it with your child.');
      checkFamilyStatus();
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
        setAcceptCodeInput('');
        addToast('success', `You're now linked with ${result.link.parentName}!`);
        checkFamilyStatus();
      }
    } catch (error) {
      console.error('Failed to accept code:', error);
      addToast('error', 'Invalid or expired code. Ask your parent for a new one.');
    } finally {
      setAccepting(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink?')) return;
    setUnlinking(true);
    try {
      await api.family.unlink();
      setPendingCode(null);
      addToast('success', 'Family link removed.');
      checkFamilyStatus();
    } catch (error) {
      console.error('Failed to unlink:', error);
      addToast('error', 'Failed to unlink.');
    } finally {
      setUnlinking(false);
    }
  };

  const googleClassroomItem = {
    icon: BookOpen,
    label: 'Google Classroom',
    desc: classroomStatus?.connected
      ? `Connected · ${classroomStatus.homeworkCount || 0} assignments synced`
      : 'Sync assignments automatically from Google Classroom',
    status: classroomStatus,
    onConnect: handleConnectGoogle,
    onDisconnect: handleDisconnectGoogle,
    onSync: handleSync,
    syncing,
    loading,
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', desc: 'Manage your name, email, and photo' },
        { icon: Bell, label: 'Notifications', desc: 'Configure reminder delivery' },
      ],
    },
    {
      title: 'Connected Services',
      items: [
        googleClassroomItem as { icon: React.ElementType; label: string; desc: string; status?: ClassroomStatus; onConnect?: () => void; onDisconnect?: () => void; onSync?: () => void; syncing?: boolean; loading?: boolean },
      ],
    },
    {
      title: 'Family',
      items: [
        {
          icon: Users,
          label: 'Family Link',
          desc: familyStatus?.role
            ? familyStatus.role === 'parent'
              ? `Linked with ${familyStatus.link?.childName || 'your child'}`
              : `Linked with ${familyStatus.link?.parentName || 'your parent'}`
            : 'Connect with family members to share assignment updates',
          familyStatus,
          pendingCode,
          acceptCodeInput,
          generatingCode,
          accepting,
          unlinking,
          onGenerateCode: handleGenerateCode,
          onAcceptCode: handleAcceptCode,
          onUnlink: handleUnlink,
          setAcceptCodeInput,
          setPendingCode,
          loading: familyLoading,
        } as any,
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Palette, label: 'Appearance', desc: 'Theme and display options' },
        { icon: Database, label: 'Data & Storage', desc: 'Export memories, manage storage' },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: Shield, label: 'Privacy', desc: 'Control your data and sharing' },
      ],
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Settings
        </h1>
        <p className="text-text-secondary">Manage your account and preferences</p>
      </motion.div>

      <div className="space-y-6">
        {settingsSections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl border border-border bg-surface"
          >
            <h2 className="text-sm font-medium text-text-muted mb-4 uppercase tracking-wider">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item, itemIdx) => {
                const isGoogleClassroom = item.label === 'Google Classroom' && 'status' in item;
                const isFamily = item.label === 'Family Link' && 'familyStatus' in item;

                if (isGoogleClassroom && item.status !== undefined) {
                  const cs = item.status as ClassroomStatus | null;
                  return (
                    <div
                      key={item.label}
                      className="p-4 bg-background rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cs?.connected ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
                            <BookOpen className={`w-5 h-5 ${cs?.connected ? 'text-emerald-400' : 'text-primary'}`} />
                          </div>
                          <div>
                            <p className="text-text-primary font-medium">{item.label}</p>
                            <p className="text-sm text-text-muted">{item.desc}</p>
                          </div>
                        </div>
                        {cs?.connected ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm text-emerald-400 font-medium">Connected</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-text-muted" />
                            <span className="text-sm text-text-muted">Not connected</span>
                          </div>
                        )}
                      </div>

                      {cs?.connected ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<RefreshCw className={`w-4 h-4 ${item.syncing ? 'animate-spin' : ''}`} />}
                            onClick={item.onSync}
                            disabled={item.syncing || false}
                          >
                            {item.syncing ? 'Syncing...' : 'Sync Now'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={item.onDisconnect}
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          leftIcon={<Link2 className="w-4 h-4" />}
                          onClick={item.onConnect}
                          disabled={item.loading || false}
                        >
                          Connect Google Classroom
                        </Button>
                      )}
                    </div>
                  );
                }

                if (isFamily) {
                  const fs = item.familyStatus as FamilyStatus | undefined;
                  const isLinked = fs?.role !== null;

                  return (
                    <div
                      key={item.label}
                      className="p-4 bg-background rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLinked ? 'bg-violet-500/10' : 'bg-primary/10'}`}>
                            <Users className={`w-5 h-5 ${isLinked ? 'text-violet-400' : 'text-primary'}`} />
                          </div>
                          <div>
                            <p className="text-text-primary font-medium">{item.label}</p>
                            <p className="text-sm text-text-muted">{item.desc}</p>
                          </div>
                        </div>
                        {isLinked ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm text-emerald-400 font-medium">{fs?.role === 'parent' ? 'Parent' : 'Student'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-text-muted" />
                            <span className="text-sm text-text-muted">Not linked</span>
                          </div>
                        )}
                      </div>

                      {isLinked ? (
                        <div className="flex items-center gap-2">
                          {fs?.role === 'parent' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={item.onUnlink}
                              disabled={item.unlinking || false}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              {item.unlinking ? 'Unlinking...' : 'Unlink'}
                            </Button>
                          )}
                          {fs?.role === 'child' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={item.onUnlink}
                              disabled={item.unlinking || false}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              {item.unlinking ? 'Unlinking...' : 'Unlink'}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {item.pendingCode ? (
                            <div className="p-3 bg-surface rounded-lg">
                              <p className="text-xs text-text-muted mb-1">Share this code with your child:</p>
                              <div className="flex items-center gap-2">
                                <code className="text-xl font-mono font-bold text-primary tracking-widest">{item.pendingCode}</code>
                                <button
                                  onClick={() => { navigator.clipboard.writeText(item.pendingCode || ''); addToast('success', 'Code copied!'); }}
                                  className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
                                >
                                  <Copy className="w-4 h-4 text-text-muted" />
                                </button>
                              </div>
                              <button onClick={() => item.setPendingCode(null)} className="text-xs text-text-muted mt-1 hover:text-primary">
                                Generate new code
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                leftIcon={<Link2 className="w-4 h-4" />}
                                onClick={item.onGenerateCode}
                                disabled={item.generatingCode || false}
                              >
                                {item.generatingCode ? 'Generating...' : "I'm the Parent"}
                              </Button>
                            </div>
                          )}
                          <div className="border-t border-border pt-3">
                            <p className="text-xs text-text-muted mb-2">Or enter a code from your parent:</p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={item.acceptCodeInput}
                                onChange={e => item.setAcceptCodeInput(e.target.value.toUpperCase())}
                                placeholder="8-char code"
                                maxLength={8}
                                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-center font-mono text-sm font-bold tracking-widest placeholder:text-text-muted focus:outline-none focus:border-primary"
                              />
                              <Button
                                size="sm"
                                onClick={item.onAcceptCode}
                                disabled={item.accepting || item.acceptCodeInput.length !== 8}
                              >
                                {item.accepting ? 'Accepting...' : "I'm the Student"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.label}
                    className="w-full flex items-center justify-between p-4 bg-background rounded-xl hover:bg-surface-hover transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-text-primary font-medium">{item.label}</p>
                        <p className="text-sm text-text-muted">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border border-border bg-surface"
        >
          <button className="w-full flex items-center justify-between p-4 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-left">
                <p className="text-red-500 font-medium">Sign Out</p>
                <p className="text-sm text-red-400/60">Log out of your account</p>
              </div>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}