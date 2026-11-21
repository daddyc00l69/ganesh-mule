import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signOAuthState,
  verifyOAuthState,
  sanitizeRedirectPath,
  authenticateGoogleUser,
  GoogleOAuthState,
  GoogleUserInfo,
} from '@/lib/auth/google';
import { decodeUserSessionFromToken } from '@/lib/auth/session';

describe('Google OAuth 2.0 Security & Role Authorization Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cryptographic State & Nonce CSRF Protection', () => {
    it('should generate a valid HMAC-signed OAuth state and verify successfully', () => {
      const statePayload: GoogleOAuthState = {
        csrf: 'csrf-token-12345',
        nonce: 'nonce-token-67890',
        redirect: '/account',
        expectedRole: 'CUSTOMER',
        exp: Date.now() + 600000,
      };

      const signed = signOAuthState(statePayload);
      expect(signed).toContain('.');

      const verified = verifyOAuthState(signed);
      expect(verified).not.toBeNull();
      expect(verified?.csrf).toBe('csrf-token-12345');
      expect(verified?.nonce).toBe('nonce-token-67890');
      expect(verified?.redirect).toBe('/account');
      expect(verified?.expectedRole).toBe('CUSTOMER');
    });

    it('should reject tampered OAuth state signatures (CSRF attack prevention)', () => {
      const statePayload: GoogleOAuthState = {
        csrf: 'csrf-token-real',
        nonce: 'nonce-token-real',
        redirect: '/admin',
        expectedRole: 'ADMIN',
        exp: Date.now() + 600000,
      };

      const signed = signOAuthState(statePayload);
      const [payloadB64] = signed.split('.');

      // Altered signature
      const tampered = `${payloadB64}.forged_signature_hex`;
      const result = verifyOAuthState(tampered);
      expect(result).toBeNull();
    });

    it('should reject expired OAuth states', () => {
      const expiredPayload: GoogleOAuthState = {
        csrf: 'csrf-expired',
        nonce: 'nonce-expired',
        redirect: '/account',
        exp: Date.now() - 1000, // Expired 1 second ago
      };

      const signed = signOAuthState(expiredPayload);
      const result = verifyOAuthState(signed);
      expect(result).toBeNull();
    });
  });

  describe('Open Redirect Vulnerability Prevention', () => {
    it('should allow legitimate relative application paths', () => {
      expect(sanitizeRedirectPath('/admin')).toBe('/admin');
      expect(sanitizeRedirectPath('/account')).toBe('/account');
      expect(sanitizeRedirectPath('/checkout?step=payment')).toBe('/checkout?step=payment');
      expect(sanitizeRedirectPath('/manager/orders')).toBe('/manager/orders');
    });

    it('should block external protocol schemes, protocol-relative, and double slashes', () => {
      expect(sanitizeRedirectPath('https://evil-phishing-site.com')).toBe('/account');
      expect(sanitizeRedirectPath('http://malicious.com')).toBe('/account');
      expect(sanitizeRedirectPath('//attacker.com/steal-session')).toBe('/account');
      expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/account');
      expect(sanitizeRedirectPath(null)).toBe('/account');
      expect(sanitizeRedirectPath('')).toBe('/account');
    });
  });

  describe('Server-Side Role Resolution & Privilege Escalation Protection', () => {
    it('should authenticate designated Super Administrator and grant ADMIN role', async () => {
      const adminGoogleProfile: GoogleUserInfo = {
        sub: 'google-sub-admin-123',
        email: 'tushar0p.test@gmail.com',
        email_verified: true,
        name: 'Tushar (Super Administrator)',
        picture: 'https://lh3.googleusercontent.com/admin-pic.jpg',
      };

      const state: GoogleOAuthState = {
        csrf: 'csrf-admin',
        nonce: 'nonce-admin',
        redirect: '/admin',
        expectedRole: 'ADMIN',
        exp: Date.now() + 600000,
      };

      const result = await authenticateGoogleUser(adminGoogleProfile, state);
      expect(['ADMIN', 'DEVELOPER']).toContain(result.user.role);
      expect(result.redirectUrl).toBe('/admin');
      expect(result.token).toBeDefined();

      const decoded = decodeUserSessionFromToken(result.token);
      expect(['ADMIN', 'DEVELOPER']).toContain(decoded?.role);
      expect(decoded?.email).toBe('tushar0p.test@gmail.com');
    });

    it('should authenticate customer, assign CUSTOMER role by default, and redirect safely', async () => {
      const customerGoogleProfile: GoogleUserInfo = {
        sub: 'google-sub-customer-456',
        email: 'priya.sharma@example.com',
        email_verified: true,
        name: 'Priya Sharma',
        picture: 'https://lh3.googleusercontent.com/priya.jpg',
      };

      const state: GoogleOAuthState = {
        csrf: 'csrf-cust',
        nonce: 'nonce-cust',
        redirect: '/account',
        expectedRole: 'CUSTOMER',
        exp: Date.now() + 600000,
      };

      const result = await authenticateGoogleUser(customerGoogleProfile, state);
      expect(result.user.role).toBe('CUSTOMER');
      expect(result.redirectUrl).toBe('/account');

      const decoded = decodeUserSessionFromToken(result.token);
      expect(decoded?.role).toBe('CUSTOMER');
      expect(decoded?.email).toBe('priya.sharma@example.com');
    });

    it('should NEVER allow an unauthorized customer to escalate to ADMIN via staff portal', async () => {
      const unauthorizedCustomerProfile: GoogleUserInfo = {
        sub: 'google-sub-intruder-789',
        email: 'random.customer@gmail.com',
        email_verified: true,
        name: 'Curious Customer',
      };

      // Attacker tries to initiate login targeting ADMIN role
      const staffPortalState: GoogleOAuthState = {
        csrf: 'csrf-intruder',
        nonce: 'nonce-intruder',
        redirect: '/admin',
        expectedRole: 'ADMIN',
        exp: Date.now() + 600000,
      };

      await expect(
        authenticateGoogleUser(unauthorizedCustomerProfile, staffPortalState)
      ).rejects.toThrow(/Access denied/i);
    });

    it('should NEVER allow a customer to access /manager/orders via expectedRole guard', async () => {
      const unauthorizedCustomerProfile: GoogleUserInfo = {
        sub: 'google-sub-cust-999',
        email: 'regular.shopper@gmail.com',
        email_verified: true,
        name: 'Shopper',
      };

      const managerPortalState: GoogleOAuthState = {
        csrf: 'csrf-mgr',
        nonce: 'nonce-mgr',
        redirect: '/manager/orders',
        expectedRole: 'MANAGER',
        exp: Date.now() + 600000,
      };

      await expect(
        authenticateGoogleUser(unauthorizedCustomerProfile, managerPortalState)
      ).rejects.toThrow(/Access denied/i);
    });

    it('should redirect customers away from staff paths even if requested in redirect parameter', async () => {
      const customerGoogleProfile: GoogleUserInfo = {
        sub: 'google-sub-cust-safe-redirect',
        email: 'ananya.kulkarni@gmail.com',
        email_verified: true,
        name: 'Ananya Kulkarni',
      };

      const sneakyRedirectState: GoogleOAuthState = {
        csrf: 'csrf-sneaky',
        nonce: 'nonce-sneaky',
        redirect: '/admin/settings', // Customer trying to specify admin target
        expectedRole: 'CUSTOMER',
        exp: Date.now() + 600000,
      };

      const result = await authenticateGoogleUser(customerGoogleProfile, sneakyRedirectState);
      expect(result.user.role).toBe('CUSTOMER');
      // Customer must be sanitized away from /admin/settings to /account
      expect(result.redirectUrl).toBe('/account');
    });
  });
});
