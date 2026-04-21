'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Brain,
  Clock,
  FolderOpen,
  Users,
  Settings,
  Hash,
  Mic,
  Search,
  Bell,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

const sidebarLinks = [
  { href: '/dashboard', icon: Brain, label: 'Home' },
  { href: '/dashboard/memories', icon: Hash, label: 'Memories' },
  { href: '/dashboard/reminders', icon: Clock, label: 'Reminders' },
  { href: '/dashboard/spaces', icon: FolderOpen, label: 'Spaces' },
  { href: '/dashboard/team', icon: Users, label: 'Team' },
  { href: '/dashboard/channels', icon: Mic, label: 'Channels' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <div>
                <span className="font-semibold text-lg text-text-primary">MemoraX</span>
                <p className="text-xs text-text-muted">AI Memory OS</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-medium">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">User</p>
                <p className="text-xs text-text-muted truncate">user@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col lg:pl-64">
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center justify-between h-full px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search memories... (Press /)"
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 ml-4">
              <button className="relative p-2 text-text-secondary hover:text-text-primary">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
