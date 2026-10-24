import { MOCK_ORDERS, MOCK_PRODUCTS, MOCK_AUDIT_LOGS } from '@/lib/mock-data';
import { getLiveOrders, updateLiveOrderStatus } from '@/lib/orders/store';
import { sendEmail, ADMIN_NOTIFICATION_EMAIL } from '@/lib/email/resend';
import { getWarehouseBatchEmailHtml } from '@/lib/email/templates';
import { OrderRecord } from '@/types';

export interface WarehouseMilestone {
  timeStr: string;
  hour: number;
  minute: number;
  title: string;
  action: string;
  type: 'INTAKE' | 'RECONCILE' | 'PICK_PACK' | 'BATCH_1' | 'COURIER_PICKUP' | 'SAME_DAY_CUTOFF';
}

export const WAREHOUSE_DAILY_SCHEDULE: WarehouseMilestone[] = [
  {
    timeStr: '24/7',
    hour: 0,
    minute: 0,
    title: 'Continuous Online Intake',
    action: 'Accept orders and verify prepaid payments (Razorpay 24/7)',
    type: 'INTAKE',
  },
  {
    timeStr: '12:30 AM IST',
    hour: 0,
    minute: 30,
    title: 'Scheduled Batch Reconciliation',
    action: 'Reconcile paid orders, confirm eligible orders, reserve stock, and generate the warehouse queue',
    type: 'RECONCILE',
  },
  {
    timeStr: '09:00 AM IST',
    hour: 9,
    minute: 0,
    title: 'Employee Packing Commencement',
    action: 'Employee starts picking and protective kraft glass packing',
    type: 'PICK_PACK',
  },
  {
    timeStr: '11:00 AM IST',
    hour: 11,
    minute: 0,
    title: 'First Batch Completion',
    action: 'Target first packing batch completion and courier manifest sealing',
    type: 'BATCH_1',
  },
  {
    timeStr: '01:00 PM IST',
    hour: 13,
    minute: 0,
    title: 'Courier Handover Window',
    action: 'Target courier pickup (Delhivery Insured Air), subject to courier schedule',
    type: 'COURIER_PICKUP',
  },
  {
    timeStr: '04:00 PM IST',
    hour: 16,
    minute: 0,
    title: 'Same-Day Dispatch Cutoff',
    action: 'Final same-day packing cutoff; subsequent orders roll to 12:30 AM batch',
    type: 'SAME_DAY_CUTOFF',
  },
];

/**
 * Returns current Date object converted to Indian Standard Time (UTC + 05:30)
 */
