'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { SearchInput } from '@/components/ui/search-input';
import { FormDialog } from '@/components/ui/form-dialog';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/utils';
import { UserCheck, ShoppingBag, Eye, MapPin, Mail, Phone } from 'lucide-react';

interface CustomerView {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerView | null>(null);

  // Derive customers from orders
  const customerMap = new Map<string, CustomerView>();
  MOCK_ORDERS.forEach((o) => {
    const existing = customerMap.get(o.customerEmail);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpent += o.totalAmount;
      if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = o.createdAt;
      }
    } else {
      customerMap.set(o.customerEmail, {
        id: o.userId,
        name: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone || '+91 98200 00000',
        ordersCount: 1,
        totalSpent: o.totalAmount,
        lastOrderDate: o.createdAt,
      });
    }
  });

  const customers = Array.from(customerMap.values());
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<CustomerView>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full glass-control flex items-center justify-center font-bold text-xs text-foreground">
            {c.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{c.name}</p>
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
        <span className="font-semibold text-foreground font-mono text-sm">
          {formatCurrency(c.totalSpent)}
        </span>
      ),
    },
    {
      key: 'lastOrderDate',
      header: 'Last Purchase',
      render: (c) => (
        <span className="text-xs text-muted-foreground font-mono">
          {formatDate(c.lastOrderDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <GlassBadge variant="success" size="sm">Active</GlassBadge>,
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

  const customerOrders = selectedCustomer
    ? MOCK_ORDERS.filter((o) => o.customerEmail === selectedCustomer.email)
    : [];

  return (
    <DashboardLayout role="ADMIN" title="Customer Accounts & History" userName="Super Admin">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">Customer Accounts</h2>
        <p className="text-xs text-muted-foreground">
          View customer engagement metrics, lifetime order values, and delivery address profiles
        </p>
      </div>

      <div className="flex items-center justify-between">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search customers by name or email..."
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
        description="Lifetime transaction history and contact profile"
        maxWidth="xl"
      >
        {selectedCustomer && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl glass-control flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-bold text-foreground">{selectedCustomer.name}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Lifetime Value:</p>
                <p className="text-base font-bold text-brand font-mono">
                  {formatCurrency(selectedCustomer.totalSpent)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Order History ({customerOrders.length})
              </h4>
              <div className="divide-y divide-border/30 rounded-xl glass-panel p-2">
                {customerOrders.map((o) => (
                  <div key={o.id} className="py-2.5 px-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-medium text-foreground">{o.orderNumber}</span>
                      <p className="text-[11px] text-muted-foreground font-mono">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <GlassBadge variant={o.orderStatus === 'DELIVERED' ? 'success' : 'default'} size="sm">
                        {o.orderStatus}
                      </GlassBadge>
                      <span className="font-semibold text-foreground">{formatCurrency(o.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </FormDialog>
    </DashboardLayout>
  );
}
