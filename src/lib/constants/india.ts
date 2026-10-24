/**
 * Official Indian States & Union Territories with statutory 2-digit GST State Codes
 */

export interface IndianState {
  name: string;
  code: string; // 2-digit GST State Code (01 to 38)
  type: 'STATE' | 'UT';
}

export const INDIAN_STATES: IndianState[] = [
  // 28 States
  { name: 'Andhra Pradesh', code: '37', type: 'STATE' },
  { name: 'Arunachal Pradesh', code: '12', type: 'STATE' },
  { name: 'Assam', code: '18', type: 'STATE' },
  { name: 'Bihar', code: '10', type: 'STATE' },
  { name: 'Chhattisgarh', code: '22', type: 'STATE' },
  { name: 'Goa', code: '30', type: 'STATE' },
  { name: 'Gujarat', code: '24', type: 'STATE' },
  { name: 'Haryana', code: '06', type: 'STATE' },
  { name: 'Himachal Pradesh', code: '02', type: 'STATE' },
  { name: 'Jharkhand', code: '20', type: 'STATE' },
  { name: 'Karnataka', code: '29', type: 'STATE' },
  { name: 'Kerala', code: '32', type: 'STATE' },
  { name: 'Madhya Pradesh', code: '23', type: 'STATE' },
  { name: 'Maharashtra', code: '27', type: 'STATE' },
  { name: 'Manipur', code: '14', type: 'STATE' },
  { name: 'Meghalaya', code: '17', type: 'STATE' },
  { name: 'Mizoram', code: '15', type: 'STATE' },
  { name: 'Nagaland', code: '13', type: 'STATE' },
  { name: 'Odisha', code: '21', type: 'STATE' },
  { name: 'Punjab', code: '03', type: 'STATE' },
  { name: 'Rajasthan', code: '08', type: 'STATE' },
  { name: 'Sikkim', code: '11', type: 'STATE' },
  { name: 'Tamil Nadu', code: '33', type: 'STATE' },
  { name: 'Telangana', code: '36', type: 'STATE' },
  { name: 'Tripura', code: '16', type: 'STATE' },
  { name: 'Uttar Pradesh', code: '09', type: 'STATE' },
  { name: 'Uttarakhand', code: '05', type: 'STATE' },
  { name: 'West Bengal', code: '19', type: 'STATE' },

  // 8 Union Territories
  { name: 'Andaman and Nicobar Islands', code: '35', type: 'UT' },
  { name: 'Chandigarh', code: '04', type: 'UT' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26', type: 'UT' },
  { name: 'Delhi', code: '07', type: 'UT' },
  { name: 'Jammu and Kashmir', code: '01', type: 'UT' },
  { name: 'Ladakh', code: '38', type: 'UT' },
  { name: 'Lakshadweep', code: '31', type: 'UT' },
  { name: 'Puducherry', code: '34', type: 'UT' },
];

/**
 * Returns GST State Code for a given state name
 */
export function getGstStateCode(stateName: string): string {
  if (!stateName) return '27';
  const clean = stateName.trim().toLowerCase();
  if (clean === 'mh' || clean.includes('maharashtra')) return '27';
  if (clean === 'dl' || clean.includes('delhi')) return '07';
  if (clean === 'ka' || clean.includes('karnataka')) return '29';
  if (clean === 'tn' || clean.includes('tamil')) return '33';
  if (clean === 'ts' || clean.includes('telangana')) return '36';
  if (clean === 'gj' || clean.includes('gujarat')) return '24';
  if (clean === 'up' || clean.includes('uttar pradesh')) return '09';
  if (clean === 'wb' || clean.includes('west bengal')) return '19';
  if (clean === 'hr' || clean.includes('haryana')) return '06';
  if (clean === 'rj' || clean.includes('rajasthan')) return '08';
  if (clean === 'kl' || clean.includes('kerala')) return '32';
  if (clean === 'mp' || clean.includes('madhya')) return '23';

  const match = INDIAN_STATES.find(
    (s) => s.name.toLowerCase() === clean || clean.includes(s.name.toLowerCase())
  );
  return match ? match.code : '99';
}

/**
 * Validates 6-digit Indian PIN Code format
 */
export function isValidIndianPin(pin: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pin.trim());
}

/**
 * Validates 10-digit Indian Mobile Number
 */
export function isValidIndianMobile(mobile: string): boolean {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) {
    return /^[6-9][0-9]{9}$/.test(digits);
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return /^[6-9][0-9]{9}$/.test(digits.slice(2));
  }
  return false;
}

