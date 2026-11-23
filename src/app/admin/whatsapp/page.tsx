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
  const [testResult, setTestResult] = useState<string | null>(null);

  // Pairing code state
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

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
      if (data.success) {
        setStatus(data.status);
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

    pollTimerRef.current = setInterval(() => {
      fetchStatusAndLogs();
    }, 4000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleConnect = async () => {
    setActionLoading(true);
    setPairingCode(null);
    setPairingError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/connect', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.status) {
        setStatus(data.status);
      }
    } catch (err: any) {
      alert(`Failed to start connection: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async (logout = false) => {
    if (logout && !confirm('Are you sure you want to log out this WhatsApp device? You will need to scan the QR code again.')) {
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
    if (!pairingPhone.trim() || pairingPhone.trim().length < 10) {
      setPairingError('Please enter a valid 10-digit mobile number with country code (e.g., 919876543210).');
      return;
    }

    setPairingLoading(true);
    setPairingError(null);
    setPairingCode(null);

    try {
      const res = await fetch('/api/admin/whatsapp/pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: pairingPhone.trim() }),
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
      setTestResult(data.message || (data.success ? 'Test message sent successfully!' : 'Test message failed.'));
      fetchStatusAndLogs();
    } catch (err: any) {
      setTestResult(`Test failed: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const state = status?.state || 'DISCONNECTED';
  const isConnected = state === 'CONNECTED';
  const isScanning = state === 'SCAN_QR_CODE';
  const isConnecting = state === 'CONNECTING';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
                WhatsApp Operations Bot
              </h1>
              <p className="text-xs text-[#86868b] mt-0.5">
                Powered by Baileys Multi-Device • Internal Backend Management &amp; Operational Alerts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-700">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : isScanning || isConnecting
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-stone-400'
              }`}
            />
            <span>
              {isConnected
                ? 'Online • Linked'
                : isScanning
                ? 'Waiting for QR Scan'
                : isConnecting
                ? 'Connecting to WhatsApp...'
                : 'Offline'}
            </span>
          </div>

          <GlassButton
            onClick={fetchStatusAndLogs}
            disabled={actionLoading}
            size="sm"
            variant="ghost"
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </GlassButton>
        </div>
      </div>

      {/* Internal Management Scope Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-950">Backend Management Scope (Internal Operations Only)</p>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            As configured, Baileys is strictly connected to backend operations. Alerts for incoming paid orders, Delhivery waybills, low inventory, and midnight reconciliation are sent <strong>exclusively to authorized manager and admin phone numbers</strong>. Customer-facing WhatsApp communications remain disabled.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Device Connection & QR Code (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 space-y-6 bg-white border border-[#d2d2d7]/70 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Device Link</span>
              </h2>
              {isConnected && (
                <GlassBadge variant="success" className="text-[10px]">
                  Active Session
                </GlassBadge>
              )}
            </div>

            {/* State: CONNECTED */}
            {isConnected ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f]">
                    {status?.userName || 'Operations Desk Device'}
                  </h3>
                  <p className="text-xs font-mono text-emerald-800 font-semibold mt-0.5">
                    +{status?.userPhone || 'Linked Phone'}
                  </p>
                  <p className="text-[11px] text-[#86868b] mt-1">
                    Connected: {status?.lastConnectedAt ? new Date(status.lastConnectedAt).toLocaleString('en-IN') : 'Active'}
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <GlassButton
                    onClick={handleSendTestMessage}
                    disabled={testSending}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Send className={`w-4 h-4 ${testSending ? 'animate-spin' : ''}`} />
                    <span>{testSending ? 'Sending Test...' : 'Send Live Test Ping'}</span>
                  </GlassButton>

                  <GlassButton
                    onClick={() => handleDisconnect(true)}
                    disabled={actionLoading}
                    variant="ghost"
                    className="w-full text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Power className="w-3.5 h-3.5 mr-1" />
                    <span>Unlink &amp; Log Out Device</span>
                  </GlassButton>
                </div>
              </div>
            ) : isScanning && status?.qrCodeDataUrl ? (
              /* State: SCAN_QR_CODE */
              <div className="text-center py-2 space-y-4">
                <div className="p-3 bg-white border border-stone-200 rounded-2xl inline-block shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={status.qrCodeDataUrl}
                    alt="Scan WhatsApp QR Code"
                    className="w-56 h-56 mx-auto rounded-lg"
                  />
                </div>

                <div className="text-xs text-[#6e6e73] space-y-1">
                  <p className="font-semibold text-[#1d1d1f]">Scan with your WhatsApp:</p>
                  <ol className="list-decimal pl-5 text-left text-[11px] space-y-0.5 text-stone-600">
                    <li>Open WhatsApp on your mobile phone</li>
                    <li>Tap <strong>Settings</strong> (or ⋮) &gt; <strong>Linked Devices</strong></li>
                    <li>Tap <strong>Link a Device</strong></li>
                    <li>Point your camera at this QR code</li>
                  </ol>
                </div>

                <GlassButton
                  onClick={handleConnect}
                  disabled={actionLoading}
                  size="sm"
                  variant="ghost"
                  className="w-full text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                  <span>Regenerate QR Code</span>
                </GlassButton>
              </div>
            ) : (
              /* State: DISCONNECTED / CONNECTING */
              <div className="text-center py-6 space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-500 mx-auto flex items-center justify-center">
                  <Power className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1d1d1f]">WhatsApp Bot Disconnected</h3>
                  <p className="text-xs text-[#86868b] mt-1 max-w-xs mx-auto">
                    Link an administrative WhatsApp account to start receiving automated alerts on operations phones.
                  </p>
                </div>

                <GlassButton
                  onClick={handleConnect}
                  disabled={actionLoading}
                  className="w-full bg-[#1d1d1f] text-white hover:bg-[#2d2d2f] py-2.5 flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{actionLoading ? 'Generating QR...' : 'Show QR Code to Link'}</span>
                </GlassButton>
              </div>
            )}

            {/* Alternative: Mobile Pairing Code */}
            {!isConnected && (
              <div className="pt-4 border-t border-stone-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                  <KeyRound className="w-3.5 h-3.5 text-stone-600" />
                  <span>Or Link with Phone Number (Pairing Code)</span>
                </div>

                <form onSubmit={handleRequestPairingCode} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="e.g. 919876543210"
                      value={pairingPhone}
                      onChange={(e) => setPairingPhone(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                    />
                    <button
                      type="submit"
                      disabled={pairingLoading}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
                    >
                      {pairingLoading ? '...' : 'Get Code'}
                    </button>
                  </div>
                  {pairingError && <p className="text-[10px] text-rose-600">{pairingError}</p>}
                </form>

                {(pairingCode || status?.pairingCode) && (
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-1 animate-in fade-in">
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Your 8-Character Pairing Code</p>
                    <p className="text-xl font-mono font-bold tracking-widest text-[#1d1d1f]">
                      {pairingCode || status?.pairingCode}
                    </p>
                    <p className="text-[10px] text-stone-500">
                      Enter this code in WhatsApp &gt; Linked Devices &gt; Link with phone number
                    </p>
                  </div>
                )}
              </div>
            )}

            {testResult && (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800">
                {testResult}
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
                  Choose which business events trigger instantaneous WhatsApp messages to operations managers.
                </p>
              </div>

              {saveSuccess && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <div className="space-y-4 text-xs">
              {/* Event 1: New Paid Orders */}
              <label className="flex items-start gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer border border-transparent hover:border-stone-200">
                <input
                  type="checkbox"
                  checked={status?.settings.notifyNewOrders ?? true}
                  onChange={(e) => handleSaveSettings({ notifyNewOrders: e.target.checked })}
                  disabled={savingSettings}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>📦 New Customer Orders (Paid via Razorpay)</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Dispatches customer name, purchased jars, total amount, delivery PIN code, and packaging requirements immediately upon successful payment.
                  </p>
                </div>
              </label>

              {/* Event 2: Delhivery Consignment Dispatches */}
              <label className="flex items-start gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer border border-transparent hover:border-stone-200">
                <input
                  type="checkbox"
                  checked={status?.settings.notifyDispatches ?? true}
                  onChange={(e) => handleSaveSettings({ notifyDispatches: e.target.checked })}
                  disabled={savingSettings}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>🚚 Delhivery AWB Consignment Dispatch</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Sends allocated AWB waybill number, carrier mode (Surface/Express), destination hub, and direct Delhivery tracking URL for courier handoff.
                  </p>
                </div>
              </label>

              {/* Event 3: Low Inventory Warnings */}
              <label className="flex items-start gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer border border-transparent hover:border-stone-200">
                <input
                  type="checkbox"
                  checked={status?.settings.notifyLowStock ?? true}
                  onChange={(e) => handleSaveSettings({ notifyLowStock: e.target.checked })}
                  disabled={savingSettings}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>📉 Warehouse Low-Stock Alerts</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Alerts operations when any solid-glass honey jar variant dips below the safety threshold of 10 jars in Pune storage.
                  </p>
                </div>
              </label>

              {/* Event 4: 12:30 AM IST Reconcile Summary */}
              <label className="flex items-start gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer border border-transparent hover:border-stone-200">
                <input
                  type="checkbox"
                  checked={status?.settings.notifyWarehouseReconcile ?? true}
                  onChange={(e) => handleSaveSettings({ notifyWarehouseReconcile: e.target.checked })}
                  disabled={savingSettings}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>🌙 12:30 AM IST Warehouse Reconcile Summary</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Sends a complete midnight summary of reconciled orders, gross revenue collected, and inventory sync logs to the management team.
                  </p>
                </div>
              </label>

              {/* Event 5: Delhivery Wallet Warning */}
              <label className="flex items-start gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer border border-transparent hover:border-stone-200">
                <input
                  type="checkbox"
                  checked={status?.settings.notifyWalletLowBalance ?? true}
                  onChange={(e) => handleSaveSettings({ notifyWalletLowBalance: e.target.checked })}
                  disabled={savingSettings}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <span>💳 Delhivery One Prepaid Wallet Low-Balance Notice</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Notifies managers if one.delhivery.com wallet falls below ₹500 to ensure consignment generation is never interrupted.
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
                Staff WhatsApp numbers that receive operational alerts. Include country code (e.g. 91 for India).
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(status?.settings.adminPhoneNumbers || []).map((phone) => (
                <span
                  key={phone}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-mono text-xs font-semibold border border-stone-200"
                >
                  <span>+{phone}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoneNumber(phone)}
                    className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove recipient"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddPhoneNumber} className="flex gap-2 pt-2">
              <input
                type="tel"
                placeholder="Add manager mobile (e.g. 919876543210)"
                value={newPhoneInput}
                onChange={(e) => setNewPhoneInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
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
              Live audit trail of WhatsApp messages transmitted to the management team.
            </p>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            {logs.length} logged events
          </span>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-stone-400 py-6 text-center">
            No WhatsApp messages dispatched yet. Connect your device and click &quot;Send Live Test Ping&quot; to test.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 text-[11px]">
                  <th className="py-2 px-3 font-semibold">Timestamp</th>
                  <th className="py-2 px-3 font-semibold">Alert Type</th>
                  <th className="py-2 px-3 font-semibold">Recipient</th>
                  <th className="py-2 px-3 font-semibold">Message Preview</th>
                  <th className="py-2 px-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/50">
                    <td className="py-2 px-3 text-stone-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-sans text-[10px] font-bold">
                        {log.alertType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-stone-700 whitespace-nowrap">
                      +{log.recipient}
                    </td>
                    <td className="py-2 px-3 text-stone-600 font-sans text-xs max-w-md truncate">
                      {log.preview}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                          log.status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'SKIPPED_DISCONNECTED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status === 'SENT' ? 'Sent' : log.status === 'SKIPPED_DISCONNECTED' ? 'Logged (Offline)' : 'Failed'}
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
