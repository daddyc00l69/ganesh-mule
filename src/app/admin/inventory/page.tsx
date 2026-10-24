'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassInput } from '@/components/ui/glass-input';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { FormDialog } from '@/components/ui/form-dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { MOCK_PRODUCTS, MOCK_INVENTORY_MOVEMENTS } from '@/lib/mock-data';
import { ProductItem, InventoryMovementRecord } from '@/types';
import { formatDate } from '@/lib/utils';
import { Boxes, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, PlusCircle } from 'lucide-react';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [movements, setMovements] = useState<InventoryMovementRecord[]>(MOCK_INVENTORY_MOVEMENTS);
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LOGS'>('STOCK');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInventory = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data.products) setProducts(data.products);
        if (data.movements) setMovements(data.movements);
      }
    } catch {} finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchInventory();
    const interval = setInterval(fetchInventory, 8000);
    return () => clearInterval(interval);
  }, []);

  // Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<ProductItem | null>(null);
  const [deltaQuantity, setDeltaQuantity] = useState<number>(5);
  const [reason, setReason] = useState<'RESTOCK' | 'MANUAL_ADJUSTMENT' | 'DAMAGE_WRITE_OFF'>('RESTOCK');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMovements = movements.filter(
    (m) =>
      m.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdjust = (p: ProductItem) => {
    setAdjustingProduct(p);
    setDeltaQuantity(5);
    setReason('RESTOCK');
    setReferenceId(`RESTOCK-${new Date().toISOString().slice(0, 10)}`);
    setNotes('');
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setIsSubmitting(true);

    const actualDelta = reason === 'DAMAGE_WRITE_OFF' ? -Math.abs(deltaQuantity) : deltaQuantity;
    const newQuantity = Math.max(0, adjustingProduct.stockQuantity + actualDelta);

    const newMovement: InventoryMovementRecord = {
      id: `mov-${Date.now()}`,
      productId: adjustingProduct.id,
      productName: adjustingProduct.name,
      sku: adjustingProduct.sku,
      delta: actualDelta,
      quantityAfter: newQuantity,
      reason,
      referenceId,
      actorName: 'Super Admin',
      notes,
      createdAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMovement),
      });
    } catch {}

    setProducts((prev) =>
      prev.map((p) =>
        p.id === adjustingProduct.id ? { ...p, stockQuantity: newQuantity } : p
      )
    );
    setMovements((prev) => [newMovement, ...prev]);

    setIsSubmitting(false);
    setAdjustingProduct(null);
  };

  const stockColumns: Column<ProductItem>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div>
          <p className="font-semibold text-foreground text-sm">{p.name}</p>
          <p className="text-xs font-mono text-muted-foreground">{p.sku}</p>
        </div>
      ),
    },
    {
      key: 'stockQuantity',
      header: 'Physical Stock',
      render: (p) => (
        <span className="font-mono font-bold text-foreground text-sm">
          {p.stockQuantity}
        </span>
      ),
    },
    {
      key: 'reservedQuantity',
      header: 'Reserved in Orders',
      render: (p) => (
        <span className="font-mono text-xs text-muted-foreground">
          {p.reservedQuantity}
        </span>
      ),
    },
    {
      key: 'availableQuantity',
      header: 'Available for Sale',
      render: (p) => {
        const available = Math.max(0, p.stockQuantity - p.reservedQuantity);
        const isLow = available <= p.lowStockThreshold;
        return (
          <GlassBadge variant={isLow ? 'destructive' : 'success'} size="sm">
            {available} available
          </GlassBadge>
        );
      },
    },
    {
      key: 'lowStockThreshold',
      header: 'Alert Threshold',
      render: (p) => (
        <span className="text-xs font-mono text-muted-foreground">
          ≤ {p.lowStockThreshold} units
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (p) => (
        <GlassButton
          variant="outline"
          size="sm"
          onClick={() => handleOpenAdjust(p)}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Adjust Stock</span>
        </GlassButton>
      ),
    },
  ];

  const logColumns: Column<InventoryMovementRecord>[] = [
    {
      key: 'productName',
      header: 'Product',
      render: (m) => (
        <div>
          <p className="font-semibold text-foreground text-sm">{m.productName}</p>
          <p className="text-xs font-mono text-muted-foreground">{m.sku}</p>
        </div>
      ),
    },
    {
      key: 'delta',
      header: 'Change',
      render: (m) => {
        const isPositive = m.delta > 0;
        return (
          <span
            className={`font-mono font-bold inline-flex items-center gap-1 ${
              isPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {isPositive ? `+${m.delta}` : m.delta}
          </span>
        );
      },
    },
    {
      key: 'quantityAfter',
      header: 'Balance',
      render: (m) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {m.quantityAfter}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (m) => (
        <GlassBadge variant="default" size="sm">
          {m.reason}
        </GlassBadge>
      ),
    },
    {
      key: 'actorName',
      header: 'Actor',
      render: (m) => (
        <span className="text-xs text-foreground/80">{m.actorName || 'System'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (m) => (
        <span className="text-xs text-muted-foreground font-mono">
          {formatDate(m.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Inventory & Stock Movements" userName="Super Admin">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Inventory & Warehouse Movements
          </h2>
          <p className="text-xs text-muted-foreground">
            Track physical stock, reservations, restocks, and inspect immutable adjustment audit trails
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 glass-panel rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('STOCK')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'STOCK'
                ? 'glass-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Stock Levels
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LOGS')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'LOGS'
                ? 'glass-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Movement Audit Trail
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search by product name, SKU, or adjustment reason..."
        />
      </div>

      {activeTab === 'STOCK' ? (
        <DataTable
          columns={stockColumns}
          data={filteredProducts}
          keyExtractor={(p) => p.id}
          emptyMessage="No inventory items found."
        />
      ) : (
        <DataTable
          columns={logColumns}
          data={filteredMovements}
          keyExtractor={(m) => m.id}
          emptyMessage="No stock movements recorded yet."
        />
      )}

      {/* Adjust Stock Dialog */}
      <FormDialog
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        title={`Adjust Stock: ${adjustingProduct?.name}`}
        description="Records an auditable inventory movement with actor attribution"
        maxWidth="lg"
      >
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4 pt-2">
          <div className="p-3 rounded-xl glass-control flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Physical Stock:</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {adjustingProduct?.stockQuantity} units
            </span>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-foreground/85">
              Adjustment Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="glass-input w-full h-10 px-3 text-sm rounded-control text-foreground outline-none focus:ring-2 focus:ring-ring/40 bg-card"
            >
              <option value="RESTOCK" className="bg-background text-foreground">
                RESTOCK (Supplier delivery / restocking batch)
              </option>
              <option value="MANUAL_ADJUSTMENT" className="bg-background text-foreground">
                MANUAL_ADJUSTMENT (Cycle count reconciliation)
              </option>
              <option value="DAMAGE_WRITE_OFF" className="bg-background text-foreground">
                DAMAGE_WRITE_OFF (Damaged or expired goods write-off)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassInput
              label={reason === 'DAMAGE_WRITE_OFF' ? 'Units to Write Off' : 'Units to Add'}
              type="number"
              required
              min={1}
              value={deltaQuantity}
              onChange={(e) => setDeltaQuantity(Number(e.target.value))}
            />
            <GlassInput
              label="Reference ID / PO Number"
              required
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. PO-BATCH-994"
            />
          </div>

          <GlassInput
            label="Internal Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Warehouse bay location, inspection batch, etc."
          />

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
            <GlassButton type="button" variant="outline" onClick={() => setAdjustingProduct(null)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" isLoading={isSubmitting}>
              Commit Adjustment
            </GlassButton>
          </div>
        </form>
      </FormDialog>
    </DashboardLayout>
  );
}
