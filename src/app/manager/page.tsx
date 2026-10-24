'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { MOCK_ORDERS, MOCK_PRODUCTS } from '@/lib/mock-data';
import { OrderRecord, ProductItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ShoppingBag,
  Truck,
  AlertTriangle,
  MessageSquare,
  Clock,
  ArrowRight,
  Boxes,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function ManagerOverviewPage() {
  const [orders, setOrders] = React.useState<OrderRecord[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>(MOCK_PRODUCTS);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchLiveManagerData = async () => {
    try {
      setIsRefreshing(true);
      const [ordRes, prodRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products')
      ]);
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        if (ordData.orders) setOrders(ordData.orders);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.products) setProducts(prodData.products);
      }
    } catch {} finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchLiveManagerData();
    const interval = setInterval(fetchLiveManagerData, 8000);
    return () => clearInterval(interval);
  }, []);

  const awaitingProcessing = orders.filter((o) => o.orderStatus === 'PROCESSING').length;
  const readyForShipment = orders.filter((o) => o.orderStatus === 'CONFIRMED').length;
  const lowStockItems = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);

  const pendingOrders = orders.filter(
    (o) => o.orderStatus === 'PROCESSING' || o.orderStatus === 'CONFIRMED'
  );

  const orderColumns: Column<OrderRecord>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (o) => <span className="font-mono font-medium text-foreground">{o.orderNumber}</span>,
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (o) => (
        <div>
          <p className="font-semibold text-foreground text-xs">{o.customerName}</p>
          <p className="text-[11px] text-muted-foreground">{o.shippingAddress.city}, {o.shippingAddress.state}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (o) => (
        <span className="text-xs text-muted-foreground">
          {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
        </span>
      ),
    },
    {
      key: 'orderStatus',
      header: 'Fulfillment Status',
      render: (o) => (
        <GlassBadge
          variant={o.orderStatus === 'CONFIRMED' ? 'info' : 'warning'}
          size="sm"
        >
          {o.orderStatus}
        </GlassBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (o) => (
        <Link href="/manager/orders">
          <GlassButton variant="primary" size="sm" className="gap-1">
            <span>Fulfill</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </GlassButton>
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout role="MANAGER" title="Operations Desk" userName="Vikram Mehta">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Awaiting Processing"
          value={awaitingProcessing}
          change={{ value: 'High priority', trend: 'up' }}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="Ready for Shipment"
          value={readyForShipment}
          change={{ value: 'Courier scheduled', trend: 'neutral' }}
          icon={<Truck className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockItems.length}
          change={{ value: 'Immediate restock', trend: 'down' }}
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
        />
        <StatCard
          title="Live Chat Conversations"
          value="2 Open"
          change={{ value: 'Chatwoot connected', trend: 'up' }}
          icon={<MessageSquare className="w-5 h-5 text-emerald-500" />}
        />
      </div>

      {/* Main Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Orders Queue */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">
                Fulfillment Action Queue
              </h2>
              <p className="text-xs text-muted-foreground">
                Verified paid orders pending packaging, carrier assignment, and tracking label printing
              </p>
            </div>
            <Link href="/manager/orders">
              <GlassButton variant="outline" size="sm">
                Full Queue
              </GlassButton>
            </Link>
          </div>

          <DataTable
            columns={orderColumns}
            data={pendingOrders}
            keyExtractor={(o) => o.id}
            emptyMessage="No pending orders awaiting fulfillment!"
          />
        </div>

        {/* Low Stock Alerts & Chatwoot Shortcuts */}
        <div className="space-y-6">
          <GlassCard variant="card" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-rose-500" />
                <span>Restock Alerts</span>
              </h3>
              <GlassBadge variant="destructive" size="sm">
                {lowStockItems.length} Items
              </GlassBadge>
            </div>

            <div className="space-y-2.5">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl glass-control flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">{item.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-rose-500">
                      {item.stockQuantity} left
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/manager/inventory" className="block pt-1">
              <GlassButton variant="secondary" size="sm" className="w-full">
                Go to Inventory Desk
              </GlassButton>
            </Link>
          </GlassCard>

          {/* Quick Chatwoot Desk Launch */}
          <GlassCard variant="card" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span>Live Support Desk</span>
              </h3>
              <GlassBadge variant="success" size="sm">Chatwoot Agent</GlassBadge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Customers waiting for live response regarding order deliveries and product inquiries.
            </p>
            <Link href="/manager/support" className="block pt-1">
              <GlassButton variant="primary" size="sm" className="w-full">
                Open Support Console
              </GlassButton>
            </Link>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
