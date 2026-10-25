import { randomBytes } from 'crypto';
import { hashPassword, verifyPassword } from './password';
import { generateToken, setSessionCookie, SESSION_MAX_AGE } from './session';
import { sendEmail, AUTH_EMAIL_FROM } from '@/lib/email/resend';
import {
  getAdminSetupOtpEmailHtml,
  getManagerInvitationEmailHtml,
  getManagerJoinOtpEmailHtml,
} from '@/lib/email/templates';
import { STORE_URL } from '@/lib/constants/brand';
import { SafeUser } from '@/types';
import fs from 'fs';
import path from 'path';

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export interface ManagerInvite {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  permissions: string[];
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  invitedAt: string;
  expiresAt: string;
}

export interface StoredManager {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  permissions: string[];
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StaffStoreState {
  admin: AdminAccount | null;
  managers: StoredManager[];
  invites: ManagerInvite[];
  sessions: Map<string, { user: SafeUser; expiresAt: number }>;
  otps: Map<string, { otp: string; expiresAt: number; data?: any }>;
}

const globalStaff = globalThis as unknown as {
  __STAFF_STORE__?: StaffStoreState;
};

// Persisted disk file fallback
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'staff-registry.json');

function loadPersistedState(): { admin: AdminAccount | null; managers: StoredManager[]; invites: ManagerInvite[] } {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        admin: parsed.admin || null,
        managers: Array.isArray(parsed.managers) ? parsed.managers : [],
        invites: Array.isArray(parsed.invites) ? parsed.invites : [],
      };
    }
  } catch {}
  return { admin: null, managers: [], invites: [] };
}

function persistState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      admin: globalStaff.__STAFF_STORE__?.admin || null,
      managers: globalStaff.__STAFF_STORE__?.managers || [],
      invites: globalStaff.__STAFF_STORE__?.invites || [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
}

if (!globalStaff.__STAFF_STORE__) {
  const persisted = loadPersistedState();
  globalStaff.__STAFF_STORE__ = {
    admin: persisted.admin,
    managers: persisted.managers,
    invites: persisted.invites,
    sessions: new Map(),
    otps: new Map(),
  };
}

const store = globalStaff.__STAFF_STORE__!;

// =========================================================================
// 1. ADMIN SETUP (/config)
// =========================================================================

export function getAdminConfigStatus(): { configured: boolean; adminEmail?: string; adminName?: string } {
  if (store.admin && store.admin.isActive) {
    return {
      configured: true,
      adminEmail: store.admin.email,
      adminName: store.admin.name,
    };
  }
  return { configured: false };
}

export async function sendAdminSetupOtp(params: {
  name: string;
  email: string;
  phone: string;
  password?: string;
}): Promise<{ success: boolean; message: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim();

  if (store.admin && store.admin.isActive) {
    throw new Error('System already has an active Administrator configured.');
  }

  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  let passwordHash = '';
  if (params.password) {
    passwordHash = await hashPassword(params.password);
  } else {
    passwordHash = await hashPassword('Admin@123456');
  }

  store.otps.set(`admin_setup_${cleanEmail}`, {
    otp,
    expiresAt,
    data: {
      name: cleanName,
      email: cleanEmail,
      phone: params.phone.trim(),
      passwordHash,
    },
  });

  const html = getAdminSetupOtpEmailHtml({
    name: cleanName,
    email: cleanEmail,
    otp,
    expiresMinutes: 10,
    appUrl: STORE_URL,
  });

  await sendEmail({
    to: cleanEmail,
    from: AUTH_EMAIL_FROM,
    subject: `[Action Required] Admin Setup Passcode: ${otp} - Ganesh Mule Pure Honey`,
    html,
  });

  return { success: true, message: `6-digit security code dispatched to ${cleanEmail}` };
}

