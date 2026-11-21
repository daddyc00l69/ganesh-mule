'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
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
  Search,
  Lock,
  ArrowLeft,
  Trash2,
  CheckSquare,
  Square,
  Save,
  Building2,
  Mail,
  User,
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

const PERMISSION_CATEGORIES = [
  'Orders',
  'Inventory',
  'Products',
  'Customers',
  'Support',
  'Reports',
  'Administration',
] as const;

export default function DeveloperAccountsPage() {
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'DEVELOPER' | 'ADMIN' | 'MANAGER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Create Staff Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'ADMIN' | 'MANAGER'>('MANAGER');
  const [createDepartment, setCreateDepartment] = useState('Operations Desk');
  const [createPermissions, setCreatePermissions] = useState<string[]>([
    'orders.read',
    'orders.update',
    'inventory.read',
    'inventory.update',
    'support.manage',
    'reports.read',
  ]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Staff Modal
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'MANAGER'>('MANAGER');
  const [editDepartment, setEditDepartment] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Password Reset Modal
  const [resetStaff, setResetStaff] = useState<StaffAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Toggle Confirm Staff
  const [toggleConfirmStaff, setToggleConfirmStaff] = useState<StaffAccount | null>(null);

  // Delete Confirm Staff
  const [deletingStaff, setDeletingStaff] = useState<StaffAccount | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/developer/accounts');
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

  // Set default permissions when changing role in create modal
  const handleCreateRoleChange = (newRole: 'ADMIN' | 'MANAGER') => {
    setCreateRole(newRole);
    if (newRole === 'ADMIN') {
      setCreatePermissions(ALL_PERMISSIONS.map((p) => p.key));
    } else {
      setCreatePermissions([
        'orders.read',
        'orders.update',
        'inventory.read',
        'inventory.update',
        'support.manage',
        'reports.read',
      ]);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/developer/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
          role: createRole,
          department: createDepartment,
          permissions: createPermissions,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create staff account');
      }

      setFeedbackMessage({ text: json.message || 'Staff account created successfully', type: 'success' });
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setIsCreateOpen(false);
      await fetchStaff();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (account: StaffAccount) => {
    setEditingStaff(account);
    setEditName(account.name);
    setEditEmail(account.email);
    setEditRole(account.role === 'DEVELOPER' ? 'ADMIN' : (account.role as 'ADMIN' | 'MANAGER'));
    setEditDepartment(account.department || 'Operations');
    setEditIsActive(account.isActive);
    setEditPermissions(account.permissions || []);
    setEditNewPassword('');
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setIsSubmitting(true);
    setEditError(null);

    try {
      const payload: any = {
        userId: editingStaff.id,
        name: editName,
        email: editEmail,
        department: editDepartment,
        isActive: editIsActive,
        permissions: editPermissions,
      };

      if (!editingStaff.isPrimaryDeveloper) {
        payload.role = editRole;
      }
      if (editNewPassword.trim().length >= 8) {
        payload.newPassword = editNewPassword.trim();
      }

      const res = await fetch('/api/developer/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update staff account');
      }

      setFeedbackMessage({ text: json.message || 'Staff account updated successfully', type: 'success' });
      setEditingStaff(null);
      await fetchStaff();
    } catch (err: any) {
      setEditError(err.message);
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
      setFeedbackMessage({
        text: `Account for ${account.name} is now ${!account.isActive ? 'Active' : 'Suspended'}.`,
        type: 'success',
      });
      setToggleConfirmStaff(null);
      await fetchStaff();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/developer/accounts?userId=${deletingStaff.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete staff account');

      setFeedbackMessage({ text: json.message || 'Staff account deleted permanently', type: 'success' });
      setDeletingStaff(null);
      await fetchStaff();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
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

  // Grouped Permissions Memo
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, typeof ALL_PERMISSIONS> = {};
    for (const cat of PERMISSION_CATEGORIES) {
      groups[cat] = ALL_PERMISSIONS.filter((p) => p.category === cat);
    }
    return groups;
  }, []);

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
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
  }, [staff, searchQuery, roleFilter, statusFilter]);

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
              Super-user credential provisioning, granular RBAC assignment, instant password resets, and account lifecycle management.
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

        {/* Global Feedback Banner */}
        {feedbackMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="p-1 hover:opacity-70 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  roleFilter === 'ALL'
                    ? 'bg-foreground text-background font-semibold'
                    : 'bg-accent/20 text-muted-foreground hover:text-foreground'
                }`}
              >
                All Roles ({staff.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('ADMIN')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  roleFilter === 'ADMIN'
                    ? 'bg-foreground text-background font-semibold'
                    : 'bg-accent/20 text-muted-foreground hover:text-foreground'
                }`}
              >
                Admins ({staff.filter((s) => s.role === 'ADMIN').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('MANAGER')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  roleFilter === 'MANAGER'
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
                className={`px-2 py-1 rounded-md cursor-pointer ${
                  statusFilter === 'ALL' ? 'text-blue-500 font-bold' : 'text-muted-foreground'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2 py-1 rounded-md cursor-pointer ${
                  statusFilter === 'ACTIVE' ? 'text-emerald-500 font-bold' : 'text-muted-foreground'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SUSPENDED')}
                className={`px-2 py-1 rounded-md cursor-pointer ${
                  statusFilter === 'SUSPENDED' ? 'text-rose-500 font-bold' : 'text-muted-foreground'
                }`}
              >
                Suspended
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Desktop Staff Table (hidden on mobile, visible on md+) */}
        <GlassCard className="hidden md:block overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] font-semibold text-muted-foreground border-b border-border/40 bg-accent/10">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role &amp; Tier</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Permissions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
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
                        {account.department || 'Operations'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {account.role === 'DEVELOPER'
                            ? 'All Super-User'
                            : `${account.permissions?.length || 0} permissions`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            account.isActive
                              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              account.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{account.isActive ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                        {formatDate(account.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Staff Account */}
                          <button
                            type="button"
                            onClick={() => openEditModal(account)}
                            title="Edit Account &amp; Permissions"
                            className="p-1.5 rounded-lg border border-border/50 hover:bg-accent/20 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

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
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                account.isActive
                                  ? 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10'
                                  : 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Account */}
                          {!account.isPrimaryDeveloper && account.role !== 'DEVELOPER' && (
                            <button
                              type="button"
                              onClick={() => setDeletingStaff(account)}
                              title="Delete Account Permanently"
                              className="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/15 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Mobile Staff Cards (visible on mobile <md) */}
        <div className="block md:hidden space-y-3">
          {filteredStaff.length === 0 ? (
            <GlassCard className="p-8 text-center text-xs text-muted-foreground">
              No staff members match the selected criteria.
            </GlassCard>
          ) : (
            filteredStaff.map((account) => (
              <GlassCard key={account.id} className="p-4 space-y-3 border-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/40 flex items-center justify-center font-bold text-foreground text-sm shrink-0">
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground text-sm">{account.name}</span>
                        {account.isPrimaryDeveloper && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-600 text-white font-bold uppercase">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">{account.email}</p>
                    </div>
                  </div>

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
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/30">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Department</span>
                    <span className="text-foreground font-medium">{account.department || 'Operations'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Status</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        account.isActive
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-rose-500/15 text-rose-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${account.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      />
                      <span>{account.isActive ? 'Active' : 'Suspended'}</span>
                    </span>
                  </div>
                </div>

                {/* Mobile Actions Bar */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/30">
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(account)}
                    className="h-8 px-2.5 text-xs gap-1 border border-border/50"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </GlassButton>

                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setResetStaff(account);
                      setNewPassword('');
                    }}
                    className="h-8 px-2.5 text-xs gap-1 border border-border/50"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </GlassButton>

                  {!account.isPrimaryDeveloper && (
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setToggleConfirmStaff(account)}
                      className={`h-8 px-2.5 text-xs gap-1 border ${
                        account.isActive
                          ? 'border-rose-500/30 text-rose-500'
                          : 'border-emerald-500/30 text-emerald-500'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{account.isActive ? 'Suspend' : 'Activate'}</span>
                    </GlassButton>
                  )}

                  {!account.isPrimaryDeveloper && account.role !== 'DEVELOPER' && (
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingStaff(account)}
                      className="h-8 px-2.5 text-xs gap-1 border border-rose-500/30 text-rose-500 hover:bg-rose-500/15"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </GlassButton>
                  )}
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Modal 1: Create Staff Member */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-xl p-6 space-y-4 shadow-2xl border-border/80 max-h-[90vh] overflow-y-auto">
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

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="e.g. Ramesh Kulkarni"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="staff@ganeshmule.com"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Initial Password (min 8 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Role &amp; Privilege</label>
                    <select
                      value={createRole}
                      onChange={(e) => handleCreateRoleChange(e.target.value as any)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="MANAGER">Operations Manager</option>
                      <option value="ADMIN">Administrator (Full Store Access)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-foreground mb-1">Department</label>
                    <input
                      type="text"
                      value={createDepartment}
                      onChange={(e) => setCreateDepartment(e.target.value)}
                      placeholder="e.g. Apiary Warehouse"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Granular Permissions Selector */}
                <div className="space-y-3 pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-semibold text-foreground">Granular RBAC Permissions</span>
                      <span className="text-[10px] text-muted-foreground">
                        {createPermissions.length} of {ALL_PERMISSIONS.length} permissions assigned
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCreatePermissions(ALL_PERMISSIONS.map((p) => p.key))}
                        className="text-[11px] text-blue-500 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-muted-foreground">·</span>
                      <button
                        type="button"
                        onClick={() => setCreatePermissions([])}
                        className="text-[11px] text-muted-foreground hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {PERMISSION_CATEGORIES.map((category) => {
                      const categoryPerms = groupedPermissions[category] || [];
                      if (categoryPerms.length === 0) return null;
                      return (
                        <div key={category} className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            {category}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {categoryPerms.map((perm) => {
                              const isChecked = createPermissions.includes(perm.key);
                              return (
                                <label
                                  key={perm.key}
                                  className={`flex items-start gap-2 p-2 rounded-lg border transition-colors cursor-pointer text-[11px] ${
                                    isChecked
                                      ? 'bg-blue-500/10 border-blue-500/30 text-foreground'
                                      : 'bg-accent/10 border-border/40 text-muted-foreground hover:bg-accent/20'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setCreatePermissions([...createPermissions, perm.key]);
                                      } else {
                                        setCreatePermissions(createPermissions.filter((k) => k !== perm.key));
                                      }
                                    }}
                                    className="mt-0.5 rounded border-border"
                                  />
                                  <div className="space-y-0.5">
                                    <span className="font-semibold block">{perm.label}</span>
                                    <span className="text-[10px] text-muted-foreground block line-clamp-1">
                                      {perm.description}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
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

        {/* Modal 2: Edit Staff Member & Permissions */}
        {editingStaff && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <GlassCard className="w-full max-w-xl p-6 space-y-4 shadow-2xl border-border/80 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-500" />
                  <div>
                    <h2 className="text-base font-bold text-foreground">Edit Staff Account</h2>
                    <p className="text-[11px] text-muted-foreground font-mono">{editingStaff.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-foreground mb-1">Role</label>
                    <select
                      value={editRole}
                      disabled={editingStaff.isPrimaryDeveloper || editingStaff.role === 'DEVELOPER'}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-60"
                    >
                      <option value="MANAGER">Operations Manager</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Department</label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Status</label>
                    <select
                      value={editIsActive ? 'active' : 'suspended'}
                      disabled={editingStaff.isPrimaryDeveloper}
                      onChange={(e) => setEditIsActive(e.target.value === 'active')}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-60"
                    >
                      <option value="active">Active Access</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">
                    Update Password (optional, min 8 chars)
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Leave blank to preserve current password"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Granular Permissions Selector */}
                <div className="space-y-3 pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-semibold text-foreground">Granular RBAC Permissions</span>
                      <span className="text-[10px] text-muted-foreground">
                        {editPermissions.length} of {ALL_PERMISSIONS.length} permissions granted
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditPermissions(ALL_PERMISSIONS.map((p) => p.key))}
                        className="text-[11px] text-blue-500 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-muted-foreground">·</span>
                      <button
                        type="button"
                        onClick={() => setEditPermissions([])}
                        className="text-[11px] text-muted-foreground hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {PERMISSION_CATEGORIES.map((category) => {
                      const categoryPerms = groupedPermissions[category] || [];
                      if (categoryPerms.length === 0) return null;
                      return (
                        <div key={category} className="space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            {category}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {categoryPerms.map((perm) => {
                              const isChecked = editPermissions.includes(perm.key);
                              return (
                                <label
                                  key={perm.key}
                                  className={`flex items-start gap-2 p-2 rounded-lg border transition-colors cursor-pointer text-[11px] ${
                                    isChecked
                                      ? 'bg-blue-500/10 border-blue-500/30 text-foreground'
                                      : 'bg-accent/10 border-border/40 text-muted-foreground hover:bg-accent/20'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditPermissions([...editPermissions, perm.key]);
                                      } else {
                                        setEditPermissions(editPermissions.filter((k) => k !== perm.key));
                                      }
                                    }}
                                    className="mt-0.5 rounded border-border"
                                  />
                                  <div className="space-y-0.5">
                                    <span className="font-semibold block">{perm.label}</span>
                                    <span className="text-[10px] text-muted-foreground block line-clamp-1">
                                      {perm.description}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/40">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingStaff(null)}
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    className="gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                  </GlassButton>
                </div>
              </form>
            </GlassCard>
          </div>
        )}

        {/* Modal 3: Standalone Password Reset Modal */}
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

        {/* Modal 4: Confirm Toggle Status */}
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

        {/* Modal 5: Confirm Delete Account */}
        {deletingStaff && (
          <ConfirmDialog
            isOpen={Boolean(deletingStaff)}
            title="Permanently Delete Staff Account"
            description={`Are you sure you want to permanently delete ${deletingStaff.name} (${deletingStaff.email})? This action cannot be undone. Historical orders and audit records will remain preserved.`}
            confirmLabel="Delete Account Permanently"
            isDestructive={true}
            onConfirm={handleDeleteStaff}
            onCancel={() => setDeletingStaff(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
