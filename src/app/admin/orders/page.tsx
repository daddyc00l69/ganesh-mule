'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { FormDialog } from '@/components/ui/form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { OrderRecord, OrderStatus, PaymentStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Eye,
  RotateCcw,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  ExternalLink,
  Tag,
  UserCheck,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [managerFilter, setManagerFilter] = useState('ALL');
  const [availableManagers, setAvailableManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live order synchronization
  const fetchLiveOrders = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/orders');
      if (res.status === 401) {
        window.location.href = '/portal?redirect=/admin/orders';
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
    const timer = setInterval(fetchLiveOrders, 8000); // Live poll every 8 seconds
    return () => clearInterval(timer);
  }, []);

  // Fetch registered managers for assignment
  useEffect(() => {
    fetch('/api/managers')
      .then((res) => res.json())
      .then((data) => {
        if (data.managers && Array.isArray(data.managers)) {
          setAvailableManagers(data.managers.map((m: any) => ({ id: m.id || m.userId, name: m.name })));
        }
      })
      .catch(() => {});
  }, []);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Refund Modal
  const [refundingOrder, setRefundingOrder] = useState<OrderRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Collect all known manager names across registered staff and existing orders
  const allKnownManagers = Array.from(
    new Set([
      ...availableManagers.map((m) => m.name),
      ...orders.map((o) => o.assignedManagerName).filter(Boolean) as string[],
    ])
  );

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.assignedManagerName && o.assignedManagerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ? true : o.orderStatus === statusFilter;

    const matchesManager =
      managerFilter === 'ALL'
        ? true
        : managerFilter === 'UNASSIGNED'
        ? !o.assignedManagerName
        : o.assignedManagerName?.toLowerCase() === managerFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesManager;
  });

  const handleAssignManager = async (orderId: string, managerName: string | null) => {
    setIsAssigning(true);
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
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, assignedManagerName: updatedName });
        }
      }
    } catch (err) {
      console.warn('Failed to assign manager:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleExecuteRefund = async () => {
    if (!refundingOrder) return;
    setIsProcessingRefund(true);

    try {
      await fetch('/api/payments/razorpay/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundingOrder.id,
          amount: refundingOrder.totalAmount,
          reason: refundReason || 'Customer requested refund authorized by Administrator',
        }),
      });
    } catch {}

    setOrders((prev) =>
      prev.map((o) =>
        o.id === refundingOrder.id
          ? {
              ...o,
              paymentStatus: 'REFUNDED' as PaymentStatus,
              orderStatus: 'CANCELLED' as OrderStatus,
            }
          : o
      )
    );
    setIsProcessingRefund(false);
    setRefundingOrder(null);
    setSelectedOrder(null);
  };

  const columns: Column<OrderRecord>[] = [
    {
      key: 'orderNumber',
      header: 'Order Number',
      render: (order) => (
        <span className="font-mono font-medium text-foreground">{order.orderNumber}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (order) => (
        <div>
          <p className="font-semibold text-foreground text-sm">{order.customerName}</p>
          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total Value',
      render: (order) => (
        <div>
          <span className="font-semibold text-foreground">
            {formatCurrency(order.totalAmount)}
          </span>
          <p className="text-[11px] text-muted-foreground">
            {order.items.reduce((acc, i) => acc + i.quantity, 0)} item(s)
          </p>
        </div>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment State',
      render: (order) => {
        const variant =
          order.paymentStatus === 'PAID'
            ? 'success'
            : order.paymentStatus === 'REFUNDED'
            ? 'destructive'
            : 'warning';
        return <GlassBadge variant={variant} size="sm">{order.paymentStatus}</GlassBadge>;
      },
    },
    {
      key: 'orderStatus',
      header: 'Fulfillment State',
      render: (order) => {
        const variant =
          order.orderStatus === 'DELIVERED'
            ? 'success'
            : order.orderStatus === 'SHIPPED'
            ? 'info'
            : order.orderStatus === 'CANCELLED'
            ? 'destructive'
            : 'default';
        return <GlassBadge variant={variant} size="sm">{order.orderStatus}</GlassBadge>;
      },
    },
    {
      key: 'assignedManagerName',
      header: 'Managed By',
      render: (order) => (
        <div>
          {order.assignedManagerName ? (
            <GlassBadge variant="info" size="sm" className="font-medium flex items-center gap-1 w-fit">
              <UserCheck className="w-3 h-3" />
              <span>{order.assignedManagerName}</span>
            </GlassBadge>
          ) : (
            <GlassBadge variant="outline" size="sm" className="text-amber-400 border-amber-500/30 w-fit">
              ⚡ Unassigned
            </GlassBadge>
          )}
        </div>
      ),
    },
    {
      key: 'trackingNumber',
      header: 'Delhivery Tracking',
      render: (order) => (
        <div className="space-y-0.5">
          {order.trackingNumber ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href={`https://www.delhivery.com/track/package/${order.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
                title="Track package live on Delhivery One"
              >
                <span>{order.trackingNumber}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
              <span className="text-[10px] text-muted-foreground">({order.carrier || 'Delhivery One'})</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
          )}
          {(order as any).delhiveryRemarks && (
            <p className="text-[10px] text-amber-400 font-medium leading-tight flex items-center gap-1 mt-0.5">
              <span>⚠️ Delhivery One: Wallet balance needed to manifest on portal</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (order) => (
        <span className="text-xs text-muted-foreground font-mono">
          {formatDate(order.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (order) => (
        <div className="flex items-center justify-end gap-1.5">
          {order.trackingNumber && (
            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/shipping/delhivery/label?orderNumber=${order.orderNumber}`, '_blank')}
              className="gap-1 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30"
              title="Print Delhivery One Shipping Label"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Label</span>
            </GlassButton>
          )}
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => window.open(`/invoice/${order.orderNumber}`, '_blank')}
            className="gap-1 text-amber-500 hover:text-amber-400 hover:border-amber-500/30"
            title="Open official GST Tax Invoice"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Invoice</span>
          </GlassButton>
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => setSelectedOrder(order)}
            className="gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </GlassButton>
          {order.paymentStatus === 'PAID' && (
            <GlassButton
              variant="destructive"
              size="sm"
              onClick={() => {
                setRefundingOrder(order);
                setRefundReason('');
              }}
              title="Issue Razorpay refund"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </GlassButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Order Management & Fulfillment" userName="Super Admin">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Customer Orders Registry
            </h2>
            <GlassBadge variant="success" size="sm">
              Prepaid Only • No COD
            </GlassBadge>
            <GlassBadge variant="warning" size="sm">
              Non-Refundable (Free Breakage Replacement Only)
            </GlassBadge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inspect purchase records, address snapshots, fulfillment events, and manage national express air shipments
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
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Orders'}</span>
          </GlassButton>
        </div>
      </div>

      {/* Operations Manager Inbox Desk Filters */}
      <div className="p-3 rounded-2xl glass-panel space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-brand" />
            <span>Operations Manager Inbox Desk</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            Admin view: track and inspect orders managed by each operations manager
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setManagerFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              managerFilter === 'ALL'
                ? 'glass-primary shadow-sm font-semibold'
                : 'glass-control text-muted-foreground hover:text-foreground'
            }`}
          >
            All Inboxes ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setManagerFilter('UNASSIGNED')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              managerFilter === 'UNASSIGNED'
                ? 'glass-primary shadow-sm font-semibold'
                : 'glass-control text-amber-400 hover:text-amber-300'
            }`}
          >
            ⚡ Unassigned Queue ({orders.filter((o) => !o.assignedManagerName).length})
          </button>
          {allKnownManagers.map((mgrName) => {
            const count = orders.filter(
              (o) => o.assignedManagerName?.toLowerCase() === mgrName.toLowerCase()
            ).length;
            return (
              <button
                key={mgrName}
                type="button"
                onClick={() => setManagerFilter(mgrName)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  managerFilter.toLowerCase() === mgrName.toLowerCase()
                    ? 'glass-primary shadow-sm font-semibold'
                    : 'glass-control text-muted-foreground hover:text-foreground'
                }`}
              >
                👤 {mgrName} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <FilterBar
          options={[
            { label: 'All Orders', value: 'ALL', count: orders.length },
            {
              label: 'Pending',
              value: 'PENDING',
              count: orders.filter((o) => o.orderStatus === 'PENDING').length,
            },
            {
              label: 'Processing',
              value: 'PROCESSING',
              count: orders.filter((o) => o.orderStatus === 'PROCESSING').length,
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
          placeholder="Search by order #, customer, email..."
        />
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        keyExtractor={(o) => o.id}
        emptyMessage="No customer orders found."
      />

      {/* Order Detail Modal */}
      <FormDialog
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.orderNumber}`}
        description={`Placed on ${selectedOrder ? formatDate(selectedOrder.createdAt) : ''}`}
        maxWidth="2xl"
      >
        {selectedOrder && (
          <div className="space-y-5 pt-2">
            {/* Status and Actions Banner */}
            <div className="p-4 rounded-xl glass-control flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <GlassBadge
                  variant={selectedOrder.paymentStatus === 'PAID' ? 'success' : 'warning'}
                  size="md"
                >
                  Payment: {selectedOrder.paymentStatus}
                </GlassBadge>
                <GlassBadge
                  variant={
                    selectedOrder.orderStatus === 'DELIVERED'
                      ? 'success'
                      : selectedOrder.orderStatus === 'SHIPPED'
                      ? 'info'
                      : 'default'
                  }
                  size="md"
                >
                  Fulfillment: {selectedOrder.orderStatus}
                </GlassBadge>
              </div>

              {selectedOrder.paymentStatus === 'PAID' && (
                <GlassButton
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setRefundingOrder(selectedOrder);
                    setRefundReason('Transit breakage exception authorized by Admin (Non-refundable item override)');
                  }}
                  className="gap-1.5 text-xs"
                  title="Policy: Strictly non-refundable consumable food item. Use only for transit glass breakage exceptions."
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Transit Damage Override</span>
                </GlassButton>
              )}
            </div>

            {/* Customer & Shipping Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard variant="panel" className="p-4 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Customer Profile</span>
                </h4>
                <p className="text-sm font-semibold text-foreground">{selectedOrder.customerName}</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.customerEmail}</p>
                {selectedOrder.customerPhone && (
                  <p className="text-xs text-muted-foreground">{selectedOrder.customerPhone}</p>
                )}
              </GlassCard>

              <GlassCard variant="panel" className="p-4 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Delivery Address (Snapshot)</span>
                </h4>
                <p className="text-xs text-foreground font-medium">
                  {selectedOrder.shippingAddress.street}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} -{' '}
                  {selectedOrder.shippingAddress.postalCode}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedOrder.shippingAddress.country}
                </p>
              </GlassCard>
            </div>

            {/* Manager Assignment Desk Card */}
            <GlassCard variant="panel" className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-brand" />
                  <span>Assigned Operations Manager</span>
                </h4>
                {selectedOrder.assignedManagerName ? (
                  <GlassBadge variant="info" size="sm">
                    👤 {selectedOrder.assignedManagerName}
                  </GlassBadge>
                ) : (
                  <GlassBadge variant="outline" size="sm" className="text-amber-400 border-amber-500/30">
                    ⚡ Unassigned / Desk Pool
                  </GlassBadge>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={selectedOrder.assignedManagerName || ''}
                  onChange={(e) => handleAssignManager(selectedOrder.id, e.target.value || null)}
                  disabled={isAssigning}
                  className="flex-1 h-9 px-3 text-xs rounded-control glass-control text-foreground focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                >
                  <option value="" className="bg-[#1a1c23] text-white">⚡ Unassigned (Operations Desk Pool)</option>
                  {allKnownManagers.map((mgr) => (
                    <option key={mgr} value={mgr} className="bg-[#1a1c23] text-white">
                      👤 {mgr}
                    </option>
                  ))}
                </select>
                {selectedOrder.assignedManagerName && (
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAssignManager(selectedOrder.id, null)}
                    disabled={isAssigning}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Unassign
                  </GlassButton>
                )}
              </div>
            </GlassCard>

            {/* Items Purchased (Historical Snapshots) */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                <span>Purchased Line Items (Historical Snapshots)</span>
              </h4>
              <div className="divide-y divide-border/30 rounded-xl glass-control p-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="py-2.5 px-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{item.productName}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        SKU: {item.sku} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-xl glass-panel space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping:</span>
                <span>{selectedOrder.shippingCost === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Tax (18% GST):</span>
                <span>{formatCurrency(selectedOrder.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/40">
                <span>Total Amount Paid:</span>
                <span className="text-brand font-mono">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Print / View Tax Invoice Action */}
            <div className="pt-2 flex justify-end gap-2">
              <GlassButton
                variant="primary"
                size="sm"
                onClick={() => window.open(`/invoice/${selectedOrder.orderNumber}`, '_blank')}
                className="gap-2 w-full sm:w-auto"
              >
                <FileText className="w-4 h-4" />
                <span>View & Print GST Tax Invoice</span>
              </GlassButton>
            </div>
          </div>
        )}
      </FormDialog>

      {/* Refund / Replacement Override Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!refundingOrder}
        onCancel={() => setRefundingOrder(null)}
        onConfirm={handleExecuteRefund}
        isLoading={isProcessingRefund}
        title={`Authorize Transit Breakage Override for ${refundingOrder?.orderNumber}?`}
        description={`Store Policy Invariant: Ganesh Mule Pure Honey strictly enforces a NO REFUND POLICY on sealed raw honey food products. Authorizing this action marks the order as CANCELLED/REFUNDED for verified courier glass transit breakage or replacement.`}
        confirmLabel="Authorize Transit Override"
        isDestructive
      />
    </DashboardLayout>
  );
}
