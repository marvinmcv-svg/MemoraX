'use client';

import { useState } from 'react';
import { User, Bell, Shield, Palette, Database, Key, ChevronRight } from 'lucide-react';

const settingsSections = [
  {
    id: 'account',
    title: 'Account',
    icon: User,
    description: 'Manage your account settings',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Configure reminder notifications',
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Shield,
    description: 'Control your data and privacy',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel',
  },
  {
    id: 'data',
    title: 'Data & Storage',
    icon: Database,
    description: 'Manage your data and storage',
  },
  {
    id: 'api',
    title: 'API Keys',
    icon: Key,
    description: 'Manage your API keys',
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">Configure your MemoraX experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            {settingsSections.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(isActive ? null : section.id)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-surface-hover transition-colors ${
                    index !== settingsSections.length - 1 ? 'border-b border-border' : ''
                  } ${isActive ? 'bg-primary/5' : ''}`}
                >
                  <Icon className="w-5 h-5 text-text-muted" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-text-primary">{section.title}</p>
                    <p className="text-xs text-text-muted">{section.description}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${isActive ? 'rotate-90' : ''}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl border border-border p-6">
            {activeSection === null ? (
              <div className="text-center py-12">
                <p className="text-text-secondary">Select a setting to configure</p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  {settingsSections.find(s => s.id === activeSection)?.title}
                </h2>
                <p className="text-text-muted">
                  {activeSection === 'account' && 'Manage your account details, email, and password.'}
                  {activeSection === 'notifications' && 'Configure how and when you receive notifications.'}
                  {activeSection === 'privacy' && 'Control your privacy settings and data sharing.'}
                  {activeSection === 'appearance' && 'Customize colors, themes, and display options.'}
                  {activeSection === 'data' && 'Export, import, or delete your data.'}
                  {activeSection === 'api' && 'View and manage your API keys for integrations.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}