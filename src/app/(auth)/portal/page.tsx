'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import {
  ShieldCheck,
  UserCheck,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LogOut,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { SafeUser } from '@/types';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

function StaffPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectTarget = rawRedirect ? decodeURIComponent(rawRedirect) : '';
  const urlError = searchParams.get('error');
  const urlMessage = searchParams.get('message');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    urlMessage || (urlError === 'unauthorized' ? 'Administrator or Developer privileges required.' : null)
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<SafeUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // Check existing session
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
          // If already authenticated and there is an explicit target, auto-redirect
          if (redirectTarget) {
            window.location.href = redirectTarget;
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [redirectTarget]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setActiveSession(null);
      setSuccessMessage('Signed out successfully.');
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const role = data.user?.role || 'STAFF';
      setSuccessMessage(`Verified as ${role}. Launching console...`);

      // Determine smart dashboard landing page
      let target = redirectTarget;
      if (!target) {
        if (role === 'DEVELOPER') target = '/developer';
        else if (role === 'ADMIN') target = '/admin';
        else target = '/manager';
      }

      setTimeout(() => {
        window.location.href = target;
      }, 250);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  const getDashboardDestination = (role?: string) => {
    if (redirectTarget) return redirectTarget;
    if (role === 'DEVELOPER') return '/developer';
    if (role === 'ADMIN') return '/admin';
    return '/manager';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-background text-foreground transition-colors">
      {/* Ambient Lighting Gradients */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand/10 dark:bg-brand/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Return to Storefront Header */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground glass-control px-3.5 py-2 rounded-control transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Store</span>
        </Link>
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl glass-primary shadow-lg mb-1">
            <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Staff Console
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Developer • Administrator • Store Operations
          </p>
        </div>

        {/* Existing Active Session Card */}
        {activeSession && (
          <GlassCard variant="card" className="p-5 space-y-3.5 border border-primary/20 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full glass-control flex items-center justify-center font-bold text-xs text-foreground">
                  {activeSession.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-xs text-foreground leading-none">{activeSession.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{activeSession.email}</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-semibold border border-primary/20">
                {activeSession.role}
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.location.href = getDashboardDestination(activeSession.role);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <span>Enter {activeSession.role === 'DEVELOPER' ? 'Developer' : activeSession.role === 'ADMIN' ? 'Admin' : 'Manager'} Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-3 rounded-xl glass-control hover:bg-destructive/15 text-destructive text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Sign out of current account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </GlassCard>
        )}

        {/* Main Login Card */}
        <GlassCard variant="card" className="p-6 sm:p-7 space-y-5 shadow-2xl">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/15 text-destructive text-xs flex items-start gap-2.5 border border-destructive/20 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-xs flex items-start gap-2.5 border border-emerald-500/25 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* 1-Click Fast Google Sign-In */}
          <div className="space-y-2">
            <GoogleSignInButton
              label="Continue with Google"
              redirect={redirectTarget || undefined}
              variant="glass"
              className="w-full text-foreground shadow-sm"
            />
            <p className="text-[11px] text-center text-muted-foreground">
              Instant login for authorized Developer, Admin, or Manager Google accounts
            </p>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-card px-3 text-muted-foreground font-semibold tracking-wider">
                Or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              label="Staff Email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="name@ganeshmule.com"
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <div className="relative">
                <GlassInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full font-semibold shadow-md"
              >
                Sign In to Console
              </GlassButton>
            </div>
          </form>
        </GlassCard>

        {/* Security Footer */}
        <p className="text-center text-[11px] text-muted-foreground">
          Protected by cryptographic HMAC sessions &amp; tamper-proof audit trails.
        </p>
      </div>
    </div>
  );
}

export default function StaffPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <StaffPortalContent />
    </Suspense>
  );
}
