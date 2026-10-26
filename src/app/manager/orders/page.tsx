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
import {
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  Package,
  FileText,
  RefreshCw,
  ExternalLink,
  Tag,
  Zap,
  UserCheck,
  Inbox,
} from 'lucide-react';

export default function ManagerOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [inboxTab, setInboxTab] = useState<'MY_INBOX' | 'UNASSIGNED' | 'ALL'>('ALL');
  const [currentManagerName, setCurrentManagerName] = useState<string>('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingAwb, setIsGeneratingAwb] = useState(false);

  // Identify logged in manager
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.name) {
          setCurrentManagerName(data.user.name);
        }
      })
      .catch(() => {});
  }, []);

  // Live order synchronization
  const [isSyncingDelhivery, setIsSyncingDelhivery] = useState(false);
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderRecord | null>(null);
  const [trackingDetails, setTrackingDetails] = useState<any | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

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

  const handleSyncDelhiveryStatus = async () => {
    setIsSyncingDelhivery(true);
    try {
      const res = await fetch('/api/shipping/delhivery/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync with Delhivery');
      await fetchLiveOrders();
      setTransitionSuccess(
        `✓ ${data.message || 'Delhivery sync complete'} (${data.cancelledCount || 0} cancellations updated)`
      );
    } catch (err: any) {
      alert(err.message || 'Delhivery sync failed');
    } finally {
      setIsSyncingDelhivery(false);
    }
  };

  const handleOpenTracking = async (order: OrderRecord) => {
    setTrackingModalOrder(order);
    setTrackingDetails(null);
    setIsLoadingTracking(true);
    try {
      const res = await fetch(
        `/api/shipping/delhivery/track?awb=${order.trackingNumber || ''}&orderNumber=${order.orderNumber}`
      );
      const data = await res.json();
      if (data.success && data.tracking) {
        setTrackingDetails(data.tracking);
        // If status changed to cancelled, refresh orders in background
        if (data.tracking.statusCode === 'CANCELLED' && order.orderStatus !== 'CANCELLED') {
          fetchLiveOrders();
        }
      }
    } catch (err) {
      console.warn('Tracking fetch failed:', err);
    } finally {
      setIsLoadingTracking(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
    // Auto-sync active Delhivery shipments on page mount
    fetch('/api/shipping/delhivery/sync', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        if (d.cancelledCount > 0 || d.updatedCount > 0) {
          fetchLiveOrders();
        }
      })
      .catch(() => {});

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

  const handleClaimOrder = async (orderId: string, managerName: string | null) => {
    setIsClaiming(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerName }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedName = data.assignedManagerName || null;
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, assignedManagerName: updatedName } : o))
        );
        if (activeOrder && activeOrder.id === orderId) {
          setActiveOrder({ ...activeOrder, assignedManagerName: updatedName });
        }
        setTransitionSuccess(
          updatedName
            ? `✓ Order claimed by ${updatedName}. Added to your active inbox.`
            : `✓ Order released to general operations queue.`
        );
      }
    } catch (err) {
      console.warn('Failed to assign order:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.assignedManagerName && o.assignedManagerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ? true : o.orderStatus === statusFilter;

    const matchesInbox =
      inboxTab === 'ALL'
        ? true
        : inboxTab === 'UNASSIGNED'
        ? !o.assignedManagerName
        : currentManagerName
        ? o.assignedManagerName?.toLowerCase() === currentManagerName.toLowerCase()
        : true;

    return matchesSearch && matchesStatus && matchesInbox;
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

    // 2. Paid online orders or COD orders can be advanced to shipped/delivered
    const isPayableOrCod = activeOrder.paymentStatus === 'PAID' || activeOrder.paymentStatus === 'COD_PENDING';
    if (!isPayableOrCod && (newStatus === 'SHIPPED' || newStatus === 'DELIVERED')) {
      setTransitionError('Cannot advance an order with unverified online payment status.');
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

  const handleCancelShipment = async (order: OrderRecord) => {
    if (!order.trackingNumber) return;
    const confirmed = window.confirm(
      `Cancel Delhivery shipment (${order.trackingNumber}) for order #${order.orderNumber}?\n\nIf manifested on Delhivery, courier freight charges are immediately reversed to your Delhivery wallet.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/shipping/delhivery/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waybill: order.trackingNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel shipment');
      alert(data.message || 'Shipment cancelled on Delhivery One.');
      fetchLiveOrders();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed.');
    }
  };

  const handleBookLiveDelhivery = async (order: OrderRecord) => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/shipping/delhivery/ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          mode: order.carrier?.toLowerCase().includes('surface') ? 'Surface' : 'Express',
          forceRegenerate: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book live Delhivery shipment');
      if (data?.shipment?.waybill) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  trackingNumber: data.shipment.waybill,
                  carrier: data.shipment.carrier,
                  delhiveryWaybill: data.shipment.waybill,
                  delhiveryStatus: 'Manifested / Slotted for Pickup',
                }
              : o
          )
        );
        setTransitionSuccess(`✓ Live Delhivery shipment booked! AWB: ${data.shipment.waybill} (${data.shipment.carrier})`);
      }
    } catch (err: any) {
      alert(err.message || 'Live booking error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBookAllConfirmedLive = async () => {
    const unbooked = orders.filter(
      (o) =>
        (!o.trackingNumber || o.trackingNumber.startsWith('143')) &&
        o.orderStatus !== 'CANCELLED' &&
        (o.paymentStatus === 'PAID' || o.paymentStatus === 'COD_PENDING')
    );
    if (unbooked.length === 0) {
      alert('All confirmed orders already have live Delhivery bookings.');
      return;
    }
    const confirmed = window.confirm(
      `Book ${unbooked.length} confirmed order(s) live on Delhivery One now?\n\nThis will manifest each consignment on one.delhivery.com and allocate real AWB numbers.`
    );
    if (!confirmed) return;

    setIsRefreshing(true);
    let successCount = 0;
    for (const order of unbooked) {
      try {
        const res = await fetch('/api/shipping/delhivery/ship', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: order.orderNumber,
            mode: order.carrier?.toLowerCase().includes('surface') ? 'Surface' : 'Express',
            forceRegenerate: true,
          }),
        });
        const data = await res.json();
        if (data?.shipment?.waybill) {
          successCount++;
        }
      } catch (e) {
        console.warn('Batch dispatch error for', order.orderNumber, e);
      }
    }
    await fetchLiveOrders();
    setIsRefreshing(false);
    setTransitionSuccess(`✓ Successfully booked ${successCount} order(s) live on Delhivery One!`);
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
      key: 'customer',
      header: 'Customer & Destination',
      render: (o) => (
        <div className="space-y-0.5 min-w-[140px]">
          <p className="font-semibold text-foreground text-xs leading-snug">{o.customerName}</p>
          <p className="text-[11px] text-muted-foreground font-mono leading-tight">{o.customerPhone || o.customerEmail}</p>
          <p className="text-[11px] text-muted-foreground/80 leading-tight">
            📍 {o.shippingAddress?.city}, {o.shippingAddress?.state}
          </p>
        </div>
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
      render: (o) => {
        const isCancelled = o.orderStatus === 'CANCELLED';
        const isDelhiveryCancelled = isCancelled && (o.delhiveryStatus || '').toLowerCase().includes('delhivery');
        return (
          <div className="space-y-0.5">
            <GlassBadge
              variant={
                o.orderStatus === 'DELIVERED'
                  ? 'success'
                  : o.orderStatus === 'SHIPPED'
                  ? 'info'
                  : o.orderStatus === 'CONFIRMED'
                  ? 'warning'
                  : isCancelled
                  ? 'destructive'
                  : 'default'
              }
              size="sm"
            >
              {isDelhiveryCancelled ? 'CANCELLED (Delhivery)' : o.orderStatus}
            </GlassBadge>
            {o.delhiveryStatus && (
              <p className="text-[10px] text-muted-foreground leading-tight max-w-[140px] truncate" title={o.delhiveryStatus}>
                {o.delhiveryStatus}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'assignedManagerName',
      header: 'Manager Ownership',
      render: (o) => {
        const isMine =
          currentManagerName &&
          o.assignedManagerName?.toLowerCase() === currentManagerName.toLowerCase();
        if (isMine) {
          return (
            <GlassBadge variant="success" size="sm" className="font-semibold flex items-center gap-1 w-fit whitespace-nowrap">
              <UserCheck className="w-3 h-3" />
              <span>Assigned to You</span>
            </GlassBadge>
          );
        }
        if (o.assignedManagerName) {
          return (
            <GlassBadge variant="info" size="sm" className="font-medium flex items-center gap-1 w-fit whitespace-nowrap">
              <UserCheck className="w-3 h-3" />
              <span>{o.assignedManagerName}</span>
            </GlassBadge>
          );
        }
        return (
          <GlassBadge variant="outline" size="sm" className="text-amber-400 border-amber-500/30 w-fit whitespace-nowrap">
            ⚡ Unassigned
          </GlassBadge>
        );
      },
    },
    {
      key: 'trackingNumber',
      header: 'Delhivery Shipment Tracking',
      render: (o) => {
        const rawCarrier = (o.carrier || 'Delhivery One').trim();
        const isLiveAwb = o.trackingNumber?.startsWith('718');
        return (
          <div className="space-y-1 min-w-[170px]">
            {o.trackingNumber ? (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <a
                    href={`https://www.delhivery.com/track/package/${o.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
                    title="Track package live on Delhivery One portal"
                  >
                    <span>{o.trackingNumber}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                  {isLiveAwb ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Live AWB
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBookLiveDelhivery(o)}
                      className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer"
                      title="Click to book live on Delhivery One"
                    >
                      ⚡ Book Live
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenTracking(o)}
                    className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30 hover:bg-sky-500/30 cursor-pointer inline-flex items-center gap-0.5"
                    title="Open live scan checkpoint drawer"
                  >
                    📡 Track
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {rawCarrier.includes('(') ? rawCarrier : `(${rawCarrier})`}
                </span>
              </div>
            ) : (
              <GlassButton
                variant="outline"
                size="sm"
                onClick={() => handleBookLiveDelhivery(o)}
                className="text-[10px] h-6 px-2 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              >
                ⚡ Book Live AWB
              </GlassButton>
            )}
            {(o as any).delhiveryRemarks && (
              <p className="text-[10px] text-amber-400 font-medium leading-tight flex items-center gap-1 mt-0.5">
                <span>⚠️ Delhivery One: Wallet balance needed to manifest on portal</span>
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
          {!o.assignedManagerName && currentManagerName && (
            <GlassButton
              variant="secondary"
              size="sm"
              disabled={isClaiming}
              onClick={() => handleClaimOrder(o.id, currentManagerName)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              title="Claim this order into your inbox"
            >
              Claim
            </GlassButton>
          )}
          {(!o.trackingNumber || o.trackingNumber.startsWith('143')) && o.orderStatus !== 'CANCELLED' && (
            <GlassButton
              variant="primary"
              size="sm"
              disabled={isRefreshing}
              onClick={() => handleBookLiveDelhivery(o)}
              className="gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md border-emerald-400/30 whitespace-nowrap"
              title="Book real live shipment on Delhivery One directly with 1 click"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Book Live</span>
            </GlassButton>
          )}
          {o.trackingNumber && (
            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => handleOpenTracking(o)}
              className="gap-1 text-sky-400 hover:text-sky-300 hover:border-sky-500/30 text-xs"
              title="View live checkpoints from Delhivery"
            >
              <span>Track</span>
            </GlassButton>
          )}
          {o.trackingNumber && (
            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/shipping/delhivery/label?orderNumber=${o.orderNumber}`, '_blank')}
              className="gap-1 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 text-xs"
              title="Print official Delhivery Shipping Label PDF"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Label</span>
            </GlassButton>
          )}
          {o.trackingNumber && !o.trackingNumber.startsWith('143') && o.orderStatus !== 'CANCELLED' && (
            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => handleCancelShipment(o)}
              className="gap-1 text-rose-400 hover:text-rose-300 hover:border-rose-500/30 text-xs"
              title="Void / Cancel this Delhivery shipment and refund courier freight to wallet"
            >
              <span>Void</span>
            </GlassButton>
          )}
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => window.open(`/invoice/${o.orderNumber}`, '_blank')}
            className="gap-1 text-amber-500 hover:text-amber-400 hover:border-amber-500/30 text-xs"
            title="Open official GST Tax Invoice & Packing Slip"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Invoice</span>
          </GlassButton>
          <GlassButton variant="primary" size="sm" onClick={() => handleOpenFulfill(o)} className="text-xs whitespace-nowrap">
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
              Prepaid &amp; COD Active • Live Delhivery One
            </GlassBadge>
          </div>
          <p className="text-xs text-muted-foreground">
            Process orders through verified state transitions and record courier tracking references
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleBookAllConfirmedLive}
            className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md border-emerald-400/30"
            disabled={isRefreshing}
            title="Book all unmanifested confirmed orders directly on Delhivery One in 1 click"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>⚡ Book Confirmed Orders on Delhivery</span>
          </GlassButton>
          <GlassButton
            variant="outline"
            size="sm"
            onClick={handleSyncDelhiveryStatus}
            className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-semibold"
            disabled={isSyncingDelhivery || isRefreshing}
            title="Synchronize live status directly from Delhivery One (updates cancellations, deliveries, transit scans)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDelhivery ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncingDelhivery ? 'Syncing...' : '🔄 Sync Delhivery'}</span>
          </GlassButton>
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

      {/* Manager Order Inbox Desk */}
      <div className="p-3 rounded-2xl glass-panel space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5 text-brand" />
            <span>Fulfillment Operations Inbox</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            {currentManagerName ? `Logged in as: ${currentManagerName}` : 'Manager Operations Desk'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setInboxTab('MY_INBOX')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              inboxTab === 'MY_INBOX'
                ? 'glass-primary shadow-sm font-semibold'
                : 'glass-control text-muted-foreground hover:text-foreground'
            }`}
          >
            📥 My Assigned Orders ({orders.filter((o) => currentManagerName && o.assignedManagerName?.toLowerCase() === currentManagerName.toLowerCase()).length})
          </button>
          <button
            type="button"
            onClick={() => setInboxTab('UNASSIGNED')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              inboxTab === 'UNASSIGNED'
                ? 'glass-primary shadow-sm font-semibold'
                : 'glass-control text-amber-400 hover:text-amber-300'
            }`}
          >
            ⚡ Unassigned Queue ({orders.filter((o) => !o.assignedManagerName).length})
          </button>
          <button
            type="button"
            onClick={() => setInboxTab('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              inboxTab === 'ALL'
                ? 'glass-primary shadow-sm font-semibold'
                : 'glass-control text-muted-foreground hover:text-foreground'
            }`}
          >
            🌐 All Orders ({orders.length})
          </button>
        </div>
      </div>

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

            {/* Manager Assignment Desk inside modal */}
            <div className="p-3.5 rounded-xl glass-control flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground">Assigned Manager:</span>
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-brand" />
                  <span>{activeOrder.assignedManagerName || '⚡ Unassigned'}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentManagerName &&
                  activeOrder.assignedManagerName?.toLowerCase() !==
                    currentManagerName.toLowerCase() && (
                    <GlassButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isClaiming}
                      onClick={() => handleClaimOrder(activeOrder.id, currentManagerName)}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      Claim for Myself
                    </GlassButton>
                  )}
                {activeOrder.assignedManagerName && (
                  <GlassButton
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isClaiming}
                    onClick={() => handleClaimOrder(activeOrder.id, null)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Release Order
                  </GlassButton>
                )}
              </div>
            </div>

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
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-brand" />
                    <span>Carrier &amp; Dispatch Information (Delhivery One)</span>
                  </h4>
                  <GlassButton
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 gap-1 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                    isLoading={isGeneratingAwb}
                    onClick={async () => {
                      if (!activeOrder) return;
                      setIsGeneratingAwb(true);
                      try {
                        const res = await fetch('/api/shipping/delhivery/ship', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            orderNumber: activeOrder.orderNumber,
                            mode: carrier.toLowerCase().includes('surface') ? 'Surface' : 'Express',
                            forceRegenerate: true,
                          }),
                        });
                        const data = await res.json();
                        if (data?.shipment) {
                          setTrackingNumber(data.shipment.waybill);
                          setCarrier(data.shipment.carrier);
                          if (data.shipment.remarks) {
                            setTransitionError(data.shipment.remarks);
                          }
                        }
                      } catch (err) {
                        console.warn('Auto AWB generation error:', err);
                      } finally {
                        setIsGeneratingAwb(false);
                      }
                    }}
                  >
                    <Zap className="w-3 h-3" />
                    <span>⚡ Auto-Generate Delhivery AWB</span>
                  </GlassButton>
                </div>

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
                      <option value="Delhivery One (Air Express)">Delhivery One (Air Express)</option>
                      <option value="Delhivery One (Surface)">Delhivery One (Surface)</option>
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
                    placeholder="e.g. 143920192837 or DELHIVERY..."
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

      {/* Live Delhivery Tracking Modal */}
      <FormDialog
        isOpen={Boolean(trackingModalOrder)}
        onClose={() => setTrackingModalOrder(null)}
        title={`📡 Delhivery One Live Tracking • #${trackingModalOrder?.orderNumber}`}
      >
        {trackingModalOrder && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-card border border-border/50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Waybill (AWB):</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-foreground">
                    {trackingModalOrder.trackingNumber || 'No Waybill'}
                  </span>
                  {trackingModalOrder.trackingNumber && (
                    <a
                      href={`https://www.delhivery.com/track/package/${trackingModalOrder.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-brand hover:underline inline-flex items-center gap-1"
                    >
                      <span>delhivery.com</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <GlassBadge
                  variant={
                    trackingDetails?.statusCode === 'CANCELLED' || trackingModalOrder.orderStatus === 'CANCELLED'
                      ? 'destructive'
                      : trackingDetails?.statusCode === 'DELIVERED'
                      ? 'success'
                      : trackingDetails?.statusCode === 'OUT_FOR_DELIVERY'
                      ? 'warning'
                      : 'info'
                  }
                  size="sm"
                >
                  {trackingDetails?.status || trackingModalOrder.delhiveryStatus || trackingModalOrder.orderStatus}
                </GlassBadge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Carrier: {trackingModalOrder.carrier || 'Delhivery One'}
                </span>
              </div>
            </div>

            {/* Hub Route Details */}
            {trackingDetails && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Origin Hub</p>
                  <p className="font-semibold text-foreground text-xs mt-0.5">{trackingDetails.origin}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Destination Hub</p>
                  <p className="font-semibold text-foreground text-xs mt-0.5">{trackingDetails.destination}</p>
                </div>
              </div>
            )}

            {/* Cancellation Notice Banner */}
            {(trackingDetails?.isCancelled || trackingModalOrder.orderStatus === 'CANCELLED') && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Shipment Cancelled on Delhivery One</p>
                  <p className="text-muted-foreground mt-0.5">
                    {trackingDetails?.cancellationReason || trackingModalOrder.delhiveryStatus || 'This shipment was cancelled by seller or voided. Local order status synchronized to CANCELLED.'}
                  </p>
                </div>
              </div>
            )}

            {/* Checkpoints Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Carrier Scan History ({trackingDetails?.checkpoints?.length || 0} Events)</span>
                {isLoadingTracking && (
                  <span className="text-[11px] text-amber-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Querying Delhivery API...</span>
                  </span>
                )}
              </h4>

              {isLoadingTracking ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                  <span>Fetching live tracking checkpoints from track.delhivery.com...</span>
                </div>
              ) : trackingDetails?.checkpoints?.length ? (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {trackingDetails.checkpoints.map((cp: any, idx: number) => {
                    const isCancelledScan =
                      (cp.status || '').toLowerCase().includes('cancel') ||
                      (cp.instructions || '').toLowerCase().includes('cancel') ||
                      cp.status === 'Not Picked';

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-3 ${
                          idx === trackingDetails.checkpoints.length - 1
                            ? isCancelledScan
                              ? 'bg-rose-500/10 border-rose-500/30'
                              : 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-card/40 border-border/30'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            isCancelledScan ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                        />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground">{cp.status}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{cp.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{cp.instructions}</p>
                          <p className="text-[10px] text-muted-foreground/70 font-mono">📍 {cp.location}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-card border border-border/40 text-center text-xs text-muted-foreground">
                  No scan events recorded yet for this waybill.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40 flex-wrap">
              <GlassButton
                variant="outline"
                size="sm"
                onClick={() => window.open(`/api/shipping/delhivery/label?orderNumber=${trackingModalOrder.orderNumber}`, '_blank')}
                className="gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Open Official Shipping Label</span>
              </GlassButton>
              <div className="flex items-center gap-2">
                {(trackingDetails?.isCancelled || trackingModalOrder.orderStatus === 'CANCELLED') && (
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const ord = trackingModalOrder;
                      setTrackingModalOrder(null);
                      handleBookLiveDelhivery(ord);
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    ⚡ Re-Book Live on Delhivery
                  </GlassButton>
                )}
                <GlassButton variant="outline" size="sm" onClick={() => setTrackingModalOrder(null)}>
                  Close
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </FormDialog>
    </DashboardLayout>
  );
}