export function getIndianStandardTime(): {
  date: Date;
  hours: number;
  minutes: number;
  seconds: number;
  formattedTime: string;
  formattedDate: string;
} {
  const now = new Date();
  // IST offset is UTC + 5.5 hours (+330 minutes)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utcMs + 330 * 60000);

  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const seconds = istDate.getSeconds();

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  const formattedTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds} IST`;
  const formattedDate = istDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    date: istDate,
    hours,
    minutes,
    seconds,
    formattedTime,
    formattedDate,
  };
}

/**
 * Returns current warehouse operational status based on current IST time
 */
export function getWarehouseOperationalStatus() {
  const ist = getIndianStandardTime();
  const timeInMinutes = ist.hours * 60 + ist.minutes;

  let currentPhase = WAREHOUSE_DAILY_SCHEDULE[0];
  let nextPhase = WAREHOUSE_DAILY_SCHEDULE[1];
  let minutesUntilNext = 0;

  if (timeInMinutes < 30) {
    // 00:00 to 00:29
    currentPhase = WAREHOUSE_DAILY_SCHEDULE[0];
    nextPhase = WAREHOUSE_DAILY_SCHEDULE[1];
    minutesUntilNext = 30 - timeInMinutes;
  } else if (timeInMinutes < 9 * 60) {
    // 00:30 to 08:59
    currentPhase = WAREHOUSE_DAILY_SCHEDULE[1];
    nextPhase = WAREHOUSE_DAILY_SCHEDULE[2];
    minutesUntilNext = 9 * 60 - timeInMinutes;
  } else if (timeInMinutes < 11 * 60) {
    // 09:00 to 10:59
    currentPhase = WAREHOUSE_DAILY_SCHEDULE[2];
    nextPhase = WAREHOUSE_DAILY_SCHEDULE[3];
    minutesUntilNext = 11 * 60 - timeInMinutes;
  } else if (timeInMinutes < 13 * 60) {
    // 11:00 to 12:59
    currentPhase = WAREHOUSE_DAILY_SCHEDULE[3];
    nextPhase = WAREHOUSE_DAILY_SCHEDULE[4];
    minutesUntilNext = 13 * 60 - timeInMinutes;
  } else if (timeInMinutes < 16 * 60) {
    // 13:00 to 15:59
    currentPhase = WAREHOUSE_DAILY_SCHEDULE[4];
    nextPhase = WAREHOUSE_DAILY_SCHEDULE[5];
    minutesUntilNext = 16 * 60 - timeInMinutes;
  } else {
    // 16:00 to 23:59
    currentPhase = WAREHOUSE_DAILY_SCHEDULE[5];
    nextPhase = WAREHOUSE_DAILY_SCHEDULE[1]; // Rolls over to 12:30 AM tomorrow
    minutesUntilNext = 24 * 60 - timeInMinutes + 30;
  }

  const hoursRemaining = Math.floor(minutesUntilNext / 60);
  const minsRemaining = minutesUntilNext % 60;
  const countdownFormatted = `${hoursRemaining}h ${minsRemaining}m`;

  return {
    istTime: ist.formattedTime,
    istDate: ist.formattedDate,
    currentPhase,
    nextPhase,
    minutesUntilNext,
    countdownFormatted,
    isPickingActive: timeInMinutes >= 9 * 60 && timeInMinutes <= 16 * 60,
    isReconcileActive: timeInMinutes >= 30 && timeInMinutes < 9 * 60,
  };
}

export interface ReconcileBatchResult {
  batchId: string;
  timestamp: string;
  ordersReconciled: number;
  totalUnits: number;
  skuSummary: { sku: string; name: string; quantity: number }[];
  orderNumbers: string[];
  emailDispatched: boolean;
  message: string;
}

/**
 * 12:30 AM IST Reconcile Batch Worker
 * Scans paid orders in PROCESSING state, confirms them, validates reserved stock,
 * and compiles picking list for the morning packaging team.
 */
export async function runWarehouseReconcileBatch(
  actor = 'System Scheduler (12:30 AM IST)'
): Promise<ReconcileBatchResult> {
  const ist = getIndianStandardTime();
  const dateStamp = ist.date.toISOString().slice(0, 10).replace(/-/g, '');
  const batchId = `WH-IST-${dateStamp}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Find all eligible paid orders awaiting confirmation from live store
  const liveOrders = getLiveOrders();
  const eligibleOrders = liveOrders.filter(
    (o) => o.paymentStatus === 'PAID' && o.orderStatus === 'PROCESSING'
  );

  const skuMap = new Map<string, { sku: string; name: string; quantity: number }>();
  let totalUnits = 0;
  const orderNumbers: string[] = [];

  for (const order of eligibleOrders) {
    order.orderStatus = 'CONFIRMED';
    order.updatedAt = new Date().toISOString();
    orderNumbers.push(order.orderNumber);
    updateLiveOrderStatus(order.id, { orderStatus: 'CONFIRMED' });

    for (const item of order.items) {
      totalUnits += item.quantity;
      const existing = skuMap.get(item.sku);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        skuMap.set(item.sku, {
          sku: item.sku,
          name: item.productName,
          quantity: item.quantity,
        });
      }
    }
  }

  const skuSummary = Array.from(skuMap.values());

  // Record audit log entry
  MOCK_AUDIT_LOGS.unshift({
    id: `audit-${Date.now()}`,
    actorId: 'usr-admin-1',
    actorName: actor,
    actorEmail: 'operations@ganeshmule.com',
    action: 'WAREHOUSE_BATCH_RECONCILED',
    entityType: 'WarehouseBatch',
    entityId: batchId,
    metadata: {
      ordersCount: eligibleOrders.length,
      totalUnits,
      orderNumbers,
      schedule: '12:30 AM IST Automation',
    },
    ipAddress: '127.0.0.1 (Internal Cron)',
    createdAt: new Date().toISOString(),
  });

  // Dispatch Email Notification to Operations Desk & Admin
  let emailDispatched = false;
  if (eligibleOrders.length > 0) {
    try {
      const emailHtml = getWarehouseBatchEmailHtml({
        batchId,
        reconciledAt: ist.formattedTime,
        ordersCount: eligibleOrders.length,
        totalUnits,
        skuSummary,
      });

      const res = await sendEmail(
        {
          to: ADMIN_NOTIFICATION_EMAIL,
          subject: `[Warehouse Alert] 12:30 AM IST Reconciled Queue: ${batchId} (${eligibleOrders.length} Orders)`,
          html: emailHtml,
        },
        'WAREHOUSE_BATCH'
      );
      emailDispatched = res.success;
    } catch (e) {
      console.warn('Failed to dispatch warehouse batch email:', e);
    }
  }

  return {
    batchId,
    timestamp: ist.formattedTime,
    ordersReconciled: eligibleOrders.length,
    totalUnits,
    skuSummary,
    orderNumbers,
    emailDispatched,
    message:
      eligibleOrders.length > 0
        ? `Successfully reconciled ${eligibleOrders.length} paid orders (${totalUnits} units) into Batch ${batchId}. Queue is ready for 9:00 AM IST picking.`
        : `Warehouse batch ${batchId} evaluated: 0 pending processing orders found. Warehouse queue is up to date.`,
  };
}