/**
 * Cleans and standardizes Indian mobile to +91 XXXXX XXXXX format
 */
export function formatIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const tenDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
  if (tenDigits.length === 10) {
    return `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`;
  }
  return raw;
}

/**
 * PIN code prefix hints for instant city/state auto-fill
 */
export function guessCityStateFromPin(pin: string): { city?: string; state?: string } | null {
  const clean = pin.trim();
  if (clean.length < 3) return null;

  const prefix = clean.substring(0, 3);
  const p2 = clean.substring(0, 2);

  // Mumbai (400)
  if (prefix === '400') return { city: 'Mumbai', state: 'Maharashtra' };
  if (prefix === '401') return { city: 'Thane / Palghar', state: 'Maharashtra' };
  if (prefix === '410') return { city: 'Lonavala / Raigad', state: 'Maharashtra' };
  if (prefix === '411') return { city: 'Pune', state: 'Maharashtra' };
  if (prefix === '412') return { city: 'Pune Rural', state: 'Maharashtra' };
  if (prefix === '413') return { city: 'Solapur', state: 'Maharashtra' };
  if (prefix === '414') return { city: 'Ahmednagar', state: 'Maharashtra' };
  if (prefix === '415') return { city: 'Satara / Ratnagiri', state: 'Maharashtra' };
  if (prefix === '416') return { city: 'Kolhapur / Sangli', state: 'Maharashtra' };
  if (prefix === '421') return { city: 'Kalyan / Dombivli', state: 'Maharashtra' };
  if (prefix === '422') return { city: 'Nashik', state: 'Maharashtra' };
  if (prefix === '440') return { city: 'Nagpur', state: 'Maharashtra' };
  if (prefix === '444') return { city: 'Akola / Amravati', state: 'Maharashtra' };
  if (prefix === '431') return { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' };

  // Delhi (110)
  if (prefix === '110') return { city: 'New Delhi', state: 'Delhi' };

  // Bengaluru (560, 562)
  if (prefix === '560' || prefix === '562') return { city: 'Bengaluru', state: 'Karnataka' };

  // Hyderabad (500)
  if (prefix === '500') return { city: 'Hyderabad', state: 'Telangana' };

  // Chennai (600)
  if (prefix === '600') return { city: 'Chennai', state: 'Tamil Nadu' };

  // Kolkata (700)
  if (prefix === '700') return { city: 'Kolkata', state: 'West Bengal' };

  // Ahmedabad (380)
  if (prefix === '380') return { city: 'Ahmedabad', state: 'Gujarat' };

  // Gurugram (122)
  if (prefix === '122') return { city: 'Gurugram', state: 'Haryana' };

  // Noida (201)
  if (prefix === '201') return { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh' };

  // Broad state zones by first 2 digits
  if (p2 === '40' || p2 === '41' || p2 === '42' || p2 === '43' || p2 === '44') return { state: 'Maharashtra' };
  if (p2 === '11') return { state: 'Delhi' };
  if (p2 === '56' || p2 === '57' || p2 === '58' || p2 === '59') return { state: 'Karnataka' };
  if (p2 === '50' || p2 === '51' || p2 === '52' || p2 === '53') return { state: 'Telangana' };
  if (p2 === '60' || p2 === '61' || p2 === '62' || p2 === '63' || p2 === '64') return { state: 'Tamil Nadu' };
  if (p2 === '38' || p2 === '39') return { state: 'Gujarat' };
  if (p2 === '12' || p2 === '13') return { state: 'Haryana' };
  if (p2 === '20' || p2 === '21' || p2 === '22' || p2 === '24' || p2 === '26' || p2 === '27' || p2 === '28')
    return { state: 'Uttar Pradesh' };
  if (p2 === '70' || p2 === '71' || p2 === '72' || p2 === '73' || p2 === '74') return { state: 'West Bengal' };
  if (p2 === '30' || p2 === '31' || p2 === '32' || p2 === '33' || p2 === '34') return { state: 'Rajasthan' };
  if (p2 === '67' || p2 === '68' || p2 === '69') return { state: 'Kerala' };
  if (p2 === '45' || p2 === '46' || p2 === '47' || p2 === '48') return { state: 'Madhya Pradesh' };
  if (p2 === '14' || p2 === '15' || p2 === '16') return { state: 'Punjab' };
  if (p2 === '80' || p2 === '81' || p2 === '82' || p2 === '84' || p2 === '85') return { state: 'Bihar' };

  return null;
}
