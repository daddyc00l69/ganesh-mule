import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizePhoneNumber,
  getBaileysStatus,
  sendBackendWhatsAppAlert,
  sendOrderPaidWhatsAppAlert,
  sendDelhiveryDispatchWhatsAppAlert,
} from '@/lib/whatsapp/baileys-service';
import {
  getWhatsAppSettings,
  saveWhatsAppSettings,
  getWhatsAppLogs,
  DEFAULT_WHATSAPP_SETTINGS,
} from '@/lib/whatsapp/settings';

describe('Baileys WhatsApp Backend Management Service', () => {
  beforeEach(() => {
    saveWhatsAppSettings(DEFAULT_WHATSAPP_SETTINGS);
  });

  it('correctly normalizes Indian and international phone numbers', () => {
    // 10-digit Indian number without country code
    expect(normalizePhoneNumber('9876543210')).toBe('919876543210');
    expect(normalizePhoneNumber('+91 98765-43210')).toBe('919876543210');

    // Number already with country code
    expect(normalizePhoneNumber('919876543210')).toBe('919876543210');
    expect(normalizePhoneNumber('+919876543210')).toBe('919876543210');

    // Strips formatting characters
    expect(normalizePhoneNumber('(91) 9876-543-210')).toBe('919876543210');
  });

  it('manages persistent WhatsApp alert configuration and settings', () => {
    const current = getWhatsAppSettings();
    expect(current.enabled).toBe(true);
    expect(current.notifyNewOrders).toBe(true);
    expect(current.notifyDispatches).toBe(true);
    expect(Array.isArray(current.adminPhoneNumbers)).toBe(true);

    const updated = saveWhatsAppSettings({
      adminPhoneNumbers: ['919999888877'],
      notifyLowStock: false,
    });

    expect(updated.adminPhoneNumbers).toEqual(['919999888877']);
    expect(updated.notifyLowStock).toBe(false);

    // Verify retrieval
    const retrieved = getWhatsAppSettings();
    expect(retrieved.adminPhoneNumbers).toEqual(['919999888877']);
    expect(retrieved.notifyLowStock).toBe(false);
  });

  it('returns valid Baileys service status structure', () => {
    const status = getBaileysStatus();
    expect(status).toHaveProperty('state');
    expect(status).toHaveProperty('settings');
    expect(status).toHaveProperty('stats');
    expect(['DISCONNECTED', 'CONNECTING', 'SCAN_QR_CODE', 'CONNECTED']).toContain(status.state);
  });

  it('safely queues and logs backend operational alerts when offline or in serverless environment', async () => {
    saveWhatsAppSettings({
      adminPhoneNumbers: ['919876543210'],
      notifyNewOrders: true,
    });

    const result = await sendBackendWhatsAppAlert({
      alertType: 'TEST',
      title: 'Unit Test Alert',
      message: '🧪 Test operational alert from Vitest suite',
    });

    // In local unit test without live phone connection, it should gracefully log as offline
    expect(result.totalRecipients).toBe(1);
    expect(result.recipients).toEqual(['919876543210']);

    // Verify it appeared in the audit logs
    const logs = getWhatsAppLogs(5);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].alertType).toBe('TEST');
    expect(logs[0].recipient).toBe('919876543210');
  });

  it('respects alert toggles and skips disabled events', async () => {
    saveWhatsAppSettings({
      notifyNewOrders: false,
    });

    const result = await sendBackendWhatsAppAlert({
      alertType: 'ORDER_PAID',
      title: 'Order Paid Alert',
      message: 'Test order paid alert',
    });

    expect(result.success).toBe(false);
    expect(result.skippedReason).toContain('toggled off');
  });

  it('formats and dispatches new paid order alerts without throwing', async () => {
    saveWhatsAppSettings({
      adminPhoneNumbers: ['919876543210'],
      notifyNewOrders: true,
    });

    await expect(
      sendOrderPaidWhatsAppAlert({
        orderNumber: 'SG-UNIT-TEST-1001',
        customerName: 'Test Beekeeping Customer',
        customerPhone: '9876543210',
        totalPaise: 44900,
        items: [{ name: 'Multiflora Raw Honey (500g)', quantity: 1 }],
        paymentId: 'pay_test_unit_123',
        destinationCity: 'Pandharpur',
        destinationPin: '413304',
        shippingMode: 'Surface',
        awbNumber: '71890010000490',
      })
    ).resolves.not.toThrow();

    const logs = getWhatsAppLogs(5);
    expect(logs.some((l) => l.alertType === 'ORDER_PAID')).toBe(true);
  });

  it('formats and dispatches Delhivery waybill dispatch alerts without throwing', async () => {
    saveWhatsAppSettings({
      adminPhoneNumbers: ['919876543210'],
      notifyDispatches: true,
    });

    await expect(
      sendDelhiveryDispatchWhatsAppAlert({
        orderNumber: 'SG-UNIT-TEST-1002',
        awbNumber: '71890010000495',
        carrier: 'Delhivery One Surface',
        destinationPin: '413304',
        destinationCity: 'Pandharpur',
      })
    ).resolves.not.toThrow();

    const logs = getWhatsAppLogs(5);
    expect(logs.some((l) => l.alertType === 'DELHIVERY_DISPATCH')).toBe(true);
  });
});
