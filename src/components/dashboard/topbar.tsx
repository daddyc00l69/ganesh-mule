'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon, Bell, Shield, User } from 'lucide-react';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';

export interface TopbarProps {
  onToggleSidebar: () => void;
  title?: string;
  role: 'ADMIN' | 'MANAGER';
  userName?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  title,
  role,
  userName = 'Staff User',
}) => {
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    // Check saved theme or system preference
    const saved = localStorage.getItem('solid-glass:theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeDark = saved ? saved === 'dark' : prefersDark;
    setIsDark(activeDark);
    document.documentElement.classList.toggle('dark', activeDark);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    localStorage.setItem('solid-glass:theme', nextTheme ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', nextTheme);
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
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to daylight glass' : 'Switch to dark glass'}
          className="p-2 rounded-control glass-control text-foreground hover:bg-white/10 transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
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
      </div>
    </header>
  );
};