export async function verifyAdminSetupOtp(params: {
  email: string;
  otp: string;
}): Promise<{ success: boolean; user: SafeUser; token: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const key = `admin_setup_${cleanEmail}`;
  const entry = store.otps.get(key);

  if (!entry) {
    throw new Error('Verification request not found. Please request a new code.');
  }

  if (Date.now() > entry.expiresAt) {
    store.otps.delete(key);
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (entry.otp !== params.otp.trim()) {
    throw new Error('Invalid verification passcode. Please check your email.');
  }

  // Create Root Admin Account
  const adminData = entry.data;
  const adminAccount: AdminAccount = {
    id: `usr-admin-${Date.now()}`,
    name: adminData.name,
    email: adminData.email,
    phone: adminData.phone,
    passwordHash: adminData.passwordHash,
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  store.admin = adminAccount;
  store.otps.delete(key);
  persistState();

  const safeUser: SafeUser = {
    id: adminAccount.id,
    name: adminAccount.name,
    email: adminAccount.email,
    role: 'ADMIN',
    isActive: true,
    createdAt: adminAccount.createdAt,
    permissions: [],
  };

  const token = generateToken();
  store.sessions.set(token, {
    user: safeUser,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  });

  await setSessionCookie(token);

  return { success: true, user: safeUser, token };
}

// =========================================================================
// 2. MANAGER INVITATIONS & MULTI-MANAGER ONBOARDING
// =========================================================================

export function getAllManagers(): StoredManager[] {
  return store.managers;
}

export function getAllInvites(): ManagerInvite[] {
  return store.invites;
}

export async function createManagerInvite(params: {
  name: string;
  email: string;
  phone?: string;
  department: string;
  permissions: string[];
}): Promise<{ invite: ManagerInvite; inviteUrl: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim();

  // Check if manager is already active with this email
  const existingManager = store.managers.find((m) => m.email.toLowerCase() === cleanEmail && m.isActive);
  if (existingManager) {
    throw new Error(`A manager account already exists for ${cleanEmail}.`);
  }

  // Revoke any previous pending invite for this email
  store.invites = store.invites.filter((inv) => inv.email.toLowerCase() !== cleanEmail);

  const token = randomBytes(24).toString('hex');
  const invite: ManagerInvite = {
    id: `inv-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    phone: params.phone?.trim(),
    department: params.department || 'Operations',
    permissions: params.permissions || ['orders.read', 'orders.update'],
    token,
    status: 'PENDING',
    invitedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days
  };

  store.invites.unshift(invite);
  persistState();

  const inviteUrl = `${STORE_URL}/portal/join?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

  // Dispatch Invitation Email
  const html = getManagerInvitationEmailHtml({
    name: cleanName,
    email: cleanEmail,
    department: invite.department,
    joinUrl: inviteUrl,
    expiresDays: 7,
    appUrl: STORE_URL,
  });

  await sendEmail({
    to: cleanEmail,
    from: AUTH_EMAIL_FROM,
    subject: `Invitation to Join as Manager (${invite.department}) - Ganesh Mule Pure Honey`,
    html,
  });

  return { invite, inviteUrl };
}

export function revokeManagerInvite(inviteId: string) {
  const inv = store.invites.find((i) => i.id === inviteId);
  if (inv) {
    inv.status = 'REVOKED';
    persistState();
  }
}

export function getManagerInvite(token?: string, email?: string): ManagerInvite | null {
  if (!token && !email) return null;

  return (
    store.invites.find((i) => {
      const matchToken = token ? i.token === token : true;
      const matchEmail = email ? i.email.toLowerCase() === email.trim().toLowerCase() : true;
      return matchToken && matchEmail && i.status === 'PENDING';
    }) || null
  );
}

export async function sendManagerJoinOtp(params: {
  token: string;
  email: string;
}): Promise<{ success: boolean; message: string; invite: ManagerInvite }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const invite = getManagerInvite(params.token, cleanEmail);

  if (!invite) {
    throw new Error(
      'Access Denied: This email address has not been invited by an Administrator, or the invitation has expired.'
    );
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  store.otps.set(`manager_join_${cleanEmail}`, {
    otp,
    expiresAt,
    data: { inviteId: invite.id, token: params.token },
  });

  const html = getManagerJoinOtpEmailHtml({
    name: invite.name,
    email: cleanEmail,
    otp,
    expiresMinutes: 10,
    appUrl: STORE_URL,
  });

  await sendEmail({
    to: cleanEmail,
    from: AUTH_EMAIL_FROM,
    subject: `Manager Activation Passcode: ${otp} - Ganesh Mule Pure Honey`,
    html,
  });

  return { success: true, message: `6-digit activation code sent to ${cleanEmail}`, invite };
}

export async function verifyManagerJoinOtp(params: {
  token: string;
  email: string;
  otp: string;
  password?: string;
}): Promise<{ success: boolean; user: SafeUser; token: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const invite = getManagerInvite(params.token, cleanEmail);

  if (!invite) {
    throw new Error('Access Denied: Valid manager invitation not found.');
  }

  const key = `manager_join_${cleanEmail}`;
  const entry = store.otps.get(key);

  if (!entry) {
    throw new Error('Verification session not found. Please click "Send Verification Code" first.');
  }

  if (Date.now() > entry.expiresAt) {
    store.otps.delete(key);
    throw new Error('Verification code expired. Please request a new code.');
  }

  if (entry.otp !== params.otp.trim()) {
    throw new Error('Invalid verification passcode. Please check the code sent to your email.');
  }

  let passwordHash = '';
  if (params.password && params.password.length >= 6) {
    passwordHash = await hashPassword(params.password);
  } else {
    passwordHash = await hashPassword('Manager@123456');
  }

  // Create Manager Account
  const newManager: StoredManager = {
    id: `mgr-${Date.now()}`,
    userId: `usr-mgr-${Date.now()}`,
    name: invite.name,
    email: invite.email,
    phone: invite.phone,
    department: invite.department,
    permissions: invite.permissions,
    passwordHash,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.managers.push(newManager);
  invite.status = 'ACCEPTED';
  store.otps.delete(key);
  persistState();

  const safeUser: SafeUser = {
    id: newManager.userId,
    name: newManager.name,
    email: newManager.email,
    role: 'MANAGER',
    isActive: true,
    createdAt: newManager.createdAt,
    permissions: newManager.permissions,
    department: newManager.department,
  };

  const sessionToken = generateToken();
  store.sessions.set(sessionToken, {
    user: safeUser,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  });

  await setSessionCookie(sessionToken);

  return { success: true, user: safeUser, token: sessionToken };
}

// =========================================================================
// 3. STAFF AUTHENTICATION & LOGIN
// =========================================================================

export async function authenticateStaffLogin(params: {
  email: string;
  password?: string;
  expectedRole: 'ADMIN' | 'MANAGER';
}): Promise<{ success: boolean; user: SafeUser; token: string }> {
  const cleanEmail = params.email.trim().toLowerCase();

  // 1. Check Admin
  if (params.expectedRole === 'ADMIN' || !params.expectedRole) {
    if (store.admin && store.admin.email.toLowerCase() === cleanEmail && store.admin.isActive) {
      if (params.password) {
        const matches = await verifyPassword(params.password, store.admin.passwordHash);
        if (!matches) throw new Error('Invalid administrator password.');
      }

      const safeUser: SafeUser = {
        id: store.admin.id,
        name: store.admin.name,
        email: store.admin.email,
        role: 'ADMIN',
        isActive: true,
        createdAt: store.admin.createdAt,
        permissions: [],
      };

      const token = generateToken();
      store.sessions.set(token, {
        user: safeUser,
        expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
      });

      await setSessionCookie(token);
      return { success: true, user: safeUser, token };
    }
  }

  // 2. Check Managers
  if (params.expectedRole === 'MANAGER' || !params.expectedRole) {
    const manager = store.managers.find((m) => m.email.toLowerCase() === cleanEmail && m.isActive);
    if (manager) {
      if (params.password) {
        const matches = await verifyPassword(params.password, manager.passwordHash);
        if (!matches) throw new Error('Invalid manager password.');
      }

      const safeUser: SafeUser = {
        id: manager.userId,
        name: manager.name,
        email: manager.email,
        role: 'MANAGER',
        isActive: true,
        createdAt: manager.createdAt,
        permissions: manager.permissions,
        department: manager.department,
      };

      const token = generateToken();
      store.sessions.set(token, {
        user: safeUser,
        expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
      });

      await setSessionCookie(token);
      return { success: true, user: safeUser, token };
    }
  }

  throw new Error(`No active ${params.expectedRole.toLowerCase()} account found for ${cleanEmail}.`);
}

export function findStaffBySessionToken(token: string): SafeUser | null {
  const session = store.sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    store.sessions.delete(token);
    return null;
  }
  return session.user;
}
