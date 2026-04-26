'use client';

import { Settings, User, Bell, Shield, Palette, Database, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const settingsSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile', desc: 'Manage your name, email, and photo' },
      { icon: Bell, label: 'Notifications', desc: 'Configure reminder delivery' },
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

export default function SettingsPage() {
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
              {section.items.map((item) => (
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
              ))}
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