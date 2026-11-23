import fs from 'fs';
import path from 'path';
import { WhatsAppAlertSettings, WhatsAppMessageLog } from '@/types/whatsapp';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), '.data');

const SETTINGS_FILE = path.join(DATA_DIR, 'whatsapp-settings.json');
const LOGS_FILE = path.join(DATA_DIR, 'whatsapp-logs.json');

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppAlertSettings = {
  enabled: true,
  adminPhoneNumbers: ['919876543210'], // Default operations desk WhatsApp
  notifyNewOrders: true,
  notifyDispatches: true,
  notifyLowStock: true,
  notifyWarehouseReconcile: true,
  notifyWalletLowBalance: true,
  autoReconnect: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Default',
};

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[WhatsAppSettings] Warning creating data dir:', err);
  }
}

export function getWhatsAppSettings(): WhatsAppAlertSettings {
  ensureDataDir();
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return { ...DEFAULT_WHATSAPP_SETTINGS, ...data };
    }
  } catch (err) {
    console.warn('[WhatsAppSettings] Error reading settings file, fallback to default:', err);
  }
  return { ...DEFAULT_WHATSAPP_SETTINGS };
}

export function saveWhatsAppSettings(updates: Partial<WhatsAppAlertSettings>, updatedBy = 'Staff Admin'): WhatsAppAlertSettings {
  ensureDataDir();
  const current = getWhatsAppSettings();
  const next: WhatsAppAlertSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  try {
    const tempFile = `${SETTINGS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(next, null, 2), 'utf-8');
    fs.renameSync(tempFile, SETTINGS_FILE);
  } catch (err) {
    console.error('[WhatsAppSettings] Failed to save settings atomically:', err);
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf-8');
    } catch {}
  }

  return next;
}

export function getWhatsAppLogs(limit = 50): WhatsAppMessageLog[] {
  ensureDataDir();
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const raw = fs.readFileSync(LOGS_FILE, 'utf-8');
      const list: WhatsAppMessageLog[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.slice(0, limit);
      }
    }
  } catch (err) {
    console.warn('[WhatsAppLogs] Error reading logs:', err);
  }
  return [];
}

export function appendWhatsAppLog(log: Omit<WhatsAppMessageLog, 'id' | 'timestamp'>): WhatsAppMessageLog {
  ensureDataDir();
  const entry: WhatsAppMessageLog = {
    ...log,
    id: `wal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const current = getWhatsAppLogs(100);
    const updated = [entry, ...current].slice(0, 100);
    const tempFile = `${LOGS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempFile, LOGS_FILE);
  } catch (err) {
    console.warn('[WhatsAppLogs] Failed to append log:', err);
  }

  return entry;
}
