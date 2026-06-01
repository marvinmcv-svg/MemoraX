'use client';

import { ReactNode, useState } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { Search, Bell, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '/') {
      e.preventDefault();
      router.push('/dashboard/search');
    }
  };

  return (
    <div className="flex h-screen bg-background-base">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:pl-[260px] transition-all duration-200">
        {/* Header */}
        <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center justify-between h-full px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search memories... (Press /)"
                  onKeyDown={handleSearchKeyDown}
                  onClick={() => router.push('/dashboard/search')}
                  readOnly
                  className="w-full pl-12 pr-4 py-2.5 bg-background border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer group-hover:border-primary-500/30"
                />
                <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-text-muted bg-background border border-border rounded">
                  /
                </kbd>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 ml-4">
              {/* Notifications */}
              <button className="relative p-2.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-surface" />
              </button>

              {/* User Avatar */}
              <div className="w-9 h-9 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-400">U</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
