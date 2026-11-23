'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Power,
  Trash2,
  Plus,
  ShieldCheck,
  Clock,
  Radio,
  FileText,
  Boxes,
  Truck,
  DollarSign,
  Info,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { WhatsAppServiceStatus, WhatsAppMessageLog, WhatsAppAlertSettings } from '@/types/whatsapp';

export default function WhatsAppManagementPage() {
  const [status, setStatus] = useState<WhatsAppServiceStatus | null>(null);
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Connection method tab: 'qr' | 'pairing'
  const [linkTab, setLinkTab] = useState<'qr' | 'pairing'>('qr');

  // Pairing code state
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Recipient input
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-poll status when waiting for QR or connecting
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatusAndLogs = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/status');
      const data = await res.json();
      if (data.success && data.status) {
        setStatus((prev) => {
          // If server returned DISCONNECTED with no QR, but client already has a valid QR code, preserve it
          if (!data.status.qrCodeDataUrl && prev?.qrCodeDataUrl && prev?.state === 'SCAN_QR_CODE' && data.status.state !== 'CONNECTED') {
            return {
              ...data.status,
              qrCodeDataUrl: prev.qrCodeDataUrl,
              state: 'SCAN_QR_CODE',
            };
          }
          return data.status;
        });
        if (data.logs) setLogs(data.logs);
      }
    } catch (err) {
      console.warn('Failed to fetch WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndLogs();

    // Fast polling (2.5s) when waiting for scan, otherwise regular 5s
    const intervalMs = status?.state === 'SCAN_QR_CODE' || status?.state === 'CONNECTING' ? 2500 : 5000;
    pollTimerRef.current = setInterval(() => {
      fetchStatusAndLogs();
    }, intervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [status?.state]);

  const handleConnect = async () => {
    setActionLoading(true);
    setPairingCode(null);
    setPairingError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/connect', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.status) {
        setStatus(data.status);
      } else if (data.error) {
        alert(`Error initiating connection: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to start connection: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async (logout = false) => {
    if (logout && !confirm('Are you sure you want to log out this WhatsApp device? You will need to link it again.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logout }),
      });
      const data = await res.json();
      if (data.success && data.status) {
        setStatus(data.status);
      }
    } catch (err: any) {
      alert(`Failed to disconnect: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pairingPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setPairingError('Please enter a valid 10-digit mobile number with country code (e.g. 919876543210).');
      return;
    }

    setPairingLoading(true);
    setPairingError(null);
    setPairingCode(null);

    try {
      const res = await fetch('/api/admin/whatsapp/pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: clean.length === 10 ? `91${clean}` : clean }),
      });
      const data = await res.json();
      if (data.success && data.pairingCode) {
        setPairingCode(data.pairingCode);
      } else {
        setPairingError(data.error || 'Failed to generate pairing code');
      }
    } catch (err: any) {
      setPairingError(err.message || 'Error communicating with server');
    } finally {
      setPairingLoading(false);
      fetchStatusAndLogs();
    }
  };

  const handleCopyCode = (code: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSaveSettings = async (updates: Partial<WhatsAppAlertSettings>) => {
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/admin/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setStatus((prev) => (prev ? { ...prev, settings: data.settings } : prev));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddPhoneNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPhoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      alert('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    const full = clean.length === 10 ? `91${clean}` : clean;
    const current = status?.settings.adminPhoneNumbers || [];
    if (current.includes(full)) {
      alert('Phone number already added.');
      return;
    }

    handleSaveSettings({ adminPhoneNumbers: [...current, full] });
    setNewPhoneInput('');
  };

  const handleRemovePhoneNumber = (phone: string) => {
    const current = status?.settings.adminPhoneNumbers || [];
    handleSaveSettings({ adminPhoneNumbers: current.filter((p) => p !== phone) });
  };

  const handleSendTestMessage = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setTestResult({
        success: Boolean(data.success),
        message: data.message || (data.success ? 'Live test message sent successfully to operations phones!' : 'Test message failed to deliver.'),
      });
      fetchStatusAndLogs();
    } catch (err: any) {
      setTestResult({ success: false, message: `Test ping error: ${err.message}` });
    } finally {
      setTestSending(false);
    }
  };

  const state = status?.state || 'DISCONNECTED';
  const isConnected = state === 'CONNECTED';
  const isConnecting = state === 'CONNECTING' || actionLoading;
  const hasQrCode = Boolean(status?.qrCodeDataUrl);
  const activePairingCode = pairingCode || status?.pairingCode;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Apple-Style Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <Smartphone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
                  WhatsApp Operations Bot
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-[10px] font-bold text-stone-600 tracking-wide uppercase border border-stone-200">
                  Baileys Multi-Device
                </span>
              </div>
              <p className="text-xs text-[#86868b] mt-0.5">
                Internal Operations &amp; Management Control Centre • Real-Time Order &amp; Logistics Alerts
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Pill & Controls */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : hasQrCode || isConnecting
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : hasQrCode || isConnecting
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-stone-400'
              }`}
            />
            <span>
              {isConnected
                ? 'Connected • Live Alerts Active'
                : hasQrCode
                ? 'QR Code Ready to Scan'
                : isConnecting
                ? 'Connecting to WhatsApp...'
                : 'Bot Disconnected'}
            </span>
          </div>

          <GlassButton
            onClick={fetchStatusAndLogs}
            disabled={actionLoading}
            size="sm"
            variant="ghost"
            className="flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 border border-stone-200 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </GlassButton>
        </div>
      </div>

      {/* Internal Management Scope Notice Banner */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-stone-50/50 to-amber-50/80 border border-emerald-200/80 rounded-2xl p-4 text-xs text-stone-800 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-stone-900 flex items-center gap-1.5">
            <span>Authoritative Internal Operations Scope</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">100% Internal</span>
          </p>
          <p className="text-stone-600 leading-relaxed text-[11px]">
            This bot transmits live operational notifications (paid Razorpay orders, Delhivery tracking links, warehouse alerts, and midnight audits) <strong>strictly to authorized management phone numbers</strong>. Customer-facing WhatsApp messaging remains completely inactive.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Device Link & QR Display (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 space-y-6 bg-white border border-[#d2d2d7]/70 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Device Link</span>
              </h2>
              {isConnected && (
                <GlassBadge variant="success" className="text-[10px]">
                  Linked Session Active
                </GlassBadge>
              )}
            </div>

            {/* TAB SWITCHER: QR CODE vs PAIRING CODE (Only when not connected) */}
            {!isConnected && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-2xl border border-stone-200/70 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLinkTab('qr')}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    linkTab === 'qr'
                      ? 'bg-white text-[#1d1d1f] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLinkTab('pairing')}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    linkTab === 'pairing'
                      ? 'bg-white text-[#1d1d1f] shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Pairing Code</span>
                </button>
              </div>
            )}

            {/* STATE 1: CONNECTED */}
            {isConnected ? (
              <div className="text-center py-4 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-4 border-emerald-50 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Multi-Device Session
                  </span>
                  <h3 className="text-base font-bold text-[#1d1d1f] pt-1">
                    {status?.userName || 'Operations Desk Device'}
                  </h3>
                  <p className="text-xs font-mono text-emerald-800 font-bold">
                    +{status?.userPhone || 'Linked Phone'}
                  </p>
                  <p className="text-[11px] text-[#86868b] pt-0.5">
                    Connected: {status?.lastConnectedAt ? new Date(status.lastConnectedAt).toLocaleString('en-IN') : 'Live'}
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <GlassButton
                    onClick={handleSendTestMessage}
                    disabled={testSending}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl py-2.5 shadow-sm"
                  >
                    <Send className={`w-4 h-4 ${testSending ? 'animate-spin' : ''}`} />
                    <span>{testSending ? 'Sending Operational Ping...' : 'Send Live Test Ping'}</span>
                  </GlassButton>

                  <GlassButton
                    onClick={() => handleDisconnect(true)}
                    disabled={actionLoading}
                    variant="ghost"
                    className="w-full text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-2xl py-2"
                  >
                    <Power className="w-3.5 h-3.5 mr-1" />
                    <span>Unlink &amp; Log Out Device</span>
                  </GlassButton>
                </div>
              </div>
            ) : linkTab === 'qr' ? (
              /* TAB: QR CODE */
              hasQrCode ? (
                /* STATE 2: ACTIVE QR CODE READY TO SCAN */
                <div className="text-center py-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative inline-block p-4 bg-white border-2 border-stone-200 rounded-3xl shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={status!.qrCodeDataUrl}
                      alt="Scan WhatsApp QR Code"
                      className="w-60 h-60 mx-auto rounded-xl object-contain block"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>Live QR</span>
                    </div>
                  </div>

                  <div className="text-xs text-stone-600 bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 text-left space-y-2">
                    <p className="font-bold text-[#1d1d1f] flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Scan with WhatsApp on your phone:</span>
                    </p>
                    <ol className="list-decimal pl-5 text-[11px] space-y-1 text-stone-600">
                      <li>Open <strong>WhatsApp</strong> on your mobile phone</li>
                      <li>Tap <strong>Settings</strong> (or ⋮ menu) &gt; <strong>Linked Devices</strong></li>
                      <li>Tap <strong>Link a Device</strong></li>
                      <li>Point your phone camera directly at the QR code above</li>
                    </ol>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={actionLoading}
                      className="flex-1 py-2 px-3 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin text-emerald-600' : ''}`} />
                      <span>{actionLoading ? 'Refreshing...' : 'Regenerate QR Code'}</span>
                    </button>
                  </div>
                </div>
              ) : isConnecting ? (
                /* STATE 3: GENERATING QR CODE */
                <div className="text-center py-10 space-y-4 animate-in fade-in">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 text-emerald-600 mx-auto flex items-center justify-center relative">
                    <QrCode className="w-10 h-10 animate-pulse text-emerald-600" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#1d1d1f]">Generating WhatsApp QR Code</h3>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto">
                      Connecting to WhatsApp Web Multi-Device servers. The QR code will render here in a moment...
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-[11px] font-semibold text-stone-600">
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                      <span>Awaiting Multi-Device handshake...</span>
                    </span>
                  </div>
                </div>
              ) : (
                /* STATE 4: DISCONNECTED / READY TO GENERATE */
                <div className="text-center py-8 space-y-5">
                  <div className="w-16 h-16 rounded-3xl bg-stone-100 text-stone-600 mx-auto flex items-center justify-center border border-stone-200 shadow-xs">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#1d1d1f]">Link Operations WhatsApp</h3>
                    <p className="text-xs text-[#86868b] max-w-xs mx-auto">
                      Connect any dedicated manager or desk WhatsApp number to receive immediate solid glass order alerts and logistics tracking links.
                    </p>
                  </div>

                  <GlassButton
                    onClick={handleConnect}
                    disabled={actionLoading}
                    className="w-full bg-[#1d1d1f] text-white hover:bg-[#2d2d2f] py-3 rounded-2xl flex items-center justify-center gap-2 shadow-sm"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>{actionLoading ? 'Connecting & Generating QR...' : 'Show QR Code to Link'}</span>
                  </GlassButton>
                </div>
              )
            ) : (
              /* TAB: PAIRING CODE */
              <div className="py-2 space-y-4 animate-in fade-in">
                <div className="text-xs text-stone-600 space-y-1">
                  <p className="font-bold text-[#1d1d1f]">Link without scanning QR code</p>
                  <p className="text-[11px] text-stone-500">
                    Enter the phone number of the operations WhatsApp device. You will receive an 8-character code to enter on your phone.
                  </p>
                </div>

                <form onSubmit={handleRequestPairingCode} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-stone-700">Phone Number (with Country Code):</label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="e.g. 919876543210"
                        value={pairingPhone}
                        onChange={(e) => setPairingPhone(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3] bg-stone-50/50"
                      />
                      <button
                        type="submit"
                        disabled={pairingLoading}
                        className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        {pairingLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Get Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  {pairingError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{pairingError}</span>
                    </div>
                  )}
                </form>

                {activePairingCode && (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-2 animate-in zoom-in-95">
                    <p className="text-[10px] text-emerald-800 uppercase tracking-wider font-bold">Your 8-Character Pairing Code</p>
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-2xl font-mono font-bold tracking-widest text-[#1d1d1f] bg-white px-4 py-1.5 rounded-xl border border-emerald-200 shadow-xs">
                        {activePairingCode}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(activePairingCode)}
                        className="p-2 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 transition-colors cursor-pointer shadow-xs"
                        title="Copy code"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    {copiedCode && <p className="text-[10px] text-emerald-600 font-semibold">Copied to clipboard!</p>}
                    <div className="text-[11px] text-stone-600 bg-white/70 p-2.5 rounded-xl border border-emerald-100 text-left">
                      <p className="font-semibold text-stone-800">Next Steps:</p>
                      <p>Open WhatsApp &gt; <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong> &gt; Tap <strong>&quot;Link with phone number instead&quot;</strong> &gt; Enter this code.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Test Ping Result Alert */}
            {testResult && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-start gap-2 border animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{testResult.success ? 'Success' : 'Notice'}</p>
                  <p className="text-[11px] mt-0.5">{testResult.message}</p>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Alert Rules & Recipients (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Master Enable & Alert Rules */}
          <GlassCard className="p-6 space-y-6 bg-white border border-[#d2d2d7]/70 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>Operational Event Subscriptions</span>
                </h2>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Select which operations events automatically trigger instant WhatsApp alerts to your management team.
                </p>
              </div>

              {saveSuccess && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved
                </span>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Event 1: New Paid Orders */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer border border-stone-100 hover:border-stone-200">
                <input
                  type="checkbox"
                  checked={status?.settings.notifyNewOrders ?? true}
                  onChange={(e) => handleSaveSettings({ notifyNewOrders: e.target.checked })}
                  disabled={savingSettings}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-600"
                />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>📦 New Customer Orders (Paid via Razorpay)</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Dispatches customer name, purchased jar variants, ₹ total amount, delivery PIN code, and solid glass packing requirements immediately upon successful payment.
                  </p>
                </div>
              </label>

              {/* Event 2: Delhivery Consignment Dispatches */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer border border-stone-100 hover:border-stone-200">
                <input
                  type="checkbox"
                  checked={status?.settings.notifyDispatches ?? true}
                  onChange={(e) => handleSaveSettings({ notifyDispatches: e.target.checked })}
                  disabled={savingSettings}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-600"
                />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>🚚 Delhivery AWB Consignment Dispatches</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Sends allocated AWB waybill number, courier mode (Surface/Express), destination hub, and direct Delhivery tracking URL for immediate consignment pickup.
                  </p>
                </div>
              </label>

              {/* Event 3: Low Inventory Warnings */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer border border-stone-100 hover:border-stone-200">
                <input
                  type="checkbox"
                  checked={status?.settings.notifyLowStock ?? true}
                  onChange={(e) => handleSaveSettings({ notifyLowStock: e.target.checked })}
                  disabled={savingSettings}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-600"
                />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>📉 Warehouse Low-Stock Alerts</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Alerts operations whenever any raw honey jar variant dips below the safety threshold of 10 jars in Pune storage.
                  </p>
                </div>
              </label>

              {/* Event 4: 12:30 AM IST Reconcile Summary */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer border border-stone-100 hover:border-stone-200">
                <input
                  type="checkbox"
                  checked={status?.settings.notifyWarehouseReconcile ?? true}
                  onChange={(e) => handleSaveSettings({ notifyWarehouseReconcile: e.target.checked })}
                  disabled={savingSettings}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-600"
                />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>🌙 12:30 AM IST Warehouse Reconcile Summary</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Sends a complete midnight audit summary of reconciled orders, gross revenue collected, and inventory sync logs to the management team.
                  </p>
                </div>
              </label>

              {/* Event 5: Delhivery Wallet Warning */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl hover:bg-stone-50/80 transition-colors cursor-pointer border border-stone-100 hover:border-stone-200">
                <input
                  type="checkbox"
                  checked={status?.settings.notifyWalletLowBalance ?? true}
                  onChange={(e) => handleSaveSettings({ notifyWalletLowBalance: e.target.checked })}
                  disabled={savingSettings}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-600"
                />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>💳 Delhivery One Prepaid Wallet Low-Balance Notice</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                    Notifies managers if one.delhivery.com prepaid balance falls below ₹500 to ensure consignment generation is never interrupted.
                  </p>
                </div>
              </label>
            </div>
          </GlassCard>

          {/* Admin Recipient Phone Numbers */}
          <GlassCard className="p-6 space-y-4 bg-white border border-[#d2d2d7]/70 rounded-3xl shadow-sm">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Authorized Management Recipients</span>
              </h2>
              <p className="text-xs text-[#86868b] mt-0.5">
                Staff WhatsApp numbers receiving operational alerts. Enter standard 10-digit number (e.g. 9876543210).
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(status?.settings.adminPhoneNumbers || []).map((phone) => (
                <span
                  key={phone}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 text-stone-800 font-mono text-xs font-semibold border border-stone-200 shadow-xs"
                >
                  <span>+{phone}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoneNumber(phone)}
                    className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer ml-1"
                    title="Remove recipient"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddPhoneNumber} className="flex gap-2 pt-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-stone-400 text-xs font-mono">+91</span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={newPhoneInput}
                  onChange={(e) => setNewPhoneInput(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3] bg-stone-50/50"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Number</span>
              </button>
            </form>
          </GlassCard>
        </div>
      </div>

      {/* Message Dispatch Audit Log */}
      <GlassCard className="p-6 space-y-4 bg-white border border-[#d2d2d7]/70 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Recent Operational Dispatch Log</span>
            </h2>
            <p className="text-xs text-[#86868b] mt-0.5">
              Authoritative audit trail of WhatsApp messages transmitted to the management team.
            </p>
          </div>
          <span className="text-xs text-stone-500 font-mono bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
            {logs.length} logged events
          </span>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-stone-400 py-6 text-center">
            No WhatsApp messages dispatched yet. Link your device and click &quot;Send Live Test Ping&quot; to test.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 text-[11px]">
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Alert Type</th>
                  <th className="py-2.5 px-3 font-semibold">Recipient</th>
                  <th className="py-2.5 px-3 font-semibold">Message Preview</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-sans text-[10px] font-bold">
                        {log.alertType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 whitespace-nowrap">
                      +{log.recipient}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 font-sans text-xs max-w-md truncate">
                      {log.preview}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                          log.status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : log.status === 'SKIPPED_DISCONNECTED'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {log.status === 'SENT' ? 'Delivered' : log.status === 'SKIPPED_DISCONNECTED' ? 'Logged (Offline)' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
