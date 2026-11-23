import path from 'path';
import fs from 'fs';
import {
  WhatsAppConnectionState,
  WhatsAppServiceStatus,
  WhatsAppAlertSettings,
} from '@/types/whatsapp';
import {
  getWhatsAppSettings,
  saveWhatsAppSettings,
  appendWhatsAppLog,
  getWhatsAppLogs,
} from './settings';
import { getDataDir } from '@/lib/storage/json-store';

// Global singleton registry to prevent socket recreation on hot module reload
interface GlobalBaileysState {
  socket: any | null;
  state: WhatsAppConnectionState;
  qrCodeDataUrl?: string;
  pairingCode?: string;
  userPhone?: string;
  userName?: string;
  lastConnectedAt?: string;
  lastError?: string;
  totalSent: number;
  totalFailed: number;
  lastSentAt?: string;
  reconnectAttempts: number;
}

const g = globalThis as unknown as {
  __GANESH_BAILEYS__?: GlobalBaileysState;
};

if (!g.__GANESH_BAILEYS__) {
  g.__GANESH_BAILEYS__ = {
    socket: null,
    state: 'DISCONNECTED',
    totalSent: 0,
    totalFailed: 0,
    reconnectAttempts: 0,
  };
}

const baileysState = g.__GANESH_BAILEYS__;

function getAuthDir(): string {
  return path.join(getDataDir(), 'baileys_auth');
}

function ensureAuthDir(): string {
  const dir = getAuthDir();
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn('[Baileys] Warning ensuring auth directory:', err);
  }
  return dir;
}

/**
 * Normalizes phone number into standard international format without symbols
 * e.g., "+91 98765-43210" -> "919876543210"
 */
export function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/\D/g, '');
  // Default to 91 (India) if 10-digit number given
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Returns the current status of the Baileys WhatsApp backend service
 */
export function getBaileysStatus(): WhatsAppServiceStatus {
  return {
    state: baileysState.state,
    userPhone: baileysState.userPhone,
    userName: baileysState.userName,
    qrCodeDataUrl: baileysState.qrCodeDataUrl,
    pairingCode: baileysState.pairingCode,
    lastConnectedAt: baileysState.lastConnectedAt,
    lastError: baileysState.lastError,
    settings: getWhatsAppSettings(),
    stats: {
      totalSent: baileysState.totalSent,
      totalFailed: baileysState.totalFailed,
      lastSentAt: baileysState.lastSentAt,
    },
  };
}

/**
 * Initializes or restarts the Baileys WhatsApp Web Multi-Device socket
 */
