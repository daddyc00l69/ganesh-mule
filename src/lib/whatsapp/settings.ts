import fs from 'fs';
import path from 'path';
import { WhatsAppAlertSettings, WhatsAppMessageLog } from '@/types/whatsapp';
import { getDataDir } from '@/lib/storage/json-store';

function getStorageDir(): string {
  const dir = getDataDir();
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn('[WhatsAppSettings] Warning creating storage dir:', err);
  }
  return dir;
}

const getSettingsFile = () => path.join(getStorageDir(), 'whatsapp-settings.json');
const getLogsFile = () => path.join(getStorageDir(), 'whatsapp-logs.json');

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppAlertSettings = {
  enabled: true,
  adminPhoneNumbers: ['919876543210'], // Default operations desk WhatsApp
  staffGroups: [], // WhatsApp groups for team alerts e.g. [{ jid: '120363...@g.us', name: 'Staff Operations Group' }]
  notifyNewOrders: true,
  notifyDispatches: true,
  notifyLowStock: true,
  notifyWarehouseReconcile: true,
  notifyWalletLowBalance: true,
  autoReconnect: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Default',
};

export function getWhatsAppSettings(): WhatsAppAlertSettings {
  const settingsFile = getSettingsFile();
  try {
    if (fs.existsSync(settingsFile)) {
      const raw = fs.readFileSync(settingsFile, 'utf-8');
      const data = JSON.parse(raw);
      return { ...DEFAULT_WHATSAPP_SETTINGS, ...data };
    }
  } catch (err) {
    console.warn('[WhatsAppSettings] Error reading settings file, fallback to default:', err);
  }
  return { ...DEFAULT_WHATSAPP_SETTINGS };
}

export function saveWhatsAppSettings(updates: Partial<WhatsAppAlertSettings>, updatedBy = 'Staff Admin'): WhatsAppAlertSettings {
  const settingsFile = getSettingsFile();
  const current = getWhatsAppSettings();
  const next: WhatsAppAlertSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  try {
    const tempFile = `${settingsFile}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(next, null, 2), 'utf-8');
    fs.renameSync(tempFile, settingsFile);
  } catch (err) {
    console.error('[WhatsAppSettings] Failed to save settings atomically:', err);
    try {
      fs.writeFileSync(settingsFile, JSON.stringify(next, null, 2), 'utf-8');
    } catch {}
  }

  return next;
}

export function getWhatsAppLogs(limit = 50): WhatsAppMessageLog[] {
  const logsFile = getLogsFile();
  try {
    if (fs.existsSync(logsFile)) {
      const raw = fs.readFileSync(logsFile, 'utf-8');
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
  const logsFile = getLogsFile();
  const entry: WhatsAppMessageLog = {
    ...log,
    id: `wal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const current = getWhatsAppLogs(100);
    const updated = [entry, ...current].slice(0, 100);
    const tempFile = `${logsFile}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tempFile, logsFile);
  } catch (err) {
    console.warn('[WhatsAppLogs] Failed to append log:', err);
  }

  return entry;
}
