'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  KeyRound,
  ArrowLeft,
  Sparkles,
  Building,
  Check,
} from 'lucide-react';
import { BRAND_NAME } from '@/lib/constants/brand';

function ManagerJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialToken = searchParams.get('token') || '';
  const initialEmail = searchParams.get('email') || '';

  // Invitation Verification State
  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState(initialEmail);
  const [isCheckingInvite, setIsCheckingInvite] = useState(true);
  const [inviteData, setInviteData] = useState<{
    id: string;
    name: string;
    email: string;
    department: string;
    permissions: string[];
    invitedAt: string;
  } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Joining Flow Steps: 'VERIFY_IDENTITY' -> 'ENTER_OTP' -> 'SUCCESS'
  const [step, setStep] = useState<'VERIFY_IDENTITY' | 'ENTER_OTP' | 'SUCCESS'>('VERIFY_IDENTITY');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const checkInvite = async (t: string, em: string) => {
    setIsCheckingInvite(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/manager/join?token=${encodeURIComponent(t)}&email=${encodeURIComponent(em)}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setInviteError(
          data.error || 'Access Denied: This email address has not been invited by an Administrator.'
        );
        setInviteData(null);
      } else {
        setInviteData(data.invite);
        setEmail(data.invite.email);
        setInviteError(null);
      }
    } catch {
      setInviteError('Failed to verify invitation status. Please check your internet connection.');
    } finally {
      setIsCheckingInvite(false);
    }
  };

  useEffect(() => {
    if (initialToken || initialEmail) {
      checkInvite(initialToken, initialEmail);
    } else {
      setIsCheckingInvite(false);
    }
  }, [initialToken, initialEmail]);

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      setInviteError('Please provide both your invitation token and authorized email.');
      return;
    }
    checkInvite(token, email);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/manager/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_OTP',
          token,
          email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code');
      }

      setSuccessMsg(data.message || `Verification passcode dispatched to ${email}`);
      setStep('ENTER_OTP');
    } catch (err: any) {
      setActionError(err.message || 'Error requesting verification passcode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/manager/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_JOIN',
          token,
          email,
          otp,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Passcode verification failed');
      }

      setStep('SUCCESS');
      setTimeout(() => {
        router.replace('/manager');
      }, 1500);
    } catch (err: any) {
      setActionError(err.message || 'Failed to verify manager code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0d0f12] text-white">
      {/* Background Lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0071e3]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Staff Portal Login</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="p-6 sm:p-8 rounded-[28px] bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner mb-1">
              <Building className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Join Management Team
            </h1>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Administrator-authorized onboarding for {BRAND_NAME} Operations Managers.
            </p>
          </div>

          {/* Loading Checking State */}
          {isCheckingInvite && (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
              <p className="text-xs text-gray-400">Verifying administrator invitation security credentials...</p>
            </div>
          )}

          {/* Error: Email Not Invited */}
          {!isCheckingInvite && inviteError && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
                <AlertCircle className="w-7 h-7 text-rose-400 mx-auto" />
                <h4 className="text-xs font-semibold text-rose-200">Unauthorized Invitation</h4>
                <p className="text-xs text-rose-300 leading-relaxed">{inviteError}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-gray-400 space-y-1.5">
                <p className="font-semibold text-gray-300">Why am I seeing this?</p>
                <p>• Only email addresses specifically registered and invited by an Administrator can join as Managers.</p>
                <p>• Ensure you opened the exact link sent to your invited corporate email address.</p>
              </div>

              {/* Form to retry / re-enter token and email */}
              <form onSubmit={handleManualCheck} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-400">Authorized Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@domain.com"
                    className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-400">Invitation Token</label>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste 48-character invite token"
                    className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all cursor-pointer"
                >
                  Re-Verify Credentials
                </button>
              </form>
            </div>
          )}

          {/* Valid Invitation Flow */}
          {!isCheckingInvite && inviteData && (
            <div className="space-y-5 animate-in fade-in">
              {/* Invitation Summary Card */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Administrator Authorization Verified</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                    {inviteData.department}
                  </span>
                </div>
                <div className="text-xs text-gray-300 pt-1 space-y-1">
                  <p>
                    Invited Name: <strong className="text-white">{inviteData.name}</strong>
                  </p>
                  <p>
                    Authorized Email: <span className="font-mono text-amber-200">{inviteData.email}</span>
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {successMsg && step === 'ENTER_OTP' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* STEP 1: Set Password & Request Code */}
              {step === 'VERIFY_IDENTITY' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Choose Manager Account Password</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters (for direct login)"
                      className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <p className="text-[11px] text-gray-400">
                    To verify your ownership of <strong className="text-white">{inviteData.email}</strong>, we will email a 6-digit one-time security passcode.
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading || password.length < 6}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit Verification Code to Email</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter OTP Code */}
              {step === 'ENTER_OTP' && (
                <form onSubmit={handleVerifyJoin} className="space-y-5 animate-in fade-in">
                  <div className="space-y-2 text-center">
                    <label className="text-xs font-medium text-gray-300 block">
                      Enter 6-Digit Activation Code sent to:
                    </label>
                    <span className="font-mono text-xs text-amber-400 font-semibold block">{email}</span>
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
                      className="w-full h-14 text-center tracking-[12px] font-mono text-2xl font-bold rounded-2xl bg-white/5 border border-white/20 text-white focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <button
                      type="button"
                      onClick={() => setStep('VERIFY_IDENTITY')}
                      className="hover:text-white underline cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleSendOtp}
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      Resend Passcode
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
                        <span>Activating Manager Account...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Verify &amp; Launch Manager Console</span>
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
                  <h3 className="text-base font-semibold text-white">Welcome, {inviteData.name}!</h3>
                  <p className="text-xs text-gray-400">
                    Your Manager account is active. Redirecting you to the Operations Console...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Prompt if no parameters supplied */}
          {!isCheckingInvite && !inviteData && !inviteError && (
            <form onSubmit={handleManualCheck} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 space-y-1">
                <p className="font-medium text-white">Invited to join management?</p>
                <p>Enter the corporate email address that received the invitation from the Administrator.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@ganeshmule.com"
                  className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Invitation Token</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste invite token from invitation email"
                  className="w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Verify Invitation Status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-white/10 text-center">
            <p className="text-[11px] text-gray-500">
              Ganesh Mule Pure Honey • Secure Staff Onboarding Protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManagerJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="dark min-h-screen flex items-center justify-center bg-[#0d0f12] text-white">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      }
    >
      <ManagerJoinContent />
    </Suspense>
  );
}