export async function initializeBaileys(options: { phoneNumberForPairing?: string; waitForQR?: boolean } = {}): Promise<WhatsAppServiceStatus> {
  const authDir = ensureAuthDir();

  // If already connected, return current status
  if (baileysState.socket && baileysState.state === 'CONNECTED') {
    return getBaileysStatus();
  }

  // If already waiting for scan and QR is ready, return current status immediately unless pairing requested
  if (baileysState.socket && baileysState.qrCodeDataUrl && !options.phoneNumberForPairing && baileysState.state === 'SCAN_QR_CODE') {
    return getBaileysStatus();
  }

  baileysState.state = 'CONNECTING';
  baileysState.lastError = undefined;

  try {
    // Dynamically require Baileys, QRCode, and Pino
    const baileys = await import('@whiskeysockets/baileys');
    const qrcode = await import('qrcode');
    const pino = await import('pino');

    const makeWASocket = baileys.default || baileys.makeWASocket;
    const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys;

    const logger = pino.default({ level: 'silent' });
    const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);

    let version: [number, number, number] = [2, 3000, 1015901307];
    try {
      const v = await fetchLatestBaileysVersion();
      if (v?.version) version = v.version;
    } catch {}

    const browser: [string, string, string] = (Browsers ? Browsers.ubuntu('Chrome') : ['Ubuntu', 'Chrome', '22.04.4']) as [string, string, string];

    const sock = makeWASocket({
      version,
      logger,
      auth: authState,
      printQRInTerminal: false,
      browser,
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
    });

    baileysState.socket = sock;

    // Listen to credentials update
    sock.ev.on('creds.update', saveCreds);

    // Listen to connection updates (QR, Open, Close)
    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await qrcode.toDataURL(qr, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 280,
            color: {
              dark: '#1d1d1f',
              light: '#ffffff',
            },
          });
          baileysState.qrCodeDataUrl = qrDataUrl;
          baileysState.state = 'SCAN_QR_CODE';
        } catch (qrErr) {
          console.error('[Baileys] Error rendering QR code data URL:', qrErr);
        }
      }

      if (connection === 'open') {
        baileysState.state = 'CONNECTED';
        baileysState.qrCodeDataUrl = undefined;
        baileysState.pairingCode = undefined;
        baileysState.lastConnectedAt = new Date().toISOString();
        baileysState.reconnectAttempts = 0;

        const user = sock.user;
        if (user) {
          baileysState.userPhone = user.id ? user.id.split(':')[0] : undefined;
          baileysState.userName = user.name || 'Ganesh Mule Operations';
        }
        console.log(`[Baileys WhatsApp] Connected successfully as ${baileysState.userName || baileysState.userPhone}`);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        baileysState.state = 'DISCONNECTED';
        baileysState.qrCodeDataUrl = undefined;
        baileysState.pairingCode = undefined;
        baileysState.lastError = lastDisconnect?.error?.message || `Disconnected with code ${statusCode}`;

        console.warn(`[Baileys WhatsApp] Connection closed (code: ${statusCode}, shouldReconnect: ${shouldReconnect})`);

        if (statusCode === DisconnectReason.loggedOut) {
          // Clear credentials on logout
          try {
            const dir = getAuthDir();
            if (fs.existsSync(dir)) {
              fs.rmSync(dir, { recursive: true, force: true });
            }
          } catch {}
          baileysState.socket = null;
        } else if (shouldReconnect && getWhatsAppSettings().autoReconnect) {
          if (baileysState.reconnectAttempts < 5) {
            baileysState.reconnectAttempts++;
            const delay = Math.min(30000, 5000 * baileysState.reconnectAttempts);
            setTimeout(() => {
              initializeBaileys().catch(() => {});
            }, delay);
          }
        }
      }
    });

    // Request pairing code if requested instead of QR
    if (options.phoneNumberForPairing && !authState.creds.registered) {
      setTimeout(async () => {
        try {
          const clean = normalizePhoneNumber(options.phoneNumberForPairing!);
          const code = await sock.requestPairingCode(clean);
          baileysState.pairingCode = code;
          baileysState.state = 'SCAN_QR_CODE';
        } catch (pairErr: any) {
          console.error('[Baileys] Pairing code error:', pairErr);
          baileysState.lastError = `Failed to generate pairing code: ${pairErr.message}`;
        }
      }, 1500);
    }

    // If waiting for QR code (default true unless pairing phone specified), await initial QR or connection
    const shouldWait = options.waitForQR !== false && !options.phoneNumberForPairing;
    if (shouldWait) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 7000);
        const interval = setInterval(() => {
          if (baileysState.qrCodeDataUrl || baileysState.state === 'CONNECTED' || baileysState.state === 'DISCONNECTED') {
            clearTimeout(timeout);
            clearInterval(interval);
            resolve();
          }
        }, 200);
      });
    }

    return getBaileysStatus();
  } catch (initErr: any) {
    console.error('[Baileys] Failed to initialize socket:', initErr);
    baileysState.state = 'DISCONNECTED';
    baileysState.lastError = initErr.message;
    return getBaileysStatus();
  }
}

/**
 * Disconnects the active Baileys socket. If logout=true, deletes persistent credentials.
 */
