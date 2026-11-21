'use client';

import React from 'react';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export interface TopbarProps {
  onToggleSidebar: () => void;
  title?: string;
  role: 'DEVELOPER' | 'ADMIN' | 'MANAGER';
  userName?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  title,
  role,
  userName = 'Staff User',
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/portal';
    } catch {
      window.location.href = '/portal';
    }
  };

  return (
    <header className="h-16 glass-panel border-b border-border/40 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-control glass-control text-foreground hover:bg-white/10"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Theme Toggle (Light / Dark Mode) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-control glass-control text-foreground hover:bg-white/10 transition-colors cursor-pointer"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* User Card */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/40">
          <div className="w-8 h-8 rounded-full glass-control flex items-center justify-center text-foreground/80 font-medium text-xs">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left text-xs">
            <p className="font-medium text-foreground leading-none">{userName}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{role}</p>
          </div>
        </div>

        {/* Prominent Universal Sign Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign Out of Console"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-control glass-control text-destructive hover:bg-destructive/15 transition-all text-xs font-medium cursor-pointer ml-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
