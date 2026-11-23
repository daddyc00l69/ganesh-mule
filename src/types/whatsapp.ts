export type WhatsAppConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'SCAN_QR_CODE'
  | 'CONNECTED';

export interface WhatsAppAlertSettings {
  enabled: boolean;
  adminPhoneNumbers: string[]; // e.g. ["919876543210"]
  notifyNewOrders: boolean;
  notifyDispatches: boolean;
  notifyLowStock: boolean;
  notifyWarehouseReconcile: boolean;
  notifyWalletLowBalance: boolean;
  autoReconnect: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface WhatsAppMessageLog {
  id: string;
  timestamp: string;
  recipient: string;
  alertType: 'ORDER_PAID' | 'DELHIVERY_DISPATCH' | 'LOW_STOCK' | 'WAREHOUSE_RECONCILE' | 'WALLET_LOW' | 'TEST';
  status: 'SENT' | 'FAILED' | 'SKIPPED_DISCONNECTED';
  preview: string;
  errorMessage?: string;
}

export interface WhatsAppServiceStatus {
  state: WhatsAppConnectionState;
  userPhone?: string;
  userName?: string;
  qrCodeDataUrl?: string;
  pairingCode?: string;
  lastConnectedAt?: string;
  lastError?: string;
  settings: WhatsAppAlertSettings;
  stats: {
    totalSent: number;
    totalFailed: number;
    lastSentAt?: string;
  };
}
