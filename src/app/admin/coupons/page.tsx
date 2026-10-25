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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MOCK_COUPONS, MOCK_MANAGERS } from '@/lib/mock-data';
import { DiscountCoupon } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  TicketPercent,
  Plus,
  Copy,
  Check,
  Percent,
  Sparkles,
  Users,
  Calendar,
  AlertCircle,
  Tag,
  CheckCircle2,
  Trash2,
  Edit,
  Power,
  RotateCcw,
} from 'lucide-react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(MOCK_COUPONS);
  const [managers, setManagers] = useState<{ id: string; name: string; department: string | null }[]>(
    MOCK_MANAGERS.map((m) => ({ id: m.userId, name: m.name, department: m.department }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<DiscountCoupon | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [formValue, setFormValue] = useState<number>(15);
  const [formMinOrderRupees, setFormMinOrderRupees] = useState<number>(999);
  const [formMaxDiscountRupees, setFormMaxDiscountRupees] = useState<number | ''>(500);
  const [formExpiresAt, setFormExpiresAt] = useState('2027-12-31');
  const [formUsageLimit, setFormUsageLimit] = useState<number | ''>(500);
  const [formAssignedManagerIds, setFormAssignedManagerIds] = useState<string[]>(['usr-mgr-1']);
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load coupons from API on mount
  useEffect(() => {
    fetch('/api/coupons')
      .then((res) => res.json())
      .then((data) => {
        if (data.coupons) setCoupons(data.coupons);
        if (data.managers) setManagers(data.managers);
      })
      .catch(() => {});
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTogglePublic = async (coupon: DiscountCoupon) => {
    const nextVal = !coupon.isPublic;
    try {
      const res = await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, isPublic: nextVal }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isPublic: nextVal } : c))
        );
      }
    } catch {}
  };

  const handleOpenCreate = () => {
    setFormCode(`HONEY${Math.floor(10 + Math.random() * 90)}`);
    setFormDescription('Exclusive Courtesy Discount');
    setFormType('PERCENTAGE');
    setFormValue(15);
    setFormMinOrderRupees(999);
    setFormMaxDiscountRupees(500);
    setFormExpiresAt('2027-12-31');
    setFormUsageLimit(500);
    setFormAssignedManagerIds(['usr-mgr-1']);
    setFormIsPublic(false);
    setErrorMsg(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (c: DiscountCoupon) => {
    setEditingCoupon(c);
    setFormCode(c.code);
    setFormDescription(c.description);
    setFormType(c.discountType);
    setFormValue(c.discountType === 'PERCENTAGE' ? c.value : Math.round(c.value / 100));
    setFormMinOrderRupees(Math.round(c.minOrderAmount / 100));
    setFormMaxDiscountRupees(c.maxDiscountAmount ? Math.round(c.maxDiscountAmount / 100) : '');
    setFormExpiresAt(c.expiresAt ? c.expiresAt.split('T')[0] : '');
    setFormUsageLimit(c.usageLimit || '');
    setFormAssignedManagerIds(c.assignedManagerIds || []);
    setFormIsPublic(!!c.isPublic);
    setErrorMsg(null);
  };

  const toggleManagerAssignment = (managerId: string) => {
    setFormAssignedManagerIds((prev) =>
      prev.includes(managerId) ? prev.filter((id) => id !== managerId) : [...prev, managerId]
    );
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const payload = {
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim(),
      discountType: formType,
      value: formType === 'PERCENTAGE' ? formValue : formValue * 100, // paise if fixed
      minOrderAmount: (formMinOrderRupees || 0) * 100, // paise
      maxDiscountAmount:
        formType === 'PERCENTAGE' && formMaxDiscountRupees ? Number(formMaxDiscountRupees) * 100 : null,
      expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
      usageLimit: formUsageLimit ? Number(formUsageLimit) : null,
      isPublic: formIsPublic,
      assignedManagerIds: formAssignedManagerIds,
    };

    try {
      if (editingCoupon) {
        const res = await fetch(`/api/coupons/${editingCoupon.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update coupon');

        setCoupons((prev) =>
          prev.map((c) => (c.id === editingCoupon.id ? { ...c, ...data.coupon } : c))
        );
        setEditingCoupon(null);
      } else {
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create coupon');

        setCoupons((prev) => [data.coupon, ...prev]);
        setIsCreateOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (coupon: DiscountCoupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch {}
  };

  const handleDeleteCoupon = async () => {
    if (!deletingCoupon) return;
    try {
      await fetch(`/api/coupons/${deletingCoupon.id}`, { method: 'DELETE' });
      setCoupons((prev) => prev.filter((c) => c.id !== deletingCoupon.id));
      setDeletingCoupon(null);
    } catch {}
  };

  // Filtered list
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedManagerNames?.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ? true : statusFilter === 'ACTIVE' ? c.isActive : !c.isActive;

    const matchesType =
      typeFilter === 'ALL' ? true : c.discountType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // KPI Calculations
  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const empoweredManagersCount = new Set(coupons.flatMap((c) => c.assignedManagerIds || [])).size;

  const columns: Column<DiscountCoupon>[] = [
    {
      key: 'code',
      header: 'Promo Code & Description',
      render: (coupon) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-primary tracking-wide bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-lg">
              {coupon.code}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(coupon.code)}
              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Copy promo code"
            >
              {copiedCode === coupon.code ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{coupon.description}</p>
        </div>
      ),
    },
    {
      key: 'offer',
      header: 'Discount Offer',
      render: (coupon) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-foreground">
            {coupon.discountType === 'PERCENTAGE'
              ? `${coupon.value}% OFF`
              : `${formatCurrency(coupon.value)} OFF`}
          </span>
          <p className="text-[11px] text-muted-foreground">
            {coupon.minOrderAmount > 0
              ? `Min ${formatCurrency(coupon.minOrderAmount)}`
              : 'No minimum'}
            {coupon.maxDiscountAmount ? ` • Cap ${formatCurrency(coupon.maxDiscountAmount)}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'assignedManagers',
      header: 'Assigned Managers',
      render: (coupon) => (
        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
          {coupon.assignedManagerNames && coupon.assignedManagerNames.length > 0 ? (
            coupon.assignedManagerNames.map((name) => (
              <span
                key={name}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary/80 text-foreground border border-border/40"
              >
                {name}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-muted-foreground italic">All Staff (General)</span>
          )}
        </div>
      ),
    },
    {
      key: 'usage',
      header: 'Usage & Limit',
      render: (coupon) => {
        const limit = coupon.usageLimit;
        const count = coupon.usageCount || 0;
        const percent = limit ? Math.min(100, Math.round((count / limit) * 100)) : 10;
        return (
          <div className="space-y-1 min-w-[100px]">
            <div className="flex justify-between text-[11px]">
              <span className="font-medium text-foreground">{count} used</span>
              <span className="text-muted-foreground">{limit ? `/ ${limit}` : '∞'}</span>
            </div>
            {limit && (
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (coupon) => (
        <GlassBadge variant={coupon.isActive ? 'success' : 'outline'}>
          {coupon.isActive ? 'Active' : 'Paused'}
        </GlassBadge>
      ),
    },
    {
      key: 'visibility',
      header: 'Storefront Visibility',
      render: (coupon) => (
        <button
          type="button"
          onClick={() => handleTogglePublic(coupon)}
          className="inline-flex items-center gap-1.5 cursor-pointer group"
          title={coupon.isPublic ? 'Click to hide from checkout offers' : 'Click to make public in checkout offers'}
        >
          <GlassBadge variant={coupon.isPublic ? 'success' : 'outline'}>
            {coupon.isPublic ? '🌐 Public Offer' : '🔒 Hidden (Direct)'}
          </GlassBadge>
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (coupon) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleToggleStatus(coupon)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              coupon.isActive
                ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title={coupon.isActive ? 'Pause Coupon' : 'Activate Coupon'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenEdit(coupon)}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
            title="Edit Coupon & Assign Managers"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeletingCoupon(coupon)}
            className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            title="Delete Coupon"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Discount Coupons & Promotional Governance">
      <div className="space-y-6">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TicketPercent className="w-6 h-6 text-primary" />
              <span>Discount Coupon Governance</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create discount promo codes and assign them to managers for customer distribution.
            </p>
          </div>
          <GlassButton variant="primary" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create Promo Code</span>
          </GlassButton>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Active Coupons</span>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Total Redemptions</span>
              <p className="text-2xl font-bold text-foreground">{totalRedemptions} Orders</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <TicketPercent className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Managers Empowered</span>
              <p className="text-2xl font-bold text-foreground">{empoweredManagersCount} Staff</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Admin Rule Isolation</span>
              <p className="text-xs font-semibold text-emerald-400">Admin-Only Managed</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 rounded-xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1 max-w-sm">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search code, manager, description..."
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <FilterBar
                selectedValue={statusFilter}
                onSelect={setStatusFilter}
                options={[
                  { label: 'All Status', value: 'ALL' },
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Paused', value: 'PAUSED' },
                ]}
              />
              <FilterBar
                selectedValue={typeFilter}
                onSelect={setTypeFilter}
                options={[
                  { label: 'All Types', value: 'ALL' },
                  { label: '% Off', value: 'PERCENTAGE' },
                  { label: 'Flat ₹ Off', value: 'FIXED_AMOUNT' },
                ]}
              />
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={filteredCoupons}
            keyExtractor={(c) => c.id}
            emptyMessage="No discount coupons matching your query."
          />
        </div>

        {/* Create / Edit Form Dialog */}
        <FormDialog
          isOpen={isCreateOpen || editingCoupon !== null}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingCoupon(null);
          }}
          title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
        >
          <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Promo Code</label>
                <div className="flex gap-2">
                  <GlassInput
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VIKRAM20"
                    required
                  />
                  <GlassButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setFormCode(`HONEY${Math.floor(10 + Math.random() * 90)}`)}
                    title="Generate code"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </GlassButton>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Discount Type</label>
                <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/20">
                  <button
                    type="button"
                    onClick={() => setFormType('PERCENTAGE')}
                    className={`flex-1 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      formType === 'PERCENTAGE'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('FIXED_AMOUNT')}
                    className={`flex-1 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      formType === 'FIXED_AMOUNT'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Flat Amount (₹)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-medium text-foreground">Description / Purpose</label>
                <GlassInput
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. VIP Customer Courtesy (Assigned to Manager Vikram)"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  {formType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                </label>
                <GlassInput
                  type="number"
                  min="1"
                  max={formType === 'PERCENTAGE' ? '100' : '100000'}
                  value={formValue}
                  onChange={(e) => setFormValue(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Minimum Order Subtotal (₹)</label>
                <GlassInput
                  type="number"
                  min="0"
                  value={formMinOrderRupees}
                  onChange={(e) => setFormMinOrderRupees(Number(e.target.value))}
                  placeholder="e.g. 999"
                />
              </div>

              {formType === 'PERCENTAGE' && (
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Max Discount Cap (₹)</label>
                  <GlassInput
                    type="number"
                    min="1"
                    value={formMaxDiscountRupees}
                    onChange={(e) => setFormMaxDiscountRupees(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 500 (optional)"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Total Usage Limit</label>
                <GlassInput
                  type="number"
                  min="1"
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 500 (optional)"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-medium text-foreground">Expiration Date</label>
                <GlassInput
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <label className="font-medium text-foreground block text-xs">Public Storefront Offer</label>
                  <p className="text-[11px] text-muted-foreground">
                    When enabled, shoppers can discover and apply this coupon by clicking &ldquo;View Available Offers&rdquo; in checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsPublic(!formIsPublic)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    formIsPublic
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/5 text-muted-foreground border-white/10'
                  }`}
                >
                  {formIsPublic ? '🌐 Public Offer' : '🔒 Hidden / Direct Code'}
                </button>
              </div>
            </div>

            {/* Manager Assignment Checkboxes */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>Assign to Managers (Multiple Allowed)</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {formAssignedManagerIds.length} Selected
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Selected managers will see this promo code in their desk and can give it to customers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {managers.map((mgr) => {
                  const isChecked = formAssignedManagerIds.includes(mgr.id);
                  return (
                    <div
                      key={mgr.id}
                      onClick={() => toggleManagerAssignment(mgr.id)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-amber-500/40 bg-amber-500/10 text-foreground'
                          : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-xs text-foreground">{mgr.name}</p>
                        <p className="text-[10px] text-muted-foreground">{mgr.department || 'Operations'}</p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked
                            ? 'bg-amber-500 border-amber-600 text-white'
                            : 'border-white/20'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
              <GlassButton
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingCoupon(null);
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </GlassButton>
            </div>
          </form>
        </FormDialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deletingCoupon !== null}
          onCancel={() => setDeletingCoupon(null)}
          onConfirm={handleDeleteCoupon}
          title="Delete Promo Code"
          description={`Are you sure you want to permanently delete coupon "${deletingCoupon?.code}"? Customers will no longer be able to redeem this code.`}
          confirmLabel="Delete Coupon"
          isDestructive={true}
        />
      </div>
    </DashboardLayout>
  );
}
