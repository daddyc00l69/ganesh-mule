'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard } from '@/components/ui/chart-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import {
  MOCK_ORDERS,
  MOCK_PRODUCTS,
  MOCK_ANALYTICS_REVENUE,
  MOCK_AUDIT_LOGS,
} from '@/lib/mock-data';
import { ProductItem, OrderRecord } from '@/types';
import { RefreshCw } from 'lucide-react';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Users,
  Package,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminOverviewPage() {
  const [orders, setOrders] = React.useState<OrderRecord[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>(MOCK_PRODUCTS);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchLiveOverview = async () => {
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
    fetchLiveOverview();
    const interval = setInterval(fetchLiveOverview, 8000);
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID' || o.orderStatus === 'PROCESSING' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'SHIPPED' || o.orderStatus === 'DELIVERED')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const pendingOrders = orders.filter(
    (o) => o.orderStatus === 'PENDING' || o.orderStatus === 'PROCESSING' || o.orderStatus === 'CONFIRMED'
  ).length;

  const lowStockCount = products.filter(
    (p) => p.stockQuantity <= p.lowStockThreshold
  ).length;

  // Generate dynamic 7-day revenue velocity based on live orders
  const chartData = React.useMemo(() => {
    if (orders.length === 0) return MOCK_ANALYTICS_REVENUE;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const map = new Map<string, { day: string; revenue: number; orders: number }>();
    days.forEach((d) => map.set(d, { day: d, revenue: 0, orders: 0 }));

    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const dayName = days[d.getDay() === 0 ? 6 : d.getDay() - 1] || 'Today';
      const existing = map.get(dayName) || { day: dayName, revenue: 0, orders: 0 };
      existing.revenue += Math.round(o.totalAmount / 100);
      existing.orders += 1;
      map.set(dayName, existing);
    });

    return Array.from(map.values());
  }, [orders]);

  const orderColumns: Column<OrderRecord>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (order) => (
        <span className="font-mono font-medium text-foreground">{order.orderNumber}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (order) => (
        <div>
          <p className="font-medium text-foreground">{order.customerName}</p>
          <p className="text-[11px] text-muted-foreground">{order.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (order) => (
        <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (order) => (
        <GlassBadge
          variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
          size="sm"
        >
          {order.paymentStatus}
        </GlassBadge>
      ),
    },
    {
      key: 'orderStatus',
      header: 'Fulfillment',
      render: (order) => (
        <GlassBadge
          variant={
            order.orderStatus === 'DELIVERED'
              ? 'success'
              : order.orderStatus === 'SHIPPED'
              ? 'info'
              : order.orderStatus === 'CANCELLED'
              ? 'destructive'
              : 'default'
          }
          size="sm"
        >
          {order.orderStatus}
        </GlassBadge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (order) => (
        <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Executive Overview" userName="Super Admin">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalRevenue)}
          change={{ value: '+18.4%', trend: 'up', label: 'vs last month' }}
          icon={<IndianRupee className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          title="Active Orders"
          value={orders.length}
          change={{ value: `${orders.length} in system`, trend: 'up', label: 'live sync' }}
          icon={<ShoppingBag className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title="Pending Processing"
          value={pendingOrders}
          change={{ value: 'Requires Action', trend: 'neutral' }}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          change={{ value: 'Restock needed', trend: 'down' }}
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Weekly Revenue Velocity"
            description="Gross merchandise sales across the current 7-day operating period (INR)"
            action={
              <GlassBadge variant="default" size="sm">
                Last 7 Days
              </GlassBadge>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-popover p-2.5 rounded-xl text-xs space-y-1 shadow-lg border border-border/40">
                          <p className="font-semibold text-foreground">{payload[0].payload.day}</p>
                          <p className="text-emerald-500 font-mono font-medium">
                            Revenue: ₹{payload[0].value?.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Order Volume Histogram */}
        <div>
          <ChartCard
            title="Order Volume"
            description="Daily completed order counts"
            action={
              <span className="text-xs font-semibold text-muted-foreground">Units</span>
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-popover p-2.5 rounded-xl text-xs space-y-1 shadow-lg border border-border/40">
                          <p className="font-semibold text-foreground">{payload[0].payload.day}</p>
                          <p className="text-blue-500 font-mono font-medium">
                            Orders: {payload[0].value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="orders" fill="var(--color-primary)" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Tables & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">Recent Orders</h2>
              <p className="text-xs text-muted-foreground">Latest live transactions across the storefront</p>
            </div>
            <div className="flex items-center gap-2">
              <GlassButton
                variant="outline"
                size="sm"
                onClick={fetchLiveOverview}
                isLoading={isRefreshing}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </GlassButton>
              <Link href="/admin/orders">
                <GlassButton variant="outline" size="sm" className="gap-1.5">
                  <span>View All Orders</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </GlassButton>
              </Link>
            </div>
          </div>

          <DataTable
            columns={orderColumns}
            data={orders.slice(0, 5)}
            keyExtractor={(order) => order.id}
          />
        </div>

        {/* Top Products & Low Stock Pane */}
        <div className="space-y-6">
          <GlassCard variant="card" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-sm font-semibold text-foreground">Catalog Health & Low Stock</h3>
              <GlassBadge variant="destructive" size="sm">
                {lowStockCount} Action items
              </GlassBadge>
            </div>

            <div className="space-y-3">
              {products.slice(0, 4).map((product) => {
                const isLowStock = product.stockQuantity <= product.lowStockThreshold;
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-accent/20 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <p className="text-xs font-medium text-foreground truncate">
                        {product.name}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {product.sku}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isLowStock
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                            : 'bg-muted/50 text-foreground'
                        }`}
                      >
                        {product.stockQuantity} in stock
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link href="/admin/inventory" className="block pt-2">
              <GlassButton variant="secondary" size="sm" className="w-full">
                Manage Stock & Restocks
              </GlassButton>
            </Link>
          </GlassCard>

          {/* Recent Audit Actions */}
          <GlassCard variant="card" className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border/40">
              Security Audit Activity
            </h3>
            <div className="space-y-2.5">
              {MOCK_AUDIT_LOGS.map((log) => (
                <div key={log.id} className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{log.action}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    by {log.actorName} ({log.ipAddress})
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
