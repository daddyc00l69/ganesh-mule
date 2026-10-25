'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { Sparkles, Shield, UserCheck, AlertCircle, ArrowLeft, RotateCcw, CheckCircle2, UserPlus, KeyRound } from 'lucide-react';
import Link from 'next/link';

function StaffPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectTarget = rawRedirect ? decodeURIComponent(rawRedirect) : '';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MANAGER'>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    urlError === 'unauthorized' ? 'You do not have Administrator privileges for that section.' : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUnconfigured, setIsUnconfigured] = useState(false);

  // 1. Check if user already has an active, valid session
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
          const destination = redirectTarget || (data.user.role === 'ADMIN' ? '/admin' : '/manager');
          window.location.href = destination;
        }
      })
      .catch(() => {});

    // Check system setup status
    fetch('/api/admin/setup')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setIsUnconfigured(data.configured === false);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [redirectTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, expectedRole: selectedRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.unconfigured) {
          setIsUnconfigured(true);
        }
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccessMessage('Authentication successful! Launching workspace...');

      // Redirect immediately to target URL or dashboard
      const destination = redirectTarget || (data.user.role === 'ADMIN' ? '/admin' : '/manager');
      setTimeout(() => {
        window.location.href = destination;
      }, 300);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials or access denied');
      setIsLoading(false);
    }
  };

  const handleResetAdmin = async () => {
    setIsResetting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_ADMIN' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset administrator');
      }

      setEmail('admin@devtushar.uk');
      setPassword('Admin@123456');
      setSelectedRole('ADMIN');
      setSuccessMessage('Administrator reset to default (Admin@123456). Launching Admin Console...');

      setTimeout(() => {
        window.location.href = redirectTarget || '/admin';
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset admin account');
      setIsResetting(false);
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

        {/* First-Time Setup Alert */}
        {isUnconfigured && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Initial System Setup Required</span>
            </div>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              No root Administrator account has been provisioned yet. Set up your Admin identity with verified email OTP or direct setup.
            </p>
            <Link
              href="/config"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 underline pt-1"
            >
              <span>Go to /config Setup Page →</span>
            </Link>
          </div>
        )}

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

          {/* Administrator Default Credentials Info Badge */}
          {selectedRole === 'ADMIN' && (
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center justify-between text-foreground font-medium">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <KeyRound className="w-3.5 h-3.5" />
                  Default Administrator Credentials
                </span>
                <button
                  type="button"
                  onClick={handleResetAdmin}
                  disabled={isResetting}
                  className="text-[10px] text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                >
                  <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>Reset Admin</span>
                </button>
              </div>
              <p className="font-mono text-[10px] text-gray-300">
                Email: <span className="text-white">admin@devtushar.uk</span> • Pass: <span className="text-white">Admin@123456</span>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              label="Staff Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedRole === 'ADMIN' ? 'admin@devtushar.uk' : 'manager@devtushar.uk'}
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
              hint={selectedRole === 'ADMIN' ? 'Default root password: Admin@123456' : undefined}
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

          {/* Quick Actions & Links */}
          <div className="pt-3 border-t border-border/40 flex flex-col gap-2 text-center text-xs">
            {selectedRole === 'ADMIN' && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <Link href="/config" className="text-primary hover:underline font-medium">
                  Set Custom Admin Password (/config)
                </Link>
                <button
                  type="button"
                  onClick={handleResetAdmin}
                  disabled={isResetting}
                  className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                >
                  Reset Admin to Default
                </button>
              </div>
            )}

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
