'use client';

import { useState } from 'react';
import { Users, Plus, Search, Crown, MoreVertical, Mail } from 'lucide-react';

const teamMembers = [
  { id: '1', name: 'You', email: 'you@example.com', role: 'owner', status: 'active' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'editor', status: 'active' },
];

export default function TeamPage() {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Team</h1>
          <p className="text-text-secondary mt-1">Collaborate with your team</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-glow transition-colors"
        >
          <Mail className="w-5 h-5" />
          <span className="font-medium">Invite</span>
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">Team Members</h2>
        </div>
        <div className="divide-y divide-border">
          {teamMembers.map(member => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-surface-hover transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-medium">{member.name[0]}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-primary">{member.name}</p>
                    {member.role === 'owner' && <Crown className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-sm text-text-muted">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">{member.role}</span>
                <button className="p-1 text-text-muted hover:text-text-primary">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}