'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { Sparkles, ArrowRight, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DirectManagerLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleInstantLogin = async () => {
    setIsLoading(true);
    setStatusText('Authenticating Operations Manager session...');
    setErrorText(null);

    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'manager@devtushar.uk',
          password: 'Manager@123456',
          expectedRole: 'MANAGER',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setStatusText('✓ Verified. Launching Order Queue & Fulfillment Desk...');
      setTimeout(() => {
        window.location.href = '/manager/orders';
      }, 300);
    } catch (err: any) {
      setErrorText(err.message || 'Direct login failed');
      setIsLoading(false);
    }
  };

  // Auto-attempt login on mount for ultimate zero-friction 1-click experience
  useEffect(() => {
    // Check if user is already logged in
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && (data.user?.role === 'MANAGER' || data.user?.role === 'ADMIN')) {
          window.location.href = '/manager/orders';
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="dark min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl glass-primary shadow-lg mb-1">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manager Orders Desk
          </h1>
          <p className="text-xs text-muted-foreground">
            Direct 1-Click Operations Access &amp; Fulfillment Queue
          </p>
        </div>

        <GlassCard variant="card" className="p-6 space-y-4 shadow-2xl">
          {errorText && (
            <div className="p-3 rounded-xl bg-destructive/15 text-destructive text-xs flex items-start gap-2 border border-destructive/20 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          {statusText && (
            <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs flex items-start gap-2 border border-emerald-500/25 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{statusText}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Account:</span>
              <strong className="text-foreground">Operations Manager</strong>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Email:</span>
              <span className="font-mono text-[11px] text-foreground">manager@devtushar.uk</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Destination:</span>
              <span className="font-mono text-[11px] text-amber-400">/manager/orders</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstantLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:brightness-110 text-slate-950 font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            <span>{isLoading ? 'Connecting to Queue...' : '⚡ Enter Manager Orders Desk'}</span>
          </button>

          <div className="text-center pt-2">
            <Link
              href="/portal"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>Back to Staff Portal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
