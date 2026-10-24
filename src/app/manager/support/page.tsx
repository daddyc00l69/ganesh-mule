'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  User,
  Clock,
  ArrowUpRight,
  Headphones,
  CheckCircle2,
} from 'lucide-react';

export default function ManagerSupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<string>('t-1');

  const mockConversations = [
    {
      id: 't-1',
      customerName: 'Aarav Deshmukh',
      customerEmail: 'aarav.d@gmail.com',
      orderNumber: 'General Inquiry',
      subject: 'Raw honey crystallization and shelf storage guidance',
      status: 'OPEN',
      updatedAt: '10 mins ago',
      messages: [
        {
          sender: 'customer',
          text: 'Hello, I wanted to inquire if the Wild Forest honey will naturally crystallize over the winter season?',
          time: '10:14 AM',
        },
        {
          sender: 'agent',
          text: 'Hi Aarav! Yes, 100% pure raw unheated honey naturally crystallizes due to natural glucose-to-fructose ratios. It is a sign of purity and intact pollen enzymes. Simply place the glass jar in a warm water bowl (below 40°C) to reliquefy.',
          time: '10:18 AM',
        },
        {
          sender: 'customer',
          text: 'Thank you! Truly appreciate the quick and knowledgeable response.',
          time: '10:20 AM',
        },
      ],
    },
    {
      id: 't-2',
      customerName: 'Sneha Rao',
      customerEmail: 'sneha.rao@outlook.com',
      orderNumber: 'General Inquiry',
      subject: 'Inquiry regarding NMR lab purity certificates for batch 2026-WF04',
      status: 'WAITING',
      updatedAt: '35 mins ago',
      messages: [
        {
          sender: 'customer',
          text: 'Hi, where can I verify the NMR spectroscopy lab report for the latest forest harvest batch?',
          time: '09:45 AM',
        },
      ],
    },
  ];

  const currentTicket =
    mockConversations.find((c) => c.id === selectedTicket) || mockConversations[0];
  const relatedOrder = MOCK_ORDERS.find(
    (o) => o.orderNumber === currentTicket.orderNumber
  );

  return (
    <DashboardLayout role="MANAGER" title="Chatwoot Customer Support Desk" userName="Vikram Mehta">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Customer Support Console
          </h2>
          <p className="text-xs text-muted-foreground">
            Direct integration with Chatwoot live agent inbox and order context verification
          </p>
        </div>

        <a
          href="https://app.chatwoot.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GlassButton variant="primary" size="sm" className="gap-2">
            <span>Open Full Chatwoot Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </GlassButton>
        </a>
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List Pane */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Assigned Inquiries ({mockConversations.length})
            </span>
            <GlassBadge variant="success" size="sm">
              Live Gateway
            </GlassBadge>
          </div>

          <div className="space-y-2">
            {mockConversations.map((ticket) => {
              const isSelected = ticket.id === selectedTicket;
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'glass-card border-brand/40 shadow-md'
                      : 'glass-panel hover:bg-accent/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">
                      {ticket.customerName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {ticket.updatedAt}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 line-clamp-1 mt-1 font-medium">
                    {ticket.subject}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono text-brand font-semibold">
                      {ticket.orderNumber}
                    </span>
                    <GlassBadge
                      variant={ticket.status === 'OPEN' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {ticket.status}
                    </GlassBadge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation Thread & Order Context */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard variant="card" className="flex flex-col min-h-[460px]">
            {/* Thread Header */}
            <div className="pb-3 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {currentTicket.subject}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Conversation with {currentTicket.customerName} ({currentTicket.customerEmail})
                </p>
              </div>

              {relatedOrder && (
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground">Order Snapshot Value:</span>
                  <p className="font-mono font-bold text-xs text-foreground">
                    {formatCurrency(relatedOrder.totalAmount)}
                  </p>
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[300px]">
              {currentTicket.messages.map((m, idx) => {
                const isAgent = m.sender === 'agent';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                        isAgent
                          ? 'glass-primary text-primary-foreground'
                          : 'glass-control text-foreground'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {m.time}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            <div className="pt-3 border-t border-border/40 flex gap-2">
              <input
                type="text"
                placeholder="Type response to customer via Chatwoot..."
                className="glass-input flex-1 h-10 px-3.5 text-xs rounded-control text-foreground outline-none focus:ring-2 focus:ring-ring/40"
              />
              <GlassButton variant="primary" size="md">
                Send Reply
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
