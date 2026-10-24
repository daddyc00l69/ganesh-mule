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
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>(MOCK_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live order synchronization
  const fetchLiveOrders = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/orders');
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

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Refund Modal
  const [refundingOrder, setRefundingOrder] = useState<OrderRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ? true : o.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
