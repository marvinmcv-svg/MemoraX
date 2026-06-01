'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Crown, Mail, Settings, MoreHorizontal, Trash2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  memoryCount: number;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');

  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    try {
      const [workspacesData] = await Promise.all([
        api.workspaces.list(),
      ]);
      setWorkspaces((workspacesData.data as Workspace[]) || []);
      setMembers([
        { id: '1', name: 'You', email: 'user@example.com', role: 'owner', status: 'active', joinedAt: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleInvite = () => {
    console.log('Inviting:', inviteEmail, inviteRole);
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteRole('member');
  };

  const stats = [
    { label: 'Workspaces', value: workspaces.length, color: '#6366F1' },
    { label: 'Members', value: members.length, color: '#10B981' },
    { label: 'Pending', value: members.filter(m => m.status === 'pending').length, color: '#F59E0B' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Team
        </h1>
        <p className="text-text-secondary">Manage your team members and workspaces</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl border border-border bg-surface"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <Users className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members Section */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl border border-border bg-surface"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Team Members</h2>
              <Button
                size="sm"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={() => setShowInviteModal(true)}
              >
                Invite
              </Button>
            </div>

            <div className="space-y-3">
              {members.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-background rounded-xl hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-medium">{member.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-text-primary font-medium flex items-center gap-2">
                        {member.name}
                        {member.role === 'owner' && <Crown className="w-4 h-4 text-accent" />}
                      </p>
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      member.role === 'owner' ? 'bg-accent-500/10 text-accent' :
                      member.role === 'admin' ? 'bg-primary-500/10 text-primary' :
                      'bg-surface text-text-muted'
                    }`}>
                      {member.role}
                    </span>
                    {member.role !== 'owner' && (
                      <button className="p-2 text-text-muted hover:text-text-secondary rounded-lg hover:bg-surface transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Settings Section */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl border border-border bg-surface mb-6"
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Team Settings
            </h2>
            <div className="space-y-3">
              <div className="p-4 bg-background rounded-xl">
                <p className="text-sm text-text-muted mb-1">Team Plan</p>
                <p className="text-text-primary font-medium">Free</p>
              </div>
              <div className="p-4 bg-background rounded-xl">
                <p className="text-sm text-text-muted mb-1">Members</p>
                <p className="text-text-primary font-medium">{members.length} / 3</p>
              </div>
              <button className="w-full py-3 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors">
                Upgrade Plan
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl border border-border bg-surface"
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">Workspaces</h2>
            <div className="space-y-3">
              {workspaces.map(workspace => (
                <div key={workspace.id} className="p-4 bg-background rounded-xl">
                  <p className="text-text-primary font-medium mb-1">{workspace.name}</p>
                  <p className="text-xs text-text-muted">{workspace.memberCount} members</p>
                </div>
              ))}
              <button className="w-full py-3 border border-dashed border-border rounded-xl text-text-muted hover:text-text-secondary hover:border-primary-500/30 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                New Workspace
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface border border-border rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-text-primary mb-4">Invite Team Member</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Role</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInviteRole('member')}
                      className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        inviteRole === 'member'
                          ? 'bg-primary-500/10 border-primary-500 text-primary'
                          : 'bg-background border-border text-text-secondary hover:border-primary-500/30'
                      }`}
                    >
                      Member
                    </button>
                    <button
                      onClick={() => setInviteRole('admin')}
                      className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        inviteRole === 'admin'
                          ? 'bg-primary-500/10 border-primary-500 text-primary'
                          : 'bg-background border-border text-text-secondary hover:border-primary-500/30'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" fullWidth onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </Button>
                  <Button fullWidth onClick={handleInvite} disabled={!inviteEmail}>
                    Send Invite
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}