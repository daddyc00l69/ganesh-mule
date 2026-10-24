'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DataTable, Column } from '@/components/ui/data-table';
import { GlassBadge } from '@/components/ui/glass-badge';
import { SearchInput } from '@/components/ui/search-input';
import { MOCK_AUDIT_LOGS } from '@/lib/mock-data';
import { AuditLogRecord } from '@/types';
import { formatDate } from '@/lib/utils';
import { ShieldAlert, Terminal, User } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs] = useState<AuditLogRecord[]>(MOCK_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.actorName && l.actorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns: Column<AuditLogRecord>[] = [
    {
      key: 'action',
      header: 'Event Action',
      render: (log) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {log.action}
        </span>
      ),
    },
    {
      key: 'entityType',
      header: 'Target Entity',
      render: (log) => (
        <GlassBadge variant="default" size="sm">
          {log.entityType}
        </GlassBadge>
      ),
    },
    {
      key: 'actor',
      header: 'Executed By',
      render: (log) => (
        <div>
          <p className="font-semibold text-foreground text-xs">{log.actorName || 'System'}</p>
          <p className="text-[11px] text-muted-foreground">{log.actorEmail || 'cron'}</p>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'Source IP',
      render: (log) => (
        <span className="font-mono text-xs text-muted-foreground">{log.ipAddress || '127.0.0.1'}</span>
      ),
    },
    {
      key: 'metadata',
      header: 'Audit Metadata (Safe)',
      render: (log) => (
        <pre className="text-[11px] font-mono text-muted-foreground max-w-xs truncate">
          {JSON.stringify(log.metadata)}
        </pre>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (log) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate(log.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout role="ADMIN" title="Security Audit Trails" userName="Super Admin">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Immutable Audit Logs
        </h2>
        <p className="text-xs text-muted-foreground">
          Cryptographically recorded security logs tracking administrative changes, price edits, and staff permission escalations
        </p>
      </div>

      <div className="flex items-center justify-between">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Search by action, actor, or entity type..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        emptyMessage="No audit log events recorded."
      />
    </DashboardLayout>
  );
}
