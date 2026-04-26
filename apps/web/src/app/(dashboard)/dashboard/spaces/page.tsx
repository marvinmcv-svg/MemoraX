'use client';

import { FolderOpen, Plus, Settings, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SpacesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-primary" />
          Spaces
        </h1>
        <p className="text-text-secondary">Organize memories into shared workspaces</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { name: 'Personal', icon: Users, desc: 'Your private memories', count: 0 },
          { name: 'Work', icon: Users, desc: 'Team shared memories', count: 0 },
          { name: 'Family', icon: Users, desc: 'Family memories', count: 0 },
        ].map((space, i) => (
          <motion.div
            key={space.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl border border-border bg-surface hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <space.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold text-text-muted">{space.count}</span>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">{space.name}</h3>
            <p className="text-sm text-text-muted">{space.desc}</p>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border border-dashed border-border bg-surface hover:border-primary/50 transition-all cursor-pointer flex items-center justify-center min-h-[180px] group"
        >
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
              <Plus className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <p className="text-text-muted group-hover:text-text-secondary transition-colors">Create new space</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}