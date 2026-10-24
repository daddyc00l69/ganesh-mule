'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassInput } from '@/components/ui/glass-input';
import { SearchInput } from '@/components/ui/search-input';
import { FormDialog } from '@/components/ui/form-dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { MOCK_PRODUCTS, MOCK_INVENTORY_MOVEMENTS } from '@/lib/mock-data';
import { ProductItem, InventoryMovementRecord } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Boxes,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Plus,
  Minus,
  Save,
  RotateCcw,
  Sparkles,
  FileText,
} from 'lucide-react';

export default function ManagerInventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [movements, setMovements] = useState<InventoryMovementRecord[]>(MOCK_INVENTORY_MOVEMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'HEALTHY'>('ALL');
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LOGS'>('STOCK');
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

  // Inline Direct Editing State
  const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [savedSuccessRows, setSavedSuccessRows] = useState<Record<string, boolean>>({});
  const [bulkSaving, setBulkSaving] = useState(false);

  // Formal Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<ProductItem | null>(null);
  const [deltaQuantity, setDeltaQuantity] = useState<number>(5);
  const [reason, setReason] = useState<'RESTOCK' | 'MANUAL_ADJUSTMENT'>('RESTOCK');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const available = Math.max(0, p.stockQuantity - p.reservedQuantity);
    if (!matchesSearch) return false;

    if (statusFilter === 'LOW') return available > 0 && available <= p.lowStockThreshold;
    if (statusFilter === 'OUT') return p.stockQuantity <= 0;
    if (statusFilter === 'HEALTHY') return available > p.lowStockThreshold;
    return true;
  });

  const modifiedCount = Object.keys(editedQuantities).length;

  // Direct Inline Quantity Handlers
  const handleQuantityInputChange = (productId: string, val: string) => {
    const num = parseInt(val, 10);
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (isNaN(num) || num < 0) {
      const next = { ...editedQuantities };
      delete next[productId];
      setEditedQuantities(next);
      return;
    }

    if (num === product.stockQuantity) {
      const next = { ...editedQuantities };
      delete next[productId];
      setEditedQuantities(next);
    } else {
      setEditedQuantities((prev) => ({ ...prev, [productId]: num }));
    }
  };

  const handleStepQuantity = (productId: string, step: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const currentVal = editedQuantities[productId] !== undefined
      ? editedQuantities[productId]
      : product.stockQuantity;

    const target = Math.max(0, currentVal + step);

    if (target === product.stockQuantity) {
      const next = { ...editedQuantities };
      delete next[productId];
      setEditedQuantities(next);
    } else {
      setEditedQuantities((prev) => ({ ...prev, [productId]: target }));
    }
  };

  const handleResetRow = (productId: string) => {
    const next = { ...editedQuantities };
    delete next[productId];
    setEditedQuantities(next);
  };

  const handleSaveRow = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product || editedQuantities[productId] === undefined) return;

    const newTargetStock = editedQuantities[productId];
    const delta = newTargetStock - product.stockQuantity;
    if (delta === 0) {
      handleResetRow(productId);
      return;
    }

    setSavingRows((prev) => ({ ...prev, [productId]: true }));

    const newMovement: InventoryMovementRecord = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId,
      productName: product.name,
      sku: product.sku,
      delta,
      quantityAfter: newTargetStock,
      reason: delta > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
      referenceId: `DIRECT-EDIT-${new Date().toISOString().slice(0, 10)}`,
      actorName: 'Vikram Mehta (Manager)',
      notes: `Direct inline quantity update from ${product.stockQuantity} to ${newTargetStock}`,
      createdAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          targetQuantity: newTargetStock,
          reason: newMovement.reason,
          referenceId: newMovement.referenceId,
          notes: newMovement.notes,
        }),
      });
    } catch {}

    // Update state
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newTargetStock } : p))
    );
    setMovements((prev) => [newMovement, ...prev]);

    // Clear dirty state
    const nextEdits = { ...editedQuantities };
    delete nextEdits[productId];
    setEditedQuantities(nextEdits);

    setSavingRows((prev) => ({ ...prev, [productId]: false }));
    setSavedSuccessRows((prev) => ({ ...prev, [productId]: true }));

    setTimeout(() => {
      setSavedSuccessRows((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    }, 2500);
  };

  const handleSaveAllChanges = async () => {
    const modifiedIds = Object.keys(editedQuantities);
    if (modifiedIds.length === 0) return;

    setBulkSaving(true);

    for (const id of modifiedIds) {
      await handleSaveRow(id);
    }

    setBulkSaving(false);
  };

  const handleDiscardAllChanges = () => {
    setEditedQuantities({});
  };

  // Modal Handlers
  const handleOpenAdjust = (p: ProductItem) => {
    setAdjustingProduct(p);
    setDeltaQuantity(5);
    setReason('RESTOCK');
    setReferenceId(`RESTOCK-${new Date().toISOString().slice(0, 10)}`);
    setNotes('');
    setErrorMsg(null);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const targetStock = adjustingProduct.stockQuantity + deltaQuantity;
    if (targetStock < 0) {
      setErrorMsg(`Negative stock is prohibited. Maximum deductible units: ${adjustingProduct.stockQuantity}.`);
      setIsSubmitting(false);
      return;
    }

    const newMovement: InventoryMovementRecord = {
      id: `mov-${Date.now()}`,
      productId: adjustingProduct.id,
      productName: adjustingProduct.name,
      sku: adjustingProduct.sku,
      delta: deltaQuantity,
      quantityAfter: targetStock,
      reason,
      referenceId,
      actorName: 'Vikram Mehta (Manager)',
      notes,
      createdAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustingProduct.id,
          delta: deltaQuantity,
          reason,
          referenceId,
          notes,
        }),
      });
    } catch {}

    setProducts((prev) =>
      prev.map((p) => (p.id === adjustingProduct.id ? { ...p, stockQuantity: targetStock } : p))
    );
    setMovements((prev) => [newMovement, ...prev]);

    setIsSubmitting(false);
    setAdjustingProduct(null);
  };

  // Table Columns
  const columns: Column<ProductItem>[] = [
    {
      key: 'name',
      header: 'Product / SKU',
      render: (p) => (
        <div>
          <p className="font-semibold text-foreground text-sm">{p.name}</p>
          <p className="text-xs font-mono text-muted-foreground">{p.sku}</p>
        </div>
      ),
    },
    {
      key: 'stockQuantity',
      header: 'Direct Quantity Edit (Manager)',
      render: (p) => {
        const isModified = editedQuantities[p.id] !== undefined;
        const currentEditValue = isModified ? editedQuantities[p.id] : p.stockQuantity;
        const isSaving = savingRows[p.id];
        const isSaved = savedSuccessRows[p.id];

        return (
          <div className="flex items-center gap-2">
            {/* Quick Decrement Steppers */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepQuantity(p.id, -5)}
                className="w-7 h-7 rounded-lg glass-control flex items-center justify-center text-[11px] font-mono hover:bg-white/10 active:scale-95 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Subtract 5 units"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => handleStepQuantity(p.id, -1)}
                className="w-7 h-7 rounded-lg glass-control flex items-center justify-center text-xs hover:bg-white/10 active:scale-95 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Subtract 1 unit"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>

            {/* Direct Editable Numeric Input */}
            <div className="relative">
              <input
                type="number"
                min="0"
                value={currentEditValue}
                onChange={(e) => handleQuantityInputChange(p.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveRow(p.id);
                  }
                }}
                className={`w-20 h-8 px-2 text-center font-mono font-bold text-sm rounded-lg outline-none transition-all ${
                  isModified
                    ? 'border-2 border-amber-400 bg-amber-500/10 text-amber-300 ring-2 ring-amber-500/20'
                    : 'glass-input text-foreground bg-card'
                }`}
                title="Type target stock directly and hit Enter or click Save"
              />
            </div>

            {/* Quick Increment Steppers */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepQuantity(p.id, 1)}
                className="w-7 h-7 rounded-lg glass-control flex items-center justify-center text-xs hover:bg-white/10 active:scale-95 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Add 1 unit"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleStepQuantity(p.id, 5)}
                className="w-7 h-7 rounded-lg glass-control flex items-center justify-center text-[11px] font-mono hover:bg-white/10 active:scale-95 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Add 5 units"
              >
                +5
              </button>
            </div>

            {/* Direct Save Button */}
            {isModified ? (
              <div className="flex items-center gap-1 ml-1 animate-in fade-in">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveRow(p.id)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 cursor-pointer"
                  title="Save new stock count"
                >
                  <Save className="w-3 h-3" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResetRow(p.id)}
                  className="p-1.5 rounded-lg glass-control text-muted-foreground hover:text-foreground hover:bg-white/10"
                  title="Discard edit"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            ) : isSaved ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 ml-2 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Updated!</span>
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'reservedQuantity',
      header: 'Customer Carts',
      render: (p) => (
        <span className="font-mono text-xs text-muted-foreground">
          {p.reservedQuantity} reserved
        </span>
      ),
    },
    {
      key: 'availableQuantity',
      header: 'Available for Dispatch',
      render: (p) => {
        const effectiveStock = editedQuantities[p.id] !== undefined
          ? editedQuantities[p.id]
          : p.stockQuantity;
        const available = Math.max(0, effectiveStock - p.reservedQuantity);
        const isLow = available <= p.lowStockThreshold;
        return (
          <GlassBadge variant={isLow ? 'destructive' : 'success'} size="sm">
            {available} available
          </GlassBadge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Formal PO Log',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (p) => (
        <GlassButton variant="outline" size="sm" onClick={() => handleOpenAdjust(p)}>
          <FileText className="w-3.5 h-3.5 mr-1 text-amber-400" />
          <span>Restock PO</span>
        </GlassButton>
      ),
    },
  ];

  return (
    <DashboardLayout role="MANAGER" title="Inventory Management Desk" userName="Vikram Mehta">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Direct Inventory Quantity Control
            </h2>
            <GlassBadge variant="success" size="sm">
              Manager Privileges Active
            </GlassBadge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click into any quantity box or use the +/- steppers to update warehouse honey stock directly with real-time audit logging.
          </p>
        </div>

        {/* Global Bulk Save if rows were modified */}
        {modifiedCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-2xl glass-control border border-amber-500/40 animate-in zoom-in-95">
            <span className="text-xs font-semibold text-amber-400 px-2">
              {modifiedCount} {modifiedCount === 1 ? 'item' : 'items'} modified
            </span>
            <GlassButton
              variant="primary"
              size="sm"
              isLoading={bulkSaving}
              onClick={handleSaveAllChanges}
              className="gap-1.5 font-bold"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save All ({modifiedCount})</span>
            </GlassButton>
            <GlassButton
              variant="outline"
              size="sm"
              onClick={handleDiscardAllChanges}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Discard</span>
            </GlassButton>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('STOCK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'STOCK'
                ? 'glass-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Physical Stock ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LOGS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'LOGS'
                ? 'glass-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Audit Trail ({movements.length} logs)
          </button>
        </div>

        {activeTab === 'STOCK' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground text-[11px]">Filter:</span>
            {(['ALL', 'HEALTHY', 'LOW', 'OUT'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === filter
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-muted-foreground hover:text-foreground glass-control'
                }`}
              >
                {filter === 'ALL' && 'All'}
                {filter === 'HEALTHY' && 'Healthy'}
                {filter === 'LOW' && 'Low Stock (≤15)'}
                {filter === 'OUT' && 'Out of Stock'}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'STOCK' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Filter products by name or SKU..."
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredProducts}
            keyExtractor={(p) => p.id}
            emptyMessage="No catalog items found matching criteria."
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/30 overflow-hidden glass-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/40 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Adjustment</th>
                  <th className="p-3.5">Stock After</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Authorized Actor</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-white/5">
                    <td className="p-3.5 font-mono text-muted-foreground">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="p-3.5 font-medium text-foreground">
                      {m.productName}
                      <span className="block text-[10px] font-mono text-muted-foreground">{m.sku}</span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded ${
                          m.delta > 0
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      {m.quantityAfter}
                    </td>
                    <td className="p-3.5">
                      <GlassBadge size="sm">{m.reason}</GlassBadge>
                    </td>
                    <td className="p-3.5 text-foreground">{m.actorName}</td>
                    <td className="p-3.5 text-muted-foreground max-w-xs truncate">
                      {m.notes || m.referenceId || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Formal Restock PO Dialog */}
      <FormDialog
        isOpen={!!adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        title={`Formal Restock PO: ${adjustingProduct?.name}`}
        description="Records an auditable purchase order shipment or bin audit"
        maxWidth="lg"
      >
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg">
              {errorMsg}
            </p>
          )}

          <div className="p-3.5 rounded-xl glass-control flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current Stock in Warehouse:</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {adjustingProduct?.stockQuantity} units
            </span>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-foreground/85">
              Adjustment Type
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="glass-input w-full h-10 px-3 text-sm rounded-control text-foreground outline-none bg-card"
            >
              <option value="RESTOCK">RESTOCK (Warehouse inbound shipment)</option>
              <option value="MANUAL_ADJUSTMENT">MANUAL_ADJUSTMENT (Cycle count reconciliation)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassInput
              label="Quantity Delta (positive to add, negative to deduct)"
              type="number"
              required
              value={deltaQuantity}
              onChange={(e) => setDeltaQuantity(Number(e.target.value))}
            />
            <GlassInput
              label="PO Reference Number"
              required
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. PO-HARVEST-2026-F1"
            />
          </div>

          <GlassInput
            label="Audit Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Supplier details, lot batch, bay coordinates"
          />

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
            <GlassButton type="button" variant="outline" onClick={() => setAdjustingProduct(null)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" isLoading={isSubmitting}>
              Commit Restock
            </GlassButton>
          </div>
        </form>
      </FormDialog>
    </DashboardLayout>
  );
}
