'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassButton } from '@/components/ui/glass-button';
import { Mail, KeyRound, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { BRAND_NAME, BRAND_SHORT } from '@/lib/constants/brand';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'ENTER_EMAIL' | 'ENTER_OTP'>('ENTER_EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('ENTER_OTP');
      setSuccessMessage(`A 6-digit verification code has been sent to ${email.trim()}`);
      startCooldown();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to send passcode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit code received on your email');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired verification code');
      }

      router.push('/account');
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Return to Storefront */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] px-3 py-1.5 rounded-full bg-white border border-[#d2d2d7] shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Store</span>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm mb-1 text-amber-700">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            Customer Account Access
          </h1>
          <p className="text-xs text-[#6e6e73] max-w-sm mx-auto">
            Passwordless sign-in for order tracking, courier status &amp; official tax invoices
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[24px] border border-[#d2d2d7]/70 p-6 sm:p-7 shadow-xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-start gap-2 border border-rose-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && !errorMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs flex items-start gap-2 border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {step === 'ENTER_EMAIL' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#1d1d1f] flex items-center justify-between">
                  <span>Enter Your Email Address</span>
                  <span className="text-[10px] text-[#86868b]">OTP will be sent here</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    autoFocus
                    className="w-full h-11 px-3.5 pl-10 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/60 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                  />
                  <Mail className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full h-11 rounded-[12px] bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Passcode...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                      <span>Send One-Time Passcode</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-[#86868b]">
                  Use the email address you used during checkout to automatically see all your past orders.
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#1d1d1f]">
                    Enter 6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('ENTER_EMAIL');
                      setOtp('');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-[#0071e3] hover:underline cursor-pointer"
                  >
                    Change email
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••••"
                    autoFocus
                    className="w-full h-12 text-center text-xl font-mono font-bold tracking-[6px] rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/60 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#86868b] text-center">
                  Check inbox for <strong>{email}</strong>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || otp.trim().length < 6}
                  className="w-full h-11 rounded-[12px] bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verify &amp; Open My Orders</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resend button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleSendOtp}
                  className="text-xs text-[#0071e3] hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't receive code? Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* Trust and Policy footer */}
          <div className="pt-4 border-t border-[#d2d2d7]/50 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Encrypted Passwordless Authentication</span>
            </div>
          </div>
        </div>

        {/* Staff portal link */}
        <div className="text-center space-y-1">
          <Link
            href="/portal"
            className="text-xs text-[#86868b] hover:text-[#1d1d1f] underline underline-offset-4"
          >
            Staff &amp; Operations Portal (Admin / Manager) →
          </Link>
        </div>
      </div>
    </div>
  );
}
