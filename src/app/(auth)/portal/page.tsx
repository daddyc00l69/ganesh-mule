'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { Sparkles, Shield, UserCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StaffPortalPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MANAGER'>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, expectedRole: selectedRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Route to appropriate dashboard
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/manager');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials or access denied');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = (role: 'ADMIN' | 'MANAGER') => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setEmail('admin@ganeshmule.com');
      setPassword('Admin@123456');
    } else {
      setEmail('manager@ganeshmule.com');
      setPassword('Manager@123456');
    }
  };

  return (
    <div className="dark min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
      {/* Background Lighting Elements */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Return to Storefront */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground glass-control px-3 py-1.5 rounded-control transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Store</span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl glass-primary shadow-lg mb-2">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Staff & Operations Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Ganesh Mule Enterprise Management Console (admin.ganeshmule.com)
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 glass-panel rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setSelectedRole('ADMIN')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedRole === 'ADMIN'
                ? 'glass-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Administrator</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('MANAGER')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedRole === 'MANAGER'
                ? 'glass-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Store Manager</span>
          </button>
        </div>

        {/* Login Form Card */}
        <GlassCard variant="card" className="p-6 space-y-5 shadow-2xl">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/15 text-destructive text-xs flex items-start gap-2 border border-destructive/20 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              label="Staff Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedRole === 'ADMIN' ? 'admin@company.com' : 'manager@company.com'}
              autoComplete="email"
            />

            <GlassInput
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />

            <div className="pt-2">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full font-semibold"
              >
                Sign In as {selectedRole === 'ADMIN' ? 'Administrator' : 'Operations Manager'}
              </GlassButton>
            </div>
          </form>

          {/* Quick Demo Pre-fill for reviewer verification */}
          <div className="pt-4 border-t border-border/40 text-center space-y-2">
            <p className="text-[11px] text-muted-foreground">Quick test login for review:</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials('ADMIN')}
                className="text-[11px] font-mono glass-control px-2.5 py-1 rounded-md text-foreground hover:bg-white/10"
              >
                Admin (demo)
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('MANAGER')}
                className="text-[11px] font-mono glass-control px-2.5 py-1 rounded-md text-foreground hover:bg-white/10"
              >
                Manager (demo)
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-muted-foreground">
          Protected by server-side role validation, rate limiting & audit logs.
        </p>
      </div>
    </div>
  );
}
