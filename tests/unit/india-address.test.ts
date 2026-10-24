import { describe, it, expect } from 'vitest';
import {
  INDIAN_STATES,
  getGstStateCode,
  isValidIndianPin,
  isValidIndianMobile,
  formatIndianMobile,
  guessCityStateFromPin,
} from '@/lib/constants/india';

describe('Indian Geography, GST State Codes and Address Validation', () => {
  it('should contain all 28 States and 8 Union Territories with valid 2-digit GST codes', () => {
    expect(INDIAN_STATES.length).toBe(36);

    const states = INDIAN_STATES.filter((s) => s.type === 'STATE');
    const uts = INDIAN_STATES.filter((s) => s.type === 'UT');

    expect(states.length).toBe(28);
    expect(uts.length).toBe(8);

    // Check specific known state codes
    expect(getGstStateCode('Maharashtra')).toBe('27');
    expect(getGstStateCode('Karnataka')).toBe('29');
    expect(getGstStateCode('Delhi')).toBe('07');
    expect(getGstStateCode('Tamil Nadu')).toBe('33');
    expect(getGstStateCode('Gujarat')).toBe('24');
    expect(getGstStateCode('Telangana')).toBe('36');
    expect(getGstStateCode('Uttar Pradesh')).toBe('09');
    expect(getGstStateCode('West Bengal')).toBe('19');
  });

  describe('PIN Code validation (isValidIndianPin)', () => {
    it('should accept valid 6-digit Indian PIN codes', () => {
      expect(isValidIndianPin('400053')).toBe(true);
      expect(isValidIndianPin('560038')).toBe(true);
      expect(isValidIndianPin('110001')).toBe(true);
      expect(isValidIndianPin('410401')).toBe(true);
    });

    it('should reject invalid PIN codes', () => {
      expect(isValidIndianPin('012345')).toBe(false); // cannot start with 0
      expect(isValidIndianPin('40005')).toBe(false); // 5 digits
      expect(isValidIndianPin('4000531')).toBe(false); // 7 digits
      expect(isValidIndianPin('4000AA')).toBe(false); // letters
      expect(isValidIndianPin('')).toBe(false);
    });
  });

  describe('Mobile number validation & formatting', () => {
    it('should validate 10-digit Indian mobile numbers starting with 6, 7, 8, or 9', () => {
      expect(isValidIndianMobile('9820112345')).toBe(true);
      expect(isValidIndianMobile('+91 98201 12345')).toBe(true);
      expect(isValidIndianMobile('919820112345')).toBe(true);
      expect(isValidIndianMobile('7001234567')).toBe(true);
      expect(isValidIndianMobile('8123456789')).toBe(true);
      expect(isValidIndianMobile('6301234567')).toBe(true);
    });

    it('should reject invalid mobile numbers', () => {
      expect(isValidIndianMobile('5123456789')).toBe(false); // starts with 5
      expect(isValidIndianMobile('1234567890')).toBe(false); // starts with 1
      expect(isValidIndianMobile('98201')).toBe(false); // too short
      expect(isValidIndianMobile('9820112345678')).toBe(false); // too long
    });

    it('should format raw digits into clean +91 XXXXX XXXXX pattern', () => {
      expect(formatIndianMobile('9820112345')).toBe('+91 98201 12345');
      expect(formatIndianMobile('919820112345')).toBe('+91 98201 12345');
    });
  });

  describe('Smart City/State detection from PIN (guessCityStateFromPin)', () => {
    it('should auto-detect Mumbai and Maharashtra for 400xxx PINs', () => {
      const match = guessCityStateFromPin('400053');
      expect(match).not.toBeNull();
      expect(match?.city).toBe('Mumbai');
      expect(match?.state).toBe('Maharashtra');
    });

    it('should auto-detect Bengaluru and Karnataka for 560xxx PINs', () => {
      const match = guessCityStateFromPin('560038');
      expect(match).not.toBeNull();
      expect(match?.city).toBe('Bengaluru');
      expect(match?.state).toBe('Karnataka');
    });

    it('should auto-detect New Delhi and Delhi for 110xxx PINs', () => {
      const match = guessCityStateFromPin('110001');
      expect(match).not.toBeNull();
      expect(match?.city).toBe('New Delhi');
      expect(match?.state).toBe('Delhi');
    });

    it('should auto-detect Hyderabad and Telangana for 500xxx PINs', () => {
      const match = guessCityStateFromPin('500081');
      expect(match).not.toBeNull();
      expect(match?.city).toBe('Hyderabad');
      expect(match?.state).toBe('Telangana');
    });

    it('should correctly re-detect when user switches between different state PINs', () => {
      // 1. Initial Mumbai PIN
      const pin1 = guessCityStateFromPin('400053');
      expect(pin1?.city).toBe('Mumbai');
      expect(pin1?.state).toBe('Maharashtra');

      // 2. Re-entered Jaipur PIN
      const pin2 = guessCityStateFromPin('302001');
      expect(pin2?.city).toBe('Jaipur');
      expect(pin2?.state).toBe('Rajasthan');

      // 3. Re-entered Pune / Lonavala PIN
      const pin3 = guessCityStateFromPin('410401');
      expect(pin3?.city).toBe('Lonavala / Raigad');
      expect(pin3?.state).toBe('Maharashtra');

      // 4. Re-entered Lucknow PIN
      const pin4 = guessCityStateFromPin('226001');
      expect(pin4?.city).toBe('Lucknow');
      expect(pin4?.state).toBe('Uttar Pradesh');

      // 5. Re-entered Kolkata PIN
      const pin5 = guessCityStateFromPin('700001');
      expect(pin5?.city).toBe('Kolkata');
      expect(pin5?.state).toBe('West Bengal');
    });
  });

  describe('Pincode API Handler (/api/pincode/[pin])', () => {
    it('should resolve postal details via API route handler', async () => {
      const { GET } = await import('@/app/api/pincode/[pin]/route');
      const req = new Request('http://localhost:3000/api/pincode/400053');
      const res = await GET(req as any, { params: Promise.resolve({ pin: '400053' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.postalCode).toBe('400053');
      expect(data.state).toBe('Maharashtra');
    });

    it('should reject invalid PIN code formats with HTTP 400', async () => {
      const { GET } = await import('@/app/api/pincode/[pin]/route');
      const req = new Request('http://localhost:3000/api/pincode/123');
      const res = await GET(req as any, { params: Promise.resolve({ pin: '123' }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });
  });
});

