export type WhatsAppConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'SCAN_QR_CODE'
  | 'CONNECTED';

export interface WhatsAppStaffGroup {
  jid: string; // e.g. "120363294827104829@g.us"
  name: string; // e.g. "Ganesh Mule Staff & Operations"
  participantsCount?: number;
}

export interface WhatsAppAlertSettings {
  enabled: boolean;
  adminPhoneNumbers: string[]; // Individual staff WhatsApp numbers e.g. ["919876543210"]
  staffGroups?: WhatsAppStaffGroup[]; // WhatsApp Groups for team operations e.g. [{ jid: "120363...@g.us", name: "Operations Group" }]
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
  recipient: string; // Phone or "[Group] Group Name"
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
  availableGroups?: WhatsAppStaffGroup[]; // Dynamically discovered groups from WhatsApp
  settings: WhatsAppAlertSettings;
  stats: {
    totalSent: number;
    totalFailed: number;
    lastSentAt?: string;
  };
}
