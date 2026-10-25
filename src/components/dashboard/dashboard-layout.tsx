'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { SafeUser } from '@/types';

export interface DashboardLayoutProps {
  role: 'ADMIN' | 'MANAGER';
  title?: string;
  userName?: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  title,
  userName: defaultUserName,
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [authenticatedUser, setAuthenticatedUser] = useState<SafeUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        const data = await res.json();
        if (!data.authenticated || !data.user) {
          throw new Error('Invalid session');
        }

        const user: SafeUser = data.user;
        // Verify role access (ADMIN can access all, MANAGER can access MANAGER)
        if (role === 'ADMIN' && user.role !== 'ADMIN') {
          router.replace('/portal?error=unauthorized');
          return;
        }

        if (isMounted) {
          setAuthenticatedUser(user);
          setIsVerifying(false);
        }
      } catch (err) {
        if (isMounted) {
          const redirectPath = encodeURIComponent(pathname || '/manager');
          router.replace(`/portal?redirect=${redirectPath}`);
        }
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [role, pathname, router]);

  if (isVerifying) {
    return (
      <div className="dark min-h-screen flex flex-col items-center justify-center bg-[#0d0f12] text-white">
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="relative">
            <ShieldCheck className="w-8 h-8 text-[#0071e3]" />
            <Loader2 className="w-8 h-8 text-[#0071e3] animate-spin absolute inset-0 opacity-40" />
          </div>
          <p className="text-xs font-medium text-gray-400 tracking-wide">
            Verifying staff authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          role={role}
          title={title}
          userName={authenticatedUser?.name || defaultUserName}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
