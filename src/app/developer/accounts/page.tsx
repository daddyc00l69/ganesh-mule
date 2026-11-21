'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassInput } from '@/components/ui/glass-input';
import { FormDialog } from '@/components/ui/form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Key,
  Edit,
  Power,
  RotateCcw,
  Search,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ALL_PERMISSIONS } from '@/lib/permissions';

interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: 'DEVELOPER' | 'ADMIN' | 'MANAGER';
  isActive: boolean;
  createdAt: string;
  department: string | null;
  permissions: string[];
  notes?: string | null;
  isPrimaryDeveloper?: boolean;
}

export default function DeveloperAccountsPage() {
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'DEVELOPER' | 'ADMIN' | 'MANAGER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Create Staff Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'MANAGER'>('MANAGER');
  const [formDepartment, setFormDepartment] = useState('Operations Desk');
  const [formPermissions, setFormPermissions] = useState<string[]>([
    'orders.read',
    'orders.update',
    'inventory.read',
    'inventory.update',
  ]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Status Modal
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [toggleConfirmStaff, setToggleConfirmStaff] = useState<StaffAccount | null>(null);

  // Password Reset Modal
  const [resetStaff, setResetStaff] = useState<StaffAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/developer/accounts');
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/portal?error=unauthorized_developer';
        return;
      }
      if (res.ok) {
        const json = await res.json();
        if (json.staff) setStaff(json.staff);
      }
    } catch (err) {
      console.warn('Failed to fetch staff accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/developer/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
          department: formDepartment,
          permissions: formPermissions,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create staff account');
      }

      setCreateSuccess(json.message);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setIsCreateOpen(false);
      await fetchStaff();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (account: StaffAccount) => {
    try {
      const res = await fetch('/api/developer/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.id,
          isActive: !account.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to toggle account status');
      setToggleConfirmStaff(null);
      await fetchStaff();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStaff || !newPassword) return;
    setIsSubmitting(true);
    setResetSuccess(null);

    try {
      const res = await fetch('/api/developer/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetStaff.id,
          newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to reset password');
      setResetSuccess(`✓ Password successfully reset for ${resetStaff.email}`);
      setTimeout(() => {
        setResetStaff(null);
        setNewPassword('');
        setResetSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.isActive) ||
      (statusFilter === 'SUSPENDED' && !s.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <DashboardLayout role="DEVELOPER" title="Staff & Privilege Architecture">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/developer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Telemetry</span>
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Staff Account &amp; RBAC Control Desk
            </h1>
            <p className="text-xs text-muted-foreground">
              Provision Administrator and Operations Manager credentials, manage RBAC permissions, and toggle account activation.
            </p>
          </div>

          <GlassButton
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 cursor-pointer shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Staff Account</span>
          </GlassButton>
        </div>

        {/* Filter & Search Bar */}
        <GlassCard className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, department..."
              className="w-full h-9 pl-9 pr-4 text-xs rounded-lg border border-border/50 bg-background/50 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Filter */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${roleFilter === 'ALL'
                  ? 'bg-foreground text-background font-semibold'
                  : 'bg-accent/20 text-muted-foreground hover:text-foreground'
                  }`}
              >
                All Roles ({staff.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('ADMIN')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${roleFilter === 'ADMIN'
                  ? 'bg-foreground text-background font-semibold'
                  : 'bg-accent/20 text-muted-foreground hover:text-foreground'
                  }`}
              >
                Admins ({staff.filter((s) => s.role === 'ADMIN').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('MANAGER')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${roleFilter === 'MANAGER'
                  ? 'bg-foreground text-background font-semibold'
                  : 'bg-accent/20 text-muted-foreground hover:text-foreground'
                  }`}
              >
                Managers ({staff.filter((s) => s.role === 'MANAGER').length})
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs border-l border-border/40 pl-2">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-1 rounded-md ${statusFilter === 'ALL' ? 'text-blue-500 font-bold' : 'text-muted-foreground'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2 py-1 rounded-md ${statusFilter === 'ACTIVE' ? 'text-emerald-500 font-bold' : 'text-muted-foreground'}`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SUSPENDED')}
                className={`px-2 py-1 rounded-md ${statusFilter === 'SUSPENDED' ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}
              >
                Suspended
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Staff Table */}
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] font-semibold text-muted-foreground border-b border-border/40 bg-accent/10">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role &amp; Tier</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No staff members match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((account) => (
                    <tr key={account.id} className="hover:bg-accent/10 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent/40 flex items-center justify-center font-bold text-foreground">
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{account.name}</span>
                              {account.isPrimaryDeveloper && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-600 text-white font-bold uppercase">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <GlassBadge
                          variant={
                            account.role === 'DEVELOPER'
                              ? 'default'
                              : account.role === 'ADMIN'
                                ? 'info'
                                : 'warning'
                          }
                          size="sm"
                        >
                          {account.role}
                        </GlassBadge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {account.department || 'All Departments'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${account.isActive
                            ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                            : 'bg-rose-500/15 text-rose-600 border border-rose-500/20'
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${account.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          />
                          <span>{account.isActive ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                        {formatDate(account.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Password Reset */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetStaff(account);
                              setNewPassword('');
                            }}
                            title="Reset Password"
                            className="p-1.5 rounded-lg border border-border/50 hover:bg-accent/20 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Suspend */}
                          {!account.isPrimaryDeveloper && (
                            <button
                              type="button"
                              onClick={() => setToggleConfirmStaff(account)}
                              title={account.isActive ? 'Suspend Account' : 'Reactivate Account'}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${account.isActive
                                ? 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10'
                                : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                                }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Modal 1: Create Staff Member */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-lg p-6 space-y-4 shadow-2xl border-border/80">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                  <h2 className="text-base font-bold text-foreground">Create Staff Account</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="staff@ganeshmule.com"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Initial Password (min 8 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                    >
                      <option value="MANAGER">Operations Manager</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">Department</label>
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="e.g. Apiary Warehouse"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Granular Permissions */}
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <span className="block font-semibold text-foreground">Granular Role Permissions</span>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {ALL_PERMISSIONS.slice(0, 8).map((perm) => {
                      const isChecked = formPermissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-accent/20 cursor-pointer text-[11px]"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormPermissions([...formPermissions, perm.key]);
                              } else {
                                setFormPermissions(formPermissions.filter((k) => k !== perm.key));
                              }
                            }}
                            className="rounded border-border"
                          />
                          <span className="truncate">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/40">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Account'}
                  </GlassButton>
                </div>
              </form>
            </GlassCard>
          </div>
        )}

        {/* Modal 2: Password Reset Modal */}
        {resetStaff && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-md p-6 space-y-4 shadow-2xl border-border/80">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-bold text-foreground">Reset Password</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setResetStaff(null)}
                  className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Set a new password for <strong className="text-foreground">{resetStaff.name}</strong> ({resetStaff.email}).
              </p>

              {resetSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs">
                  {resetSuccess}
                </div>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1">New Password (min 8 characters)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setResetStaff(null)}
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting || newPassword.length < 8}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                  </GlassButton>
                </div>
              </form>
            </GlassCard>
          </div>
        )}

        {/* Modal 3: Confirm Toggle Status */}
        {toggleConfirmStaff && (
          <ConfirmDialog
            isOpen={Boolean(toggleConfirmStaff)}
            title={toggleConfirmStaff.isActive ? 'Suspend Staff Account' : 'Reactivate Staff Account'}
            description={`Are you sure you want to ${
              toggleConfirmStaff.isActive ? 'suspend' : 'reactivate'
            } access for ${toggleConfirmStaff.name} (${toggleConfirmStaff.email})?`}
            confirmLabel={toggleConfirmStaff.isActive ? 'Suspend Access' : 'Reactivate'}
            isDestructive={toggleConfirmStaff.isActive}
            onConfirm={() => handleToggleActive(toggleConfirmStaff)}
            onCancel={() => setToggleConfirmStaff(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

