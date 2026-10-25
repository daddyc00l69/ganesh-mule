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
import { ALL_PERMISSIONS, PERMISSIONS } from '@/lib/permissions';
import { ManagerAccount } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  UserPlus,
  Shield,
  Check,
  Lock,
  Power,
  UserCheck,
  Mail,
  Copy,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface ManagerInviteRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  permissions: string[];
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  invitedAt: string;
  expiresAt: string;
}

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<ManagerAccount[]>([]);
  const [invites, setInvites] = useState<ManagerInviteRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [togglingManager, setTogglingManager] = useState<ManagerAccount | null>(null);
  const [newlyCreatedInvite, setNewlyCreatedInvite] = useState<{ invite: ManagerInviteRecord; inviteUrl: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State for Invite
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDepartment, setFormDepartment] = useState('Apiary & Dispatch');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStaffData = async () => {
    try {
      const res = await fetch('/api/admin/managers');
      if (res.ok) {
        const data = await res.json();
        if (data.managers) setManagers(data.managers);
        if (data.invites) setInvites(data.invites);
      }
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

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

  const handleOpenInvite = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormDepartment('Apiary & Dispatch');
    setSelectedPermissions([
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_UPDATE,
    ]);
    setErrorMsg(null);
    setIsInviteOpen(true);
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          phone: formPhone,
          department: formDepartment,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');

      setIsInviteOpen(false);
      setNewlyCreatedInvite({ invite: data.invite, inviteUrl: data.inviteUrl });
      fetchStaffData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error dispatching manager invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await fetch('/api/admin/managers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REVOKE_INVITE', inviteId }),
      });
      fetchStaffData();
    } catch {}
  };

  const handleConfirmToggleActive = async () => {
    if (!togglingManager) return;
    const nextActive = !togglingManager.isActive;

    try {
      await fetch('/api/admin/managers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_ACTIVE',
          managerId: togglingManager.id,
          isActive: nextActive,
        }),
      });
      fetchStaffData();
    } catch {}

    setTogglingManager(null);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activeInvites = invites.filter((i) => i.status === 'PENDING');

  const managerColumns: Column<ManagerAccount>[] = [
    {
      key: 'name',
      header: 'Manager Identity',
      render: (mgr) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full glass-control flex items-center justify-center font-bold text-xs text-foreground bg-primary/10">
            {mgr.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{mgr.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{mgr.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (mgr) => (
        <span className="text-xs font-medium text-foreground/80">
          {mgr.department || 'Operations'}
        </span>
      ),
    },
    {
      key: 'permissions',
      header: 'Assigned Permissions',
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
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (mgr) => (
        <button
          type="button"
          onClick={() => setTogglingManager(mgr)}
          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            mgr.isActive
              ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
          }`}
        >
          {mgr.isActive ? 'Suspend Access' : 'Reactivate'}
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Managers Governance & Joining Invitations">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Manager Accounts &amp; Onboarding
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Invite multiple managers, dispatch email verification links, and grant role-scoped permissions.
            </p>
          </div>

          <GlassButton
            variant="primary"
            size="md"
            onClick={handleOpenInvite}
            className="shrink-0 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite New Manager</span>
          </GlassButton>
        </div>

        {/* Pending Invitations Section */}
        {activeInvites.length > 0 && (
          <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-200">
                  Pending Invitations ({activeInvites.length} awaiting email verification)
                </h3>
              </div>
              <span className="text-[11px] text-amber-300/80">Authorized by Admin</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeInvites.map((inv) => {
                const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/portal/join?token=${inv.token}&email=${encodeURIComponent(inv.email)}`;
                return (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white">{inv.name}</p>
                      <p className="text-[11px] font-mono text-gray-400">{inv.email}</p>
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                        {inv.department}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(joinUrl)}
                        className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title="Copy Joining Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="Revoke Invitation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="max-w-md w-full">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search by manager name, email, department..."
            />
          </div>

          <FilterBar
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active Only', value: 'ACTIVE' },
              { label: 'Suspended Only', value: 'SUSPENDED' },
            ]}
            selectedValue={statusFilter}
            onSelect={setStatusFilter}
          />
        </div>

        {/* Active Managers Table */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Active Operational Managers</h3>
            <span className="text-xs text-muted-foreground">{filteredManagers.length} Total</span>
          </div>

          {filteredManagers.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Shield className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
              <p className="text-xs text-muted-foreground">
                No active managers found. Click &ldquo;Invite New Manager&rdquo; to send a joining link.
              </p>
            </div>
          ) : (
            <DataTable
              columns={managerColumns}
              data={filteredManagers}
              keyExtractor={(m) => m.id}
            />
          )}
        </div>
      </div>

      {/* Invite Manager Modal */}
      <FormDialog
        isOpen={isInviteOpen}
        title="Invite New Operations Manager"
        description="Admin sends an invitation link. The user opens the link, receives a verification code on email, and joins as Manager."
        onClose={() => setIsInviteOpen(false)}
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/15 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Manager Full Name</label>
            <GlassInput
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Vikram Mehta"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Corporate / Authorized Email (Verification Code will be sent here)
            </label>
            <GlassInput
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="e.g. vikram@ganeshmule.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Mobile Phone Number (Optional)</label>
            <GlassInput
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+91 98220 XXXXX"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Operational Department</label>
            <div className="flex gap-2 flex-wrap pb-1">
              {['Apiary & Dispatch', 'Customer Relations', 'Quality & Lab', 'Inventory Control'].map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setFormDepartment(dept)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    formDepartment === dept
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
            <GlassInput
              value={formDepartment}
              onChange={(e) => setFormDepartment(e.target.value)}
              placeholder="Custom Department Name"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-border/40">
            <label className="text-xs font-semibold text-foreground block">
              Manager Permissions Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
              {ALL_PERMISSIONS.map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-start gap-2 text-xs text-foreground cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors border border-border/20"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.key)}
                    onChange={() => togglePermission(perm.key)}
                    className="mt-0.5 rounded accent-primary"
                  />
                  <div>
                    <span className="font-medium block">{perm.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight block">
                      {perm.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
            <GlassButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting || !formName.trim() || !formEmail.trim()}
            >
              Send Joining Link & Email
            </GlassButton>
          </div>
        </form>
      </FormDialog>

      {/* Newly Created Invitation Alert Modal */}
      {newlyCreatedInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#1d1d1f] border border-white/20 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Manager Invitation Sent!</span>
            </div>
            <p className="text-xs text-gray-300">
              An invitation email has been dispatched to <strong>{newlyCreatedInvite.invite.email}</strong>. You can also copy the joining link below:
            </p>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-gray-300 truncate">
                {newlyCreatedInvite.inviteUrl}
              </span>
              <button
                type="button"
                onClick={() => handleCopyLink(newlyCreatedInvite.inviteUrl)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setNewlyCreatedInvite(null)}
              className="w-full py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!togglingManager}
        title={togglingManager?.isActive ? 'Suspend Manager Access' : 'Reactivate Manager Account'}
        description={`Are you sure you want to ${
          togglingManager?.isActive ? 'suspend' : 'reactivate'
        } ${togglingManager?.name} (${togglingManager?.email})?`}
        confirmLabel={togglingManager?.isActive ? 'Suspend Access' : 'Reactivate'}
        isDestructive={togglingManager?.isActive}
        onConfirm={handleConfirmToggleActive}
        onCancel={() => setTogglingManager(null)}
      />
    </DashboardLayout>
  );
}
