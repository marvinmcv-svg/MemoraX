'use client';

import { useState } from 'react';
import { FolderOpen, Plus, Search, MoreVertical } from 'lucide-react';

const spaces = [
  { id: '1', name: 'Work', description: 'Work-related memories and notes', memoryCount: 42 },
  { id: '2', name: 'Personal', description: 'Personal thoughts and reminders', memoryCount: 38 },
  { id: '3', name: 'Projects', description: 'Ongoing project documentation', memoryCount: 15 },
];

export default function SpacesPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Spaces</h1>
          <p className="text-text-secondary mt-1">Organize your memories into spaces</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-glow transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Space</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spaces.map(space => (
          <div key={space.id} className="p-5 bg-surface rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4 text-text-muted" />
              </button>
            </div>
            <h3 className="font-semibold text-text-primary mb-1">{space.name}</h3>
            <p className="text-sm text-text-muted mb-3">{space.description}</p>
            <div className="text-xs text-text-muted">{space.memoryCount} memories</div>
          </div>
        ))}
      </div>
    </div>
  );
}