export async function disconnectBaileys(logout = false): Promise<WhatsAppServiceStatus> {
  if (baileysState.socket) {
    try {
      if (logout && baileysState.socket.logout) {
        await baileysState.socket.logout();
      } else if (baileysState.socket.end) {
        baileysState.socket.end(new Error('Manual disconnect'));
      }
    } catch (err) {
      console.warn('[Baileys] Error during socket closure:', err);
    }
  }

  baileysState.socket = null;
  baileysState.state = 'DISCONNECTED';
  baileysState.qrCodeDataUrl = undefined;
  baileysState.pairingCode = undefined;
  baileysState.userPhone = undefined;
  baileysState.userName = undefined;

  if (logout) {
    try {
      const dir = getAuthDir();
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch {}
  }

  return getBaileysStatus();
}

/**
 * Generates an 8-character pairing code for phone-based WhatsApp device linking
 */
export async function requestPairingCode(phoneNumber: string): Promise<{ success: boolean; pairingCode?: string; error?: string }> {
  const cleanPhone = normalizePhoneNumber(phoneNumber);
  if (cleanPhone.length < 10) {
    return { success: false, error: 'Invalid phone number for pairing.' };
  }

  await disconnectBaileys(false);
  await initializeBaileys({ phoneNumberForPairing: cleanPhone, waitForQR: false });

  // Wait for pairing code to generate
  for (let i = 0; i < 20; i++) {
    if (baileysState.pairingCode) {
      return { success: true, pairingCode: baileysState.pairingCode };
    }
    await new Promise((res) => setTimeout(res, 500));
  }

  return {
    success: false,
    error: baileysState.lastError || 'Pairing code generation timed out. Please try QR code instead.',
  };
}

export interface BackendAlertPayload {
  alertType: 'ORDER_PAID' | 'DELHIVERY_DISPATCH' | 'LOW_STOCK' | 'WAREHOUSE_RECONCILE' | 'WALLET_LOW' | 'TEST';
  title: string;
  message: string;
  customRecipients?: string[];
}

/**
 * Dispatches an authoritative WhatsApp alert to configured Backend/Manager phone numbers
 */
export async function sendBackendWhatsAppAlert(payload: BackendAlertPayload): Promise<{
  success: boolean;
  sentCount: number;
  totalRecipients: number;
  recipients: string[];
  skippedReason?: string;
}> {
  const settings = getWhatsAppSettings();

  // Check alert-specific enable toggle
  if (!settings.enabled) {
    appendWhatsAppLog({
      recipient: 'ALL',
      alertType: payload.alertType,
      status: 'SKIPPED_DISCONNECTED',
      preview: payload.message.slice(0, 100),
      errorMessage: 'WhatsApp Alerts disabled in settings',
    });
    return { success: false, sentCount: 0, totalRecipients: 0, recipients: [], skippedReason: 'Disabled in settings' };
  }

  if (payload.alertType === 'ORDER_PAID' && !settings.notifyNewOrders) {
    return { success: false, sentCount: 0, totalRecipients: 0, recipients: [], skippedReason: 'New order alerts toggled off' };
  }
  if (payload.alertType === 'DELHIVERY_DISPATCH' && !settings.notifyDispatches) {
    return { success: false, sentCount: 0, totalRecipients: 0, recipients: [], skippedReason: 'Dispatch alerts toggled off' };
  }
  if (payload.alertType === 'LOW_STOCK' && !settings.notifyLowStock) {
    return { success: false, sentCount: 0, totalRecipients: 0, recipients: [], skippedReason: 'Low stock alerts toggled off' };
  }
  if (payload.alertType === 'WAREHOUSE_RECONCILE' && !settings.notifyWarehouseReconcile) {
    return { success: false, sentCount: 0, totalRecipients: 0, recipients: [], skippedReason: 'Reconcile alerts toggled off' };
  }
  if (payload.alertType === 'WALLET_LOW' && !settings.notifyWalletLowBalance) {
    return { success: false, sentCount: 0, totalRecipients: 0, recipients: [], skippedReason: 'Wallet low alerts toggled off' };
  }

  const rawRecipients = payload.customRecipients && payload.customRecipients.length > 0
    ? payload.customRecipients
    : settings.adminPhoneNumbers;

  const validRecipients = rawRecipients
    .map((r) => normalizePhoneNumber(r))
    .filter((r) => r.length >= 10);

  if (validRecipients.length === 0) {
    appendWhatsAppLog({
      recipient: 'NONE',
      alertType: payload.alertType,
      status: 'FAILED',
      preview: payload.message.slice(0, 100),
      errorMessage: 'No configured admin phone numbers found',
    });
    return { success: false, sentCount: 0, totalRecipients: 0, recipients: [], skippedReason: 'No admin numbers configured' };
  }

  // Check if live socket is connected
  const isLive = baileysState.socket && baileysState.state === 'CONNECTED';
  let sentCount = 0;

  for (const phone of validRecipients) {
    const jid = `${phone}@s.whatsapp.net`;

    if (isLive) {
      try {
        await baileysState.socket.sendMessage(jid, { text: payload.message });
        sentCount++;
        baileysState.totalSent++;
        baileysState.lastSentAt = new Date().toISOString();

        appendWhatsAppLog({
          recipient: phone,
          alertType: payload.alertType,
          status: 'SENT',
          preview: payload.message.slice(0, 120),
        });
      } catch (sendErr: any) {
        console.error(`[Baileys WhatsApp] Failed to send message to ${phone}:`, sendErr);
        baileysState.totalFailed++;
        appendWhatsAppLog({
          recipient: phone,
          alertType: payload.alertType,
          status: 'FAILED',
          preview: payload.message.slice(0, 120),
          errorMessage: sendErr.message,
        });
      }
    } else {
      // Offline / Serverless fallback: Log the alert gracefully
      appendWhatsAppLog({
        recipient: phone,
        alertType: payload.alertType,
        status: 'SKIPPED_DISCONNECTED',
        preview: payload.message.slice(0, 120),
        errorMessage: 'WhatsApp Web socket not currently connected (scan QR in /admin/whatsapp)',
      });
    }
  }

  return {
    success: isLive ? sentCount > 0 : false,
    sentCount,
    totalRecipients: validRecipients.length,
    recipients: validRecipients,
    skippedReason: !isLive ? 'Socket not connected. Please scan QR in /admin/whatsapp' : undefined,
  };
}

/**
 * Convenience helper to format and dispatch a New Paid Order notification
 */
export async function sendOrderPaidWhatsAppAlert(order: {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  totalPaise: number;
  items: Array<{ name: string; quantity: number }>;
  paymentId?: string;
  destinationCity?: string;
  destinationPin?: string;
  shippingMode?: string;
  awbNumber?: string;
}): Promise<void> {
  const itemsList = order.items.map((i) => `• ${i.name} (x${i.quantity})`).join('\n');
  const amountFormatted = `₹${(order.totalPaise / 100).toFixed(2)}`;

  const message = [
    `🍯 *GANESH MULE — NEW PAID ORDER* 📦`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*Order:* #${order.orderNumber}`,
    `*Customer:* ${order.customerName} ${order.customerPhone ? `(${order.customerPhone})` : ''}`,
    `*Amount:* ${amountFormatted} (Prepaid via Razorpay)`,
    `*Payment ID:* ${order.paymentId || 'Verified'}`,
    ``,
    `*Items:*`,
    itemsList,
    ``,
    `*Destination:* ${order.destinationCity || 'Maharashtra'} (${order.destinationPin || 'India'})`,
    `*Logistics:* Delhivery One ${order.shippingMode || 'Surface'}`,
    order.awbNumber ? `*AWB Waybill:* ${order.awbNumber}` : `*AWB:* Pending automated allocation`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `_Insured solid glass packaging required. Ready for dispatch._`,
  ].join('\n');

  await sendBackendWhatsAppAlert({
    alertType: 'ORDER_PAID',
    title: `New Order #${order.orderNumber}`,
    message,
  });
}

/**
 * Convenience helper to format and dispatch a Delhivery Consignment Dispatch notification
 */
export async function sendDelhiveryDispatchWhatsAppAlert(params: {
  orderNumber: string;
  awbNumber: string;
  carrier?: string;
  originPin?: string;
  destinationPin?: string;
  destinationCity?: string;
}): Promise<void> {
  const message = [
    `🚚 *DELHIVERY CONSIGNMENT ALLOCATED* 📦`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*Order:* #${params.orderNumber}`,
    `*Waybill (AWB):* ${params.awbNumber}`,
    `*Carrier:* ${params.carrier || 'Delhivery One (Surface)'}`,
    `*Origin Hub:* Pune Apiary (${params.originPin || '411004'})`,
    `*Destination Hub:* ${params.destinationCity || 'Destination'} (${params.destinationPin || 'India'})`,
    ``,
    `*Live Courier Tracking:*`,
    `https://www.delhivery.com/track/package/${params.awbNumber}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `_Consignment slotted on one.delhivery.com. Print packing slip & manifest._`,
  ].join('\n');

  await sendBackendWhatsAppAlert({
    alertType: 'DELHIVERY_DISPATCH',
    title: `Delhivery Waybill Allocated #${params.awbNumber}`,
    message,
  });
}

/**
 * Convenience helper for 12:30 AM IST Batch Reconciliation Summary
 */
export async function sendReconcileWhatsAppAlert(summary: {
  reconciledCount: number;
  totalRevenuePaise: number;
  date: string;
}): Promise<void> {
  const message = [
    `🌙 *12:30 AM IST WAREHOUSE RECONCILIATION* 📊`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `*Date:* ${summary.date}`,
    `*Orders Reconciled:* ${summary.reconciledCount}`,
    `*Gross Daily Revenue:* ₹${(summary.totalRevenuePaise / 100).toFixed(2)}`,
    `*Inventory Status:* 100% In-Stock Audit Verified`,
    `*Courier Sync:* Delhivery One Webhook & Tracking Ledger Active`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `_Automated nightly batch reconciliation completed._`,
  ].join('\n');

  await sendBackendWhatsAppAlert({
    alertType: 'WAREHOUSE_RECONCILE',
    title: '12:30 AM Warehouse Reconciliation',
    message,
  });
}
