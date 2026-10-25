'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants/brand';

export default function AdminConfigPage() {
  const router = useRouter();

  // Page States
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isAlreadyConfigured, setIsAlreadyConfigured] = useState(false);
  const [configuredEmail, setConfiguredEmail] = useState<string | null>(null);
  const [showReconfigureForm, setShowReconfigureForm] = useState(false);

  // Mode: 'DIRECT' (Instant setup without OTP) vs 'EMAIL_OTP'
  const [setupMode, setSetupMode] = useState<'DIRECT' | 'EMAIL_OTP'>('DIRECT');

  // Setup Form States
  const [step, setStep] = useState<'DETAILS' | 'OTP' | 'SUCCESS'>('DETAILS');
  const [name, setName] = useState('Tushar');
  const [email, setEmail] = useState('manager@devtushar.uk');
  const [phone, setPhone] = useState('+91 98220 00000');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Execution States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if admin is already configured on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/admin/setup', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.configured) {
            setIsAlreadyConfigured(true);
            setConfiguredEmail(data.adminEmail || null);
          }
        }
      } catch {}
      setCheckingStatus(false);
    }
    checkStatus();
  }, []);

  // Direct setup: save password directly without OTP
  const handleDirectSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DIRECT_SETUP',
          name,
          email,
          phone,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to configure administrator password');
      }

      setStep('SUCCESS');
      setSuccessMessage(data.message || 'Password saved successfully! Launching Admin Console...');
      setTimeout(() => {
        window.location.href = '/admin';
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating administrator password');
      setIsLoading(false);
    }
  };

  // Dispatch OTP via Resend
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_OTP',
          name,
          email,
          phone,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch security code');
      }

      setSuccessMessage(data.message || `Verification passcode sent to ${email} (Fallback: 123456)`);
      setStep('OTP');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during verification dispatch');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_OTP',
          email,
          otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP code');
      }

      setStep('SUCCESS');
      setTimeout(() => {
        window.location.href = '/admin';
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Try master code: 123456');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-[#0d0f12] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0071e3] animate-spin" />
          <p className="text-xs text-gray-400">Verifying system deployment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0d0f12] text-white">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#0071e3]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Return to Store */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Store</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="p-6 sm:p-8 rounded-[28px] bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl space-y-5">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0071e3]/10 border border-[#0071e3]/30 text-[#0071e3] shadow-inner mb-1">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isAlreadyConfigured && !showReconfigureForm ? 'System Configured' : 'Administrator Configuration'}
            </h1>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              {isAlreadyConfigured && !showReconfigureForm
                ? `An Administrator account is active (${configuredEmail || 'admin@devtushar.uk'}).`
                : `Set or update root Administrator credentials for ${BRAND_NAME}.`}
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Already Configured State */}
          {isAlreadyConfigured && !showReconfigureForm ? (
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs text-gray-300 leading-relaxed">
                  Root Administrator account is active for <span className="font-mono text-white font-semibold">{configuredEmail}</span>.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <Link
                  href="/portal"
                  className="w-full py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold text-center transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Go to Staff Portal Login</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowReconfigureForm(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium text-center transition-all border border-white/10 cursor-pointer"
                >
                  Change / Update Administrator Credentials
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Setup Mode Selector */}
              {step === 'DETAILS' && (
                <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setSetupMode('DIRECT')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      setupMode === 'DIRECT'
                        ? 'bg-[#0071e3] text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Instant Setup (No OTP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSetupMode('EMAIL_OTP')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      setupMode === 'EMAIL_OTP'
                        ? 'bg-[#0071e3] text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email OTP</span>
                  </button>
                </div>
              )}

              {/* STEP 1: Enter Details */}
              {step === 'DETAILS' && (
                <form
                  onSubmit={setupMode === 'DIRECT' ? handleDirectSetup : handleSendOtp}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Administrator Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tushar"
                      className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#0071e3] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Administrator Email</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@devtushar.uk"
                      className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#0071e3] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Mobile Number</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98220 00000"
                      className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#0071e3] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#0071e3]" />
                        <span>Set Account Password</span>
                      </span>
                      <span className="text-[10px] text-gray-400">Min 6 characters</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. Admin@123456 or custom"
                      className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#0071e3] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Configuration...</span>
                      </>
                    ) : setupMode === 'DIRECT' ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Save Password &amp; Launch Admin Console</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit Email Verification Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter OTP */}
              {step === 'OTP' && (
                <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in">
                  <div className="space-y-2 text-center">
                    <label className="text-xs font-medium text-gray-300 block">
                      Enter 6-Digit Verification Code sent to:
                    </label>
                    <span className="font-mono text-xs text-amber-400 font-semibold block">{email}</span>
                    <p className="text-[11px] text-gray-400">
                      (Master bypass passcode: <span className="font-mono text-white font-bold">123456</span>)
                    </p>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full h-14 text-center tracking-[12px] font-mono text-2xl font-bold rounded-2xl bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#0071e3] focus:bg-white/10 transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <button
                      type="button"
                      onClick={() => setStep('DETAILS')}
                      className="hover:text-white underline cursor-pointer"
                    >
                      ← Back to Details
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleSendOtp}
                      className="text-[#0071e3] hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Security Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify Identity &amp; Launch Admin Console</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3: Success Screen */}
              {step === 'SUCCESS' && (
                <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Administrator Configured!</h3>
                  <p className="text-xs text-gray-400">
                    Session verified. Redirecting you to the Administrator Governance Console...
                  </p>
                </div>
              )}
            </>
          )}

          {/* Privacy Note */}
          <div className="pt-2 border-t border-white/10 text-center">
            <p className="text-[11px] text-gray-500">
              Identity verification powered by devtushar.uk • Secure HMAC-SHA256 session encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
