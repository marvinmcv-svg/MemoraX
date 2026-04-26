'use client';

import { Users, Plus, Crown, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeamPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Team
        </h1>
        <p className="text-text-secondary">Collaborate with your team members</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Team Members</h2>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-glow transition-colors"
              >
                <Plus className="w-4 h-4" />
                Invite
              </motion.button>
            </div>

            <div className="space-y-4">
              {[
                { name: 'You', email: 'user@example.com', role: 'Owner' },
              ].map((member, i) => (
                <motion.div
                  key={member.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-background rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-medium">{member.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-text-primary font-medium flex items-center gap-2">
                        {member.name}
                        {member.role === 'Owner' && <Crown className="w-4 h-4 text-accent" />}
                      </p>
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {member.role}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="p-6 rounded-2xl border border-border bg-surface">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Team Settings</h2>
            <div className="space-y-4">
              <div className="p-4 bg-background rounded-xl">
                <p className="text-sm text-text-muted mb-1">Team Plan</p>
                <p className="text-text-primary font-medium">Free</p>
              </div>
              <div className="p-4 bg-background rounded-xl">
                <p className="text-sm text-text-muted mb-1">Members</p>
                <p className="text-text-primary font-medium">1 / 3</p>
              </div>
              <button className="w-full py-3 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}