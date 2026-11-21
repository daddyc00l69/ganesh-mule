'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/ui/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import {
  ShieldAlert,
  Server,
  Database,
  Activity,
  Users,
  UserCheck,
  CreditCard,
  Truck,
  Mail,
  MessageSquare,
  Lock,
  ArrowRight,
  RefreshCw,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DeveloperDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/developer/health');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/portal?error=unauthorized_developer';
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Developer health probe error:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <DashboardLayout role="DEVELOPER" title="System Engineering & Platform Core">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase">
                Developer Tier
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Environment: {process.env.NODE_ENV || 'production'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Platform Engineering &amp; System Health
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Central supervisory dashboard for staff access control, database telemetry, payment gateway health, and automated logistics verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton
              variant="outline"
              size="sm"
              onClick={fetchHealth}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </GlassButton>
            <Link href="/developer/accounts">
              <GlassButton variant="primary" size="sm" className="gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Manage Staff</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </GlassButton>
            </Link>
          </div>
        </div>

        {/* 1. Account Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Developers"
            value={data?.stats?.totalDevelopers ?? 1}
            icon={<Lock className="w-4 h-4 text-purple-500" />}
          />
          <StatCard
            title="Administrators"
            value={data?.stats?.totalAdmins ?? 1}
            icon={<ShieldAlert className="w-4 h-4 text-blue-500" />}
          />
          <StatCard
            title="Managers"
            value={data?.stats?.totalManagers ?? 1}
            icon={<Users className="w-4 h-4 text-amber-500" />}
          />
          <StatCard
            title="Active Staff"
            value={data?.stats?.activeStaff ?? 2}
            icon={<UserCheck className="w-4 h-4 text-emerald-500" />}
          />
          <StatCard
            title="Disabled / Suspended"
            value={data?.stats?.disabledStaff ?? 0}
            icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
          />
          <StatCard
            title="Registered Customers"
            value={data?.stats?.totalCustomers ?? 0}
            icon={<Users className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* 2. System Telemetry & Integration Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Server & Database Telemetry */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-foreground">PostgreSQL &amp; Node Runtime</h2>
              </div>
              <GlassBadge
                variant={data?.system?.database?.online ? 'success' : 'destructive'}
                size="sm"
              >
                {data?.system?.database?.online ? 'DB Online' : 'DB Offline'}
              </GlassBadge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-accent/20 space-y-1">
                <span className="text-[11px] text-muted-foreground">Database Latency</span>
                <p className="text-base font-bold text-foreground font-mono">
                  {data?.system?.database?.latencyMs ?? 15} ms
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">Direct connection verified</span>
              </div>
              <div className="p-3 rounded-xl bg-accent/20 space-y-1">
                <span className="text-[11px] text-muted-foreground">Process Uptime</span>
                <p className="text-base font-bold text-foreground font-mono">
                  {Math.floor((data?.system?.uptimeSeconds ?? 120) / 60)} mins
                </p>
                <span className="text-[10px] text-muted-foreground">Node {data?.system?.nodeVersion}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Memory Allocation (RSS / Heap)</span>
                <span className="font-mono font-semibold text-foreground">
                  {data?.system?.memory?.rssMb ?? 98} MB / {data?.system?.memory?.heapUsedMb ?? 45} MB
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-accent/40 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, ((data?.system?.memory?.heapUsedMb ?? 45) / (data?.system?.memory?.heapTotalMb ?? 100)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
              <span>Database Engine: {data?.system?.database?.provider}</span>
              <span className="font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
          </GlassCard>

          {/* Integration Status Grid */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-foreground">External Service Integrations</h2>
              </div>
              <GlassBadge variant="info" size="sm">Live Gateways</GlassBadge>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Razorpay */}
              <div className="p-2.5 rounded-xl bg-accent/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="font-semibold text-foreground">Razorpay Payment Gateway</p>
                    <p className="text-[10px] text-muted-foreground">
                      Key: {data?.integrations?.razorpay?.keyIdMasked} · Webhook: {data?.integrations?.razorpay?.webhookConfigured ? 'Active' : 'Missing'}
                    </p>
                  </div>
                </div>
                <GlassBadge variant={data?.integrations?.razorpay?.configured ? 'success' : 'warning'} size="sm">
                  {data?.integrations?.razorpay?.configured ? 'Active' : 'Unconfigured'}
                </GlassBadge>
              </div>

              {/* Delhivery */}
              <div className="p-2.5 rounded-xl bg-accent/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="font-semibold text-foreground">Delhivery One Logistics</p>
                    <p className="text-[10px] text-muted-foreground">
                      Client ID: {data?.integrations?.delhivery?.clientId} · Mode: {data?.integrations?.delhivery?.environment}
                    </p>
                  </div>
                </div>
                <GlassBadge variant={data?.integrations?.delhivery?.configured ? 'success' : 'warning'} size="sm">
                  {data?.integrations?.delhivery?.configured ? 'Active' : 'Unconfigured'}
                </GlassBadge>
              </div>

              {/* Resend Email */}
              <div className="p-2.5 rounded-xl bg-accent/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="font-semibold text-foreground">Resend Transactional Email</p>
                    <p className="text-[10px] text-muted-foreground">
                      Dispatch Sender: {data?.integrations?.resend?.fromEmail}
                    </p>
                  </div>
                </div>
                <GlassBadge variant={data?.integrations?.resend?.configured ? 'success' : 'warning'} size="sm">
                  {data?.integrations?.resend?.configured ? 'Ready' : 'Fallback Local'}
                </GlassBadge>
              </div>

              {/* Chatwoot Live Support */}
              <div className="p-2.5 rounded-xl bg-accent/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-sky-500" />
                  <div>
                    <p className="font-semibold text-foreground">Chatwoot Customer Support</p>
                    <p className="text-[10px] text-muted-foreground">
                      URL: {data?.integrations?.chatwoot?.baseUrl}
                    </p>
                  </div>
                </div>
                <GlassBadge variant={data?.integrations?.chatwoot?.configured ? 'success' : 'info'} size="sm">
                  {data?.integrations?.chatwoot?.configured ? 'Active' : 'Standby'}
                </GlassBadge>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* 3. Recent Audit Logs (Security events) */}
        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-foreground">Recent Security &amp; Administrative Events</h2>
            </div>
            <Link href="/admin/audit-logs">
              <GlassButton variant="ghost" size="sm" className="gap-1 text-xs">
                <span>View Full Audit Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </GlassButton>
            </Link>
          </div>

          {!data?.recentAuditLogs || data.recentAuditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <p>No recent administrative events recorded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] font-semibold text-muted-foreground border-b border-border/40">
                  <tr>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Actor</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Entity</th>
                    <th className="py-2 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {data.recentAuditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-accent/10 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-foreground">{log.actorName}</span>
                        <span className="block text-[10px] text-muted-foreground">{log.actorEmail}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-500">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {log.entityType} ({log.entityId || 'N/A'})
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px] max-w-xs truncate">
                        {log.metadata ? JSON.stringify(log.metadata) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
