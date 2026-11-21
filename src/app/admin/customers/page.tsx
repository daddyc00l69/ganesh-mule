'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { SearchInput } from '@/components/ui/search-input';
import { FormDialog } from '@/components/ui/form-dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { UserCheck, ShoppingBag, Eye, MapPin, Mail, Phone, Download, RefreshCw, ShieldCheck } from 'lucide-react';

interface CustomerView {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  isRegistered?: boolean;
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerView | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        if (data.customers && Array.isArray(data.customers)) {
          setCustomers(data.customers);
        }
      }
    } catch (err) {
      console.warn('[Fetch Customers Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  const columns: Column<CustomerView>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.avatarUrl ? (
            <img src={c.avatarUrl} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full glass-control flex items-center justify-center font-bold text-xs text-foreground bg-amber-500/10 text-amber-900 border border-amber-500/20">
              {c.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground text-sm">{c.name}</p>
              {c.isRegistered && (
                <span title="Verified Google / Registered User" className="inline-flex text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'ordersCount',
      header: 'Total Orders',
      render: (c) => (
        <span className="font-mono font-medium text-foreground text-xs">
          {c.ordersCount} order(s)
        </span>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Lifetime Value (LTV)',
      render: (c) => (
        <span className="font-semibold text-foreground font-mono text-sm text-emerald-600">
          {formatCurrency(c.totalSpent)}
        </span>
      ),
    },
    {
      key: 'lastOrderDate',
      header: 'Last Purchase',
      render: (c) => (
        <span className="text-xs text-muted-foreground font-mono">
          {c.lastOrderDate === 'N/A' ? 'No orders yet' : formatDate(c.lastOrderDate)}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (c) => (
        <span className="text-xs font-mono text-muted-foreground">
          {c.phone || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (c) => (
        <GlassButton variant="outline" size="sm" onClick={() => setSelectedCustomer(c)}>
          <Eye className="w-3.5 h-3.5 mr-1" />
          <span>View Profile</span>
        </GlassButton>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Customer Accounts & History" userName="Super Admin">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Customer Accounts & Lifetime Value</h2>
          <p className="text-xs text-muted-foreground">
            Authoritative customer records aggregated across all live orders and verified Google/Customer profiles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton variant="outline" size="sm" onClick={fetchCustomers} isLoading={isLoading} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </GlassButton>

          <a href="/api/admin/reports/export?type=customers" download>
            <GlassButton variant="primary" size="sm" className="gap-1.5 shadow-sm">
              <Download className="w-3.5 h-3.5" />
              <span>Export Customers (Excel CSV)</span>
            </GlassButton>
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search customers by name, email or phone..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredCustomers}
        keyExtractor={(c) => c.id}
        emptyMessage="No customer records found."
      />

      {/* Customer Profile Modal */}
      <FormDialog
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Customer: ${selectedCustomer?.name}`}
        description="Lifetime transaction history, privacy-shielded profile, and contact details"
        maxWidth="xl"
      >
        {selectedCustomer && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl glass-control flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-foreground">{selectedCustomer.name}</p>
                  {selectedCustomer.isRegistered && (
                    <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                      Registered Customer
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedCustomer.email}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.phone || 'Phone on file'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium">Lifetime Spend (LTV):</p>
                <p className="text-xl font-bold text-emerald-600 font-mono">
                  {formatCurrency(selectedCustomer.totalSpent)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {selectedCustomer.ordersCount} Total Purchase(s)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Recent Order History</span>
                <span className="text-[11px] lowercase font-normal text-muted-foreground">
                  (Snapshot protected against modifications)
                </span>
              </h4>

              {selectedCustomer.recentOrders && selectedCustomer.recentOrders.length > 0 ? (
                <div className="divide-y divide-border/30 rounded-xl glass-panel p-2">
                  {selectedCustomer.recentOrders.map((o) => (
                    <div key={o.id} className="py-2.5 px-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-medium text-foreground">{o.orderNumber}</span>
                        <p className="text-[11px] text-muted-foreground font-mono">{formatDate(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <GlassBadge variant={o.orderStatus === 'DELIVERED' ? 'success' : o.orderStatus === 'CANCELLED' ? 'destructive' : 'default'} size="sm">
                          {o.orderStatus}
                        </GlassBadge>
                        <span className="font-semibold text-foreground font-mono">{formatCurrency(o.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  No previous order history for this account.
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Privacy Shield:</strong> Sensitive credentials, OAuth tokens, and password hashes are strictly redacted server-side.
              </span>
            </div>
          </div>
        )}
      </FormDialog>
    </DashboardLayout>
  );
}
