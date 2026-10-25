'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { Sparkles, Shield, UserCheck, AlertCircle, ArrowLeft, CheckCircle2, UserPlus, KeyRound, LogOut, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SafeUser } from '@/types';

function StaffPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectTarget = rawRedirect ? decodeURIComponent(rawRedirect) : '';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MANAGER'>('MANAGER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    urlError === 'unauthorized' ? 'You do not have Administrator privileges for that section.' : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<SafeUser | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [isCheckingSetup, setIsCheckingSetup] = useState<boolean>(true);

  // Check existing session & setup configuration
  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth/me', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.authenticated && data.user) {
          setActiveSession(data.user);
        }
      })
      .catch(() => {});

    // Check system setup status
    fetch('/api/admin/setup', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setIsConfigured(data.configured !== false);
        setIsCheckingSetup(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsConfigured(true);
        setIsCheckingSetup(false);
      });

    return () => {
      isMounted = false;
    };
  }, [redirectTarget]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setActiveSession(null);
      setSuccessMessage('Logged out successfully.');
    } catch {}
  };

  const autofillCredentials = (role: 'MANAGER' | 'ADMIN') => {
    setSelectedRole(role);
    if (role === 'MANAGER') {
      setEmail('manager@devtushar.uk');
      setPassword('Manager@123456');
    } else {
      setEmail('admin@devtushar.uk');
      setPassword('Admin@123456');
    }
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim(), expectedRole: selectedRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccessMessage(`Authentication successful! Launching ${selectedRole === 'ADMIN' ? 'Administrator' : 'Store Manager'} console...`);

      // Redirect immediately to target URL or appropriate dashboard
      const destination = redirectTarget || (selectedRole === 'ADMIN' ? '/admin' : '/manager');
      setTimeout(() => {
        window.location.href = destination;
      }, 350);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials or access denied');
      setIsLoading(false);
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
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground glass-control px-3 py-1.5 rounded-control transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Store</span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl glass-primary shadow-lg mb-1">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Staff &amp; Operations Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Ganesh Mule Enterprise Management Console
          </p>
          {redirectTarget && (
            <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-mono border border-blue-500/30">
              Target: {redirectTarget}
            </span>
          )}
        </div>

        {/* Active Session Notification & Switcher */}
        {activeSession && (
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Currently Signed In: {activeSession.name}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                {activeSession.role}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{activeSession.email}</p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const dest = redirectTarget || (activeSession.role === 'ADMIN' ? '/admin' : '/manager');
                  window.location.href = dest;
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue to {activeSession.role === 'ADMIN' ? 'Admin' : 'Manager'} Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-xs transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 glass-panel rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setSelectedRole('MANAGER')}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedRole === 'MANAGER'
                ? 'glass-primary shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Store Manager</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('ADMIN')}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedRole === 'ADMIN'
                ? 'glass-primary shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Login Form Card */}
        <GlassCard variant="card" className="p-6 space-y-4 shadow-2xl">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/15 text-destructive text-xs flex items-start gap-2 border border-destructive/20 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs flex items-start gap-2 border border-emerald-500/25 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Master Credentials Autofill Pill */}
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
            <span className="text-[11px] text-muted-foreground">
              Master Access: <strong className="text-foreground">{selectedRole === 'MANAGER' ? 'manager@devtushar.uk' : 'admin@devtushar.uk'}</strong>
            </span>
            <button
              type="button"
              onClick={() => autofillCredentials(selectedRole)}
              className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
            >
              Autofill Credentials
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              label={selectedRole === 'MANAGER' ? 'Manager Email' : 'Administrator Email'}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedRole === 'MANAGER' ? 'manager@devtushar.uk' : 'admin@devtushar.uk'}
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
              hint={
                selectedRole === 'MANAGER'
                  ? 'Enter manager password (e.g. Manager@123456 or Admin@123456)'
                  : 'Enter configured Administrator password (e.g. Admin@123456)'
              }
            />

            <div className="pt-2">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full font-semibold"
              >
                Sign In as {selectedRole === 'MANAGER' ? 'Store Manager' : 'Administrator'}
              </GlassButton>
            </div>
          </form>

          {/* Quick Actions & Links */}
          <div className="pt-3 border-t border-border/40 flex flex-col gap-2 text-center text-xs">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <Link href="/config" className="text-primary hover:underline font-medium">
                Configure Admin Credentials (/config)
              </Link>
              <button
                type="button"
                onClick={() => setSelectedRole(selectedRole === 'ADMIN' ? 'MANAGER' : 'ADMIN')}
                className="text-muted-foreground hover:text-foreground underline font-medium cursor-pointer"
              >
                Switch to {selectedRole === 'ADMIN' ? 'Store Manager' : 'Administrator'}
              </button>
            </div>

            <Link
              href="/portal/join"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-primary hover:underline font-medium pt-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invited by an Administrator? Join as Manager here</span>
            </Link>
          </div>
        </GlassCard>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-muted-foreground">
          Protected by server-side HMAC session tokens &amp; audit trails.
        </p>
      </div>
    </div>
  );
}

export default function StaffPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="dark min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <StaffPortalContent />
    </Suspense>
  );
}
