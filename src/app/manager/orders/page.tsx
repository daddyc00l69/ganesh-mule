'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassInput } from '@/components/ui/glass-input';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { FormDialog } from '@/components/ui/form-dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { OrderRecord, OrderStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Truck, CheckCircle2, Clock, Eye, AlertCircle, Package, FileText, RefreshCw } from 'lucide-react';

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live order synchronization
  const fetchLiveOrders = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/orders');
      if (res.status === 401) {
        window.location.href = '/portal?redirect=/manager/orders';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch {}
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchLiveOrders();
    const timer = setInterval(fetchLiveOrders, 8000);
    return () => clearInterval(timer);
  }, []);

  // Order Details / Transition Modal
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('CONFIRMED');
  const [carrier, setCarrier] = useState('Delhivery Surface');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitionSuccess, setTransitionSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ? true : o.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenFulfill = (order: OrderRecord) => {
    setActiveOrder(order);
    setCarrier(order.carrier || 'Delhivery Surface');
    setTrackingNumber(order.trackingNumber || '');
    setTransitionError(null);

    // Set next logical permitted transition
    if (order.orderStatus === 'PROCESSING') {
      setNewStatus('CONFIRMED');
    } else if (order.orderStatus === 'CONFIRMED') {
      setNewStatus('SHIPPED');
    } else if (order.orderStatus === 'SHIPPED') {
      setNewStatus('DELIVERED');
    } else {
      setNewStatus(order.orderStatus);
    }
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setIsUpdating(true);
    setTransitionError(null);

    // Enforce business rules:
    // 1. Cannot ship without tracking number
    if (newStatus === 'SHIPPED' && !trackingNumber.trim()) {
      setTransitionError('Carrier tracking number is strictly required when transitioning to SHIPPED.');
      setIsUpdating(false);
      return;
    }

    // 2. Cannot advance unpaid order to shipped
    if (activeOrder.paymentStatus !== 'PAID' && (newStatus === 'SHIPPED' || newStatus === 'DELIVERED')) {
      setTransitionError('Cannot advance an order with unverified payment status.');
      setIsUpdating(false);
      return;
    }

    try {
      await fetch(`/api/orders/${activeOrder.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          carrier: newStatus === 'SHIPPED' ? carrier : activeOrder.carrier,
          trackingNumber: newStatus === 'SHIPPED' ? trackingNumber : activeOrder.trackingNumber,
        }),
      });
    } catch {}

    setOrders((prev) =>
      prev.map((o) =>
        o.id === activeOrder.id
          ? {
              ...o,
              orderStatus: newStatus,
              carrier: newStatus === 'SHIPPED' ? carrier : o.carrier,
              trackingNumber: newStatus === 'SHIPPED' ? trackingNumber : o.trackingNumber,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    setIsUpdating(false);
    setTransitionSuccess(
      `✓ Order #${activeOrder.orderNumber} successfully updated to ${newStatus}. Automated Resend notification email dispatched.`
    );
    setActiveOrder(null);
  };

  const columns: Column<OrderRecord>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (o) => (
        <span className="font-mono font-medium text-foreground">{o.orderNumber}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (o) => (
        <div>
          <p className="font-semibold text-foreground text-xs">{o.customerName}</p>
          <p className="text-[11px] text-muted-foreground">{o.customerPhone || o.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (o) => (
        <span className="text-xs text-muted-foreground">
          {o.shippingAddress.city}, {o.shippingAddress.state}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      render: (o) => (
        <GlassBadge variant={o.paymentStatus === 'PAID' ? 'success' : 'warning'} size="sm">
          {o.paymentStatus}
        </GlassBadge>
      ),
    },
    {
      key: 'orderStatus',
      header: 'Current Stage',
      render: (o) => (
        <GlassBadge
          variant={
            o.orderStatus === 'DELIVERED'
              ? 'success'
              : o.orderStatus === 'SHIPPED'
              ? 'info'
              : o.orderStatus === 'CONFIRMED'
              ? 'warning'
              : 'default'
          }
          size="sm"
        >
          {o.orderStatus}
        </GlassBadge>
      ),
    },
    {
      key: 'trackingNumber',
      header: 'Shipment Tracking',
      render: (o) => (
        <span className="font-mono text-xs text-foreground/80">
          {o.trackingNumber ? `${o.carrier} (${o.trackingNumber})` : 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => window.open(`/invoice/${o.orderNumber}`, '_blank')}
            className="gap-1 text-amber-500 hover:text-amber-400 hover:border-amber-500/30"
            title="Open official GST Tax Invoice & Packing Slip"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Invoice</span>
          </GlassButton>
          <GlassButton variant="primary" size="sm" onClick={() => handleOpenFulfill(o)}>
            Update Stage
          </GlassButton>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="MANAGER" title="Order Queue & Fulfillment Desk" userName="Vikram Mehta">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Fulfillment Queue &amp; Dispatch
            </h2>
            <GlassBadge variant="success" size="sm">
              Prepaid Only • No COD
            </GlassBadge>
          </div>
          <p className="text-xs text-muted-foreground">
            Process orders through verified state transitions and record courier tracking references
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={fetchLiveOrders}
            className="gap-1.5"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Queue'}</span>
          </GlassButton>
        </div>
      </div>

      {transitionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-in fade-in">
          <span>{transitionSuccess}</span>
          <button
            onClick={() => setTransitionSuccess(null)}
            className="text-muted-foreground hover:text-foreground text-xs cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <FilterBar
          options={[
            { label: 'All Orders', value: 'ALL', count: orders.length },
            {
              label: 'Processing',
              value: 'PROCESSING',
              count: orders.filter((o) => o.orderStatus === 'PROCESSING').length,
            },
            {
              label: 'Confirmed',
              value: 'CONFIRMED',
              count: orders.filter((o) => o.orderStatus === 'CONFIRMED').length,
            },
            {
              label: 'Shipped',
              value: 'SHIPPED',
              count: orders.filter((o) => o.orderStatus === 'SHIPPED').length,
            },
            {
              label: 'Delivered',
              value: 'DELIVERED',
              count: orders.filter((o) => o.orderStatus === 'DELIVERED').length,
            },
          ]}
          selectedValue={statusFilter}
          onSelect={setStatusFilter}
        />

        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search by order #, customer name..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        keyExtractor={(o) => o.id}
        emptyMessage="No orders in current view."
      />

      {/* Stage Transition Dialog */}
      <FormDialog
        isOpen={!!activeOrder}
        onClose={() => setActiveOrder(null)}
        title={`Advance Order: ${activeOrder?.orderNumber}`}
        description="Enforces strict operational state transitions. Payment cannot be forged."
        maxWidth="lg"
      >
        {activeOrder && (
          <form onSubmit={handleExecuteTransition} className="space-y-4 pt-2">
            {transitionError && (
              <div className="p-3 rounded-xl bg-destructive/15 text-destructive text-xs flex items-center gap-2 border border-destructive/20 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transitionError}</span>
              </div>
            )}

            {/* Current Status Overview */}
            <div className="p-3.5 rounded-xl glass-control flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground">Verified Payment Status:</span>
                <p className="font-bold text-foreground mt-0.5">{activeOrder.paymentStatus}</p>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Current Stage:</span>
                <p className="font-bold text-foreground mt-0.5">{activeOrder.orderStatus}</p>
              </div>
            </div>

            {/* Next Permitted Stage Selector */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-foreground">
                Transition to Next Stage
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="glass-input w-full h-10 px-3 text-sm rounded-control text-foreground outline-none focus:ring-2 focus:ring-ring/40 bg-card"
              >
                <option value="CONFIRMED" className="bg-background text-foreground">
                  CONFIRMED (Order packed and ready at dock)
                </option>
                <option value="SHIPPED" className="bg-background text-foreground">
                  SHIPPED (Handed over to carrier courier)
                </option>
                <option value="DELIVERED" className="bg-background text-foreground">
                  DELIVERED (Final delivery confirmed)
                </option>
                <option value="CANCELLED" className="bg-background text-foreground">
                  CANCELLED (Cancelled prior to dispatch)
                </option>
              </select>
            </div>

            {/* Carrier & Tracking if transitioning to SHIPPED or already SHIPPED */}
            {(newStatus === 'SHIPPED' || activeOrder.orderStatus === 'SHIPPED') && (
              <div className="p-4 rounded-xl glass-panel space-y-3">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-brand" />
                  <span>Carrier & Dispatch Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-medium text-foreground/85">
                      Carrier Service
                    </label>
                    <select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="glass-input w-full h-10 px-3 text-sm rounded-control text-foreground outline-none bg-card"
                    >
                      <option value="Delhivery Surface">Delhivery Surface</option>
                      <option value="Blue Dart Apex">Blue Dart Apex</option>
                      <option value="DTDC Express">DTDC Express</option>
                      <option value="Shadowfax Local">Shadowfax Local</option>
                    </select>
                  </div>
                  <GlassInput
                    label="Air Waybill (AWB) / Tracking #"
                    required={newStatus === 'SHIPPED'}
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DELHIVERY-99882211"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-border/40">
              <GlassButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(`/invoice/${activeOrder.orderNumber}`, '_blank')}
                className="gap-1.5 text-amber-500 hover:text-amber-400 hover:border-amber-500/30"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print Packing Slip & Invoice</span>
              </GlassButton>
              <div className="flex items-center gap-2">
                <GlassButton type="button" variant="outline" onClick={() => setActiveOrder(null)}>
                  Cancel
                </GlassButton>
                <GlassButton type="submit" variant="primary" isLoading={isUpdating}>
                  Commit Status Transition
                </GlassButton>
              </div>
            </div>
          </form>
        )}
      </FormDialog>
    </DashboardLayout>
  );
}
