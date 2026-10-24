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
  });
});
