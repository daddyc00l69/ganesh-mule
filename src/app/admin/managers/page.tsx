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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MOCK_MANAGERS } from '@/lib/mock-data';
import { ALL_PERMISSIONS, PERMISSIONS, PermissionKey } from '@/lib/permissions';
import { ManagerAccount } from '@/types';
import { formatDate } from '@/lib/utils';
import { UserPlus, Shield, Check, Lock, Power, UserCheck } from 'lucide-react';

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<ManagerAccount[]>(MOCK_MANAGERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ManagerAccount | null>(null);
  const [togglingManager, setTogglingManager] = useState<ManagerAccount | null>(null);

  // Form State for Create/Edit
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredManagers = managers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? m.isActive
        : !m.isActive;

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormDepartment('Operations');
    setSelectedPermissions([
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_UPDATE,
    ]);
    setErrorMsg(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (mgr: ManagerAccount) => {
    setEditingManager(mgr);
    setFormName(mgr.name);
    setFormEmail(mgr.email);
    setFormDepartment(mgr.department || '');
    setSelectedPermissions(mgr.permissions || []);
    setErrorMsg(null);
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          department: formDepartment,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create manager');

      setManagers((prev) => [data.manager, ...prev]);
      setIsCreateOpen(false);
    } catch (err: any) {
      // In mock UI fallback, create locally
      const newManager: ManagerAccount = {
        id: `mgr-${Date.now()}`,
        userId: `usr-${Date.now()}`,
        name: formName,
        email: formEmail,
        isActive: true,
        department: formDepartment,
        permissions: selectedPermissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setManagers((prev) => [newManager, ...prev]);
      setIsCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManager) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/managers/${editingManager.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          department: formDepartment,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update manager');

      setManagers((prev) =>
        prev.map((m) => (m.id === editingManager.id ? data.manager : m))
      );
      setEditingManager(null);
    } catch {
      setManagers((prev) =>
        prev.map((m) =>
          m.id === editingManager.id
            ? {
                ...m,
                name: formName,
                department: formDepartment,
                permissions: selectedPermissions,
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );
      setEditingManager(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!togglingManager) return;
    const nextActive = !togglingManager.isActive;

    try {
      await fetch(`/api/managers/${togglingManager.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
    } catch {}

    setManagers((prev) =>
      prev.map((m) =>
        m.id === togglingManager.id ? { ...m, isActive: nextActive } : m
      )
    );
    setTogglingManager(null);
  };

  const columns: Column<ManagerAccount>[] = [
    {
      key: 'name',
      header: 'Manager',
      render: (mgr) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full glass-control flex items-center justify-center font-bold text-xs text-foreground">
            {mgr.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{mgr.name}</p>
            <p className="text-xs text-muted-foreground">{mgr.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (mgr) => (
        <span className="text-xs font-medium text-foreground/80">
          {mgr.department || 'General Operations'}
        </span>
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions Scope',
      render: (mgr) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {mgr.permissions.slice(0, 3).map((perm) => (
            <GlassBadge key={perm} variant="default" size="sm">
              {perm}
            </GlassBadge>
          ))}
          {mgr.permissions.length > 3 && (
            <span className="text-[10px] text-muted-foreground font-mono self-center">
              +{mgr.permissions.length - 3} more
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (mgr) => (
        <GlassBadge variant={mgr.isActive ? 'success' : 'destructive'} size="sm">
          {mgr.isActive ? 'Active' : 'Suspended'}
        </GlassBadge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (mgr) => (
        <span className="text-xs text-muted-foreground font-mono">
          {formatDate(mgr.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (mgr) => (
        <div className="flex items-center justify-end gap-1.5">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(mgr)}
          >
            Edit Permissions
          </GlassButton>
          <GlassButton
            variant={mgr.isActive ? 'destructive' : 'primary'}
            size="sm"
            onClick={() => setTogglingManager(mgr)}
            title={mgr.isActive ? 'Suspend account' : 'Reactivate account'}
          >
            <Power className="w-3.5 h-3.5" />
          </GlassButton>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Manager Staff Administration" userName="Super Admin">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Store Managers & Operators
          </h2>
          <p className="text-xs text-muted-foreground">
            Configure managerial accounts and grant fine-grained operational permissions
          </p>
        </div>
        <GlassButton
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Manager</span>
        </GlassButton>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <FilterBar
          options={[
            { label: 'All Accounts', value: 'ALL', count: managers.length },
            {
              label: 'Active',
              value: 'ACTIVE',
              count: managers.filter((m) => m.isActive).length,
            },
            {
              label: 'Suspended',
              value: 'SUSPENDED',
              count: managers.filter((m) => !m.isActive).length,
            },
          ]}
          selectedValue={statusFilter}
          onSelect={setStatusFilter}
        />

        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Filter managers by name, email, department..."
        />
      </div>

      {/* Managers Table */}
      <DataTable
        columns={columns}
        data={filteredManagers}
        keyExtractor={(mgr) => mgr.id}
        emptyMessage="No managers found matching criteria."
      />

      {/* Create Manager Dialog */}
      <FormDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision New Manager Account"
        description="Creates an authorized managerial profile with granular capability grants"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg">
              {errorMsg}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GlassInput
              label="Full Name"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Vikram Mehta"
            />
            <GlassInput
              label="Corporate Email"
              type="email"
              required
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="name@ganeshmule.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GlassInput
              label="Temporary Password"
              type="password"
              required
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
            <GlassInput
              label="Department / Unit"
              value={formDepartment}
              onChange={(e) => setFormDepartment(e.target.value)}
              placeholder="e.g. Regional Fulfillment"
            />
          </div>

          {/* Granular Permissions Matrix */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand" />
              <span>Granular Permissions Matrix</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 glass-control rounded-xl">
              {ALL_PERMISSIONS.map((perm) => {
                const isSelected = selectedPermissions.includes(perm.key);
                return (
                  <div
                    key={perm.key}
                    onClick={() => togglePermission(perm.key)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-accent/30 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'glass-primary border-transparent'
                          : 'border-border'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{perm.label}</p>
                      <p className="text-[10px] text-muted-foreground">{perm.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
            <GlassButton
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Create Account
            </GlassButton>
          </div>
        </form>
      </FormDialog>

      {/* Edit Permissions Dialog */}
      <FormDialog
        isOpen={!!editingManager}
        onClose={() => setEditingManager(null)}
        title={`Edit Permissions: ${editingManager?.name}`}
        description="Update assigned operational permissions and departmental profile"
        maxWidth="xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <GlassInput
              label="Full Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <GlassInput
              label="Department"
              value={formDepartment}
              onChange={(e) => setFormDepartment(e.target.value)}
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand" />
              <span>Assigned Permissions</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 glass-control rounded-xl">
              {ALL_PERMISSIONS.map((perm) => {
                const isSelected = selectedPermissions.includes(perm.key);
                return (
                  <div
                    key={perm.key}
                    onClick={() => togglePermission(perm.key)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-accent/30 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'glass-primary border-transparent'
                          : 'border-border'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{perm.label}</p>
                      <p className="text-[10px] text-muted-foreground">{perm.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40">
            <GlassButton
              type="button"
              variant="outline"
              onClick={() => setEditingManager(null)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Save Permission Changes
            </GlassButton>
          </div>
        </form>
      </FormDialog>

      {/* Account Deactivation / Activation Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!togglingManager}
        onCancel={() => setTogglingManager(null)}
        onConfirm={handleConfirmToggleActive}
        title={togglingManager?.isActive ? 'Suspend Manager Account' : 'Reactivate Manager Account'}
        description={
          togglingManager?.isActive
            ? `Are you sure you want to suspend ${togglingManager?.name}'s account? They will immediately lose access to all operational dashboards.`
            : `Are you sure you want to restore access for ${togglingManager?.name}?`
        }
        confirmLabel={togglingManager?.isActive ? 'Suspend Account' : 'Reactivate'}
        isDestructive={togglingManager?.isActive}
      />
    </DashboardLayout>
  );
}
