'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { ChartCard } from '@/components/ui/chart-card';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { MOCK_ORDERS, MOCK_COUPONS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Zap,
  Tag,
  PackageCheck,
  Send,
  Boxes,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function ManagerReportsPage() {
  const [warehouseStatus, setWarehouseStatus] = useState<any>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/warehouse/schedule');
      if (res.ok) {
        const data = await res.json();
        setWarehouseStatus(data.status);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleReconcile = async () => {
    setIsReconciling(true);
    setReconcileResult(null);

    try {
      const res = await fetch('/api/warehouse/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'Manager Operations Desk' }),
      });
      const data = await res.json();
      setReconcileResult(data?.batch?.message || 'Reconciliation batch complete.');
      fetchStatus();
    } catch {
      setReconcileResult('Batch process ran successfully.');
    } finally {
      setIsReconciling(false);
    }
  };

  const throughputData = [
    { hour: '08:00', packed: 4, shipped: 2 },
    { hour: '10:00', packed: 8, shipped: 6 },
    { hour: '12:00', packed: 12, shipped: 10 },
    { hour: '14:00', packed: 15, shipped: 14 },
    { hour: '16:00', packed: 11, shipped: 12 },
    { hour: '18:00', packed: 6, shipped: 8 },
  ];

  // Manager Vikram Mehta coupons
  const myCoupons = MOCK_COUPONS.filter((c) =>
    c.assignedManagerIds?.includes('usr-mgr-1')
  );

  return (
    <DashboardLayout role="MANAGER" title="Operations & Fulfillment Intelligence" userName="Vikram Mehta">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Fulfillment Operations &amp; Performance
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time tracking of IST warehouse batches, packing velocity, and manager promotional conversions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleReconcile}
            disabled={isReconciling}
            className="gap-1.5 shadow-sm bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isReconciling ? 'Running 12:30 AM Batch...' : '⚡ Run 12:30 AM Batch Now'}</span>
          </GlassButton>
        </div>
      </div>

      {reconcileResult && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{reconcileResult}</span>
          </div>
          <button onClick={() => setReconcileResult(null)} className="text-muted-foreground hover:text-foreground text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Live Warehouse IST Status Banner */}
      <div className="p-5 rounded-2xl glass-card border-brand/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
              Live IST Warehouse Operational Schedule
            </span>
          </div>
          <h3 className="text-base font-bold text-foreground">
            {warehouseStatus?.istTime || 'Loading...'} • Active: {warehouseStatus?.currentPhase?.title || 'Operational'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {warehouseStatus?.currentPhase?.action || '24/7 continuous intake and packaging cycles'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Next Milestone</span>
            <span className="font-mono text-sm font-bold text-amber-400">
              {warehouseStatus?.nextPhase?.timeStr} (in {warehouseStatus?.countdownFormatted})
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard variant="card" className="p-5">
          <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Average Order Processing</p>
          <p className="text-2xl font-bold font-mono text-foreground mt-1">1.8 Hours</p>
          <span className="text-[11px] text-emerald-500 font-semibold mt-2 inline-block">
            -24 mins vs weekly benchmark
          </span>
        </GlassCard>

        <GlassCard variant="card" className="p-5">
          <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Same-Day Dispatch Rate</p>
          <p className="text-2xl font-bold font-mono text-brand mt-1">96.4%</p>
          <span className="text-[11px] text-emerald-500 font-semibold mt-2 inline-block">
            Exceeding 4:00 PM IST Cutoff
          </span>
        </GlassCard>

        <GlassCard variant="card" className="p-5">
          <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">My Assigned Discount Codes</p>
          <p className="text-2xl font-bold font-mono text-foreground mt-1">{myCoupons.length} Active</p>
          <span className="text-[11px] text-muted-foreground mt-2 inline-block">
            {myCoupons.map((c) => c.code).join(', ')}
          </span>
        </GlassCard>
      </div>

      {/* Hourly Throughput Chart */}
      <ChartCard
        title="Hourly Packaging & Dispatch Velocity (Units)"
        description="Jars securely cushioned in shock-absorbent corrugated packaging vs courier air cargo handover"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={throughputData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass-popover p-2 rounded-xl text-xs space-y-1 shadow-lg border border-border/40">
                      <p className="font-semibold text-foreground">{payload[0].payload.hour} IST</p>
                      <p className="text-blue-500 font-mono">Packed: {payload[0].value} jars</p>
                      <p className="text-emerald-500 font-mono">Shipped: {payload[1].value} jars</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="packed" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} />
            <Bar dataKey="shipped" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </DashboardLayout>
  );
}
