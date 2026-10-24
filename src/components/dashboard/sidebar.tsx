'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  UserCheck,
  BarChart3,
  ShieldAlert,
  Settings,
  MessageSquare,
  ExternalLink,
  LogOut,
  X,
  Sparkles,
  TicketPercent,
} from 'lucide-react';
import { GlassBadge } from '@/components/ui/glass-badge';
import { cn } from '@/lib/utils';
import { BRAND_SHORT } from '@/lib/constants/brand';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface SidebarProps {
  role: 'ADMIN' | 'MANAGER';
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose }) => {
  const pathname = usePathname();
  const [pendingOrdersCount, setPendingOrdersCount] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) {
          const pending = data.orders.filter(
            (o: any) => o.orderStatus === 'PROCESSING' || o.orderStatus === 'CONFIRMED'
          ).length;
          setPendingOrdersCount(pending > 0 ? pending : undefined);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const adminNavItems: NavItem[] = [
    { title: 'Overview', href: '/admin', icon: LayoutDashboard },
    { title: 'Managers', href: '/admin/managers', icon: Users },
    { title: 'Products', href: '/admin/products', icon: Package },
    { title: 'Categories', href: '/admin/categories', icon: Layers },
    { title: 'Orders', href: '/admin/orders', icon: ShoppingBag, badge: pendingOrdersCount },
    { title: 'Inventory', href: '/admin/inventory', icon: Boxes },
    { title: 'Customers', href: '/admin/customers', icon: UserCheck },
    { title: 'Discount Coupons', href: '/admin/coupons', icon: TicketPercent },
    { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { title: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
    { title: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const managerNavItems: NavItem[] = [
    { title: 'Overview', href: '/manager', icon: LayoutDashboard },
    { title: 'Order Queue', href: '/manager/orders', icon: ShoppingBag, badge: pendingOrdersCount },
    { title: 'Inventory Desk', href: '/manager/inventory', icon: Boxes },
    { title: 'My Promo Codes', href: '/manager/coupons', icon: TicketPercent },
    { title: 'Fees & Shipping', href: '/manager/settings', icon: Settings },
    { title: 'Customer Support', href: '/manager/support', icon: MessageSquare },
    { title: 'Operations Reports', href: '/manager/reports', icon: BarChart3 },
  ];

  const navItems = role === 'ADMIN' ? adminNavItems : managerNavItems;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/portal';
    } catch {
      window.location.href = '/portal';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-border/40 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border/40">
          <Link href={role === 'ADMIN' ? '/admin' : '/manager'} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl glass-primary flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                <span>{BRAND_SHORT}</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                {role === 'ADMIN' ? 'Admin Console' : 'Manager Desk'}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <GlassBadge
              variant={role === 'ADMIN' ? 'destructive' : 'info'}
              size="sm"
            >
              {role}
            </GlassBadge>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === (role === 'ADMIN' ? '/admin' : '/manager')
                ? pathname === item.href
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-xs font-medium rounded-control transition-all select-none',
                  isActive
                    ? 'glass-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/10 dark:hover:bg-white/10'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-inherit' : 'text-muted-foreground')} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-semibold',
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-foreground'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border/40 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-control transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Storefront</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-control transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
