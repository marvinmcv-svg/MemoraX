'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Brain,
  Search,
  Hash,
  Clock,
  FolderOpen,
  Users,
  Mic,
  Settings,
  ChevronLeft,
  Sparkles,
  X,
  Plus,
  Network,
  Key,
  BookOpen,
} from 'lucide-react';

interface SidebarLink {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string | number;
}

const mainLinks: SidebarLink[] = [
  { href: '/dashboard', icon: Brain, label: 'Home' },
  { href: '/dashboard/search', icon: Search, label: 'Search' },
  { href: '/dashboard/memories', icon: Hash, label: 'Memories' },
  { href: '/dashboard/reminders', icon: Clock, label: 'Reminders' },
  { href: '/dashboard/homework', icon: BookOpen, label: 'Homework' },
  { href: '/dashboard/family', icon: Users, label: 'Family' },
  { href: '/dashboard/spaces', icon: FolderOpen, label: 'Spaces' },
  { href: '/dashboard/team', icon: Users, label: 'Team' },
  { href: '/dashboard/channels', icon: Mic, label: 'Channels' },
  { href: '/dashboard/knowledge-graph', icon: Network, label: 'Knowledge Graph' },
  { href: '/dashboard/discover', icon: Sparkles, label: 'Discover' },
  { href: '/dashboard/api-keys', icon: Key, label: 'API Keys' },
];

const bottomLinks: SidebarLink[] = [
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 72 : 260,
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-border',
          'transform transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0 shadow-glow-primary">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0"
                >
                  <span className="font-semibold text-lg text-text-primary block truncate">MemoraX</span>
                  <span className="text-xs text-text-muted">AI Memory OS</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Collapse button - desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors ml-auto"
          >
            <ChevronLeft className={clsx('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </button>

          {/* Close button - mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Capture Button */}
        <div className="px-3 py-4">
          <Link
            href="/dashboard"
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl',
              'bg-primary-500 text-white',
              'hover:bg-primary-400 transition-colors',
              'shadow-glow-primary',
              collapsed && 'justify-center px-0'
            )}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium"
                >
                  Quick Capture
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {mainLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
 key={link.href}
                href={link.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  'hover:bg-surface-hover',
                  isActive
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-text-secondary hover:text-text-primary',
                  collapsed && 'justify-center px-0'
                )}
              >
                <link.icon className={clsx('w-5 h-5 flex-shrink-0', isActive && 'text-primary-400')} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium flex-1"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {link.badge && !collapsed && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary-500/20 text-primary-400">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Links */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          {bottomLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                  'hover:bg-surface-hover',
                  isActive
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-text-secondary hover:text-text-primary',
                  collapsed && 'justify-center px-0'
                )}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>

        {/* AI Status */}
        <div className="px-3 py-4 border-t border-border">
          <div
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary-500/10',
              collapsed && 'justify-center px-0'
            )}
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 text-secondary-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-secondary-400 rounded-full animate-pulse" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-sm font-medium text-secondary-400">AI Active</p>
                  <p className="text-xs text-text-muted">Processing memories</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-40 w-14 h-14 rounded-full bg-primary-500 text-white shadow-glow-primary flex items-center justify-center"
      >
        <Brain className="w-6 h-6" />
      </button>
    </>
  );
}
