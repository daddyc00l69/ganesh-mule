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

  // Maharashtra & Goa
  if (prefix === '400') return { city: 'Mumbai', state: 'Maharashtra' };
  if (prefix === '401') return { city: 'Thane', state: 'Maharashtra' };
  if (prefix === '402') return { city: 'Raigad', state: 'Maharashtra' };
  if (prefix === '403') return { city: 'Goa', state: 'Goa' };
  if (prefix === '410') return { city: 'Lonavala', state: 'Maharashtra' };
  if (prefix === '411') return { city: 'Pune', state: 'Maharashtra' };
  if (prefix === '412') return { city: 'Pune', state: 'Maharashtra' };
  if (prefix === '413') return { city: 'Solapur', state: 'Maharashtra' };
  if (prefix === '414') return { city: 'Ahmednagar', state: 'Maharashtra' };
  if (prefix === '415') return { city: 'Satara', state: 'Maharashtra' };
  if (prefix === '416') return { city: 'Kolhapur', state: 'Maharashtra' };
  if (prefix === '421') return { city: 'Kalyan', state: 'Maharashtra' };
  if (prefix === '422') return { city: 'Nashik', state: 'Maharashtra' };
  if (prefix === '423') return { city: 'Malegaon', state: 'Maharashtra' };
  if (prefix === '424') return { city: 'Dhule', state: 'Maharashtra' };
  if (prefix === '425') return { city: 'Jalgaon', state: 'Maharashtra' };
  if (prefix === '431') return { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' };
  if (prefix === '440') return { city: 'Nagpur', state: 'Maharashtra' };
  if (prefix === '441') return { city: 'Wardha', state: 'Maharashtra' };
  if (prefix === '442') return { city: 'Chandrapur', state: 'Maharashtra' };
  if (prefix === '443') return { city: 'Buldhana', state: 'Maharashtra' };
  if (prefix === '444') return { city: 'Akola', state: 'Maharashtra' };
  if (prefix === '445') return { city: 'Yavatmal', state: 'Maharashtra' };

  // Delhi NCR
  if (prefix === '110') return { city: 'New Delhi', state: 'Delhi' };

  // Karnataka
  if (prefix === '560') return { city: 'Bengaluru', state: 'Karnataka' };
  if (prefix === '562') return { city: 'Bengaluru Rural', state: 'Karnataka' };
  if (prefix === '570') return { city: 'Mysuru', state: 'Karnataka' };
  if (prefix === '575') return { city: 'Mangaluru', state: 'Karnataka' };
  if (prefix === '580') return { city: 'Hubballi-Dharwad', state: 'Karnataka' };
  if (prefix === '590') return { city: 'Belagavi', state: 'Karnataka' };
  if (prefix === '585') return { city: 'Kalaburagi', state: 'Karnataka' };

  // Telangana & Andhra Pradesh
  if (prefix === '500') return { city: 'Hyderabad', state: 'Telangana' };
  if (prefix === '506') return { city: 'Warangal', state: 'Telangana' };
  if (prefix === '505') return { city: 'Karimnagar', state: 'Telangana' };
  if (prefix === '530') return { city: 'Visakhapatnam', state: 'Andhra Pradesh' };
  if (prefix === '520') return { city: 'Vijayawada', state: 'Andhra Pradesh' };
  if (prefix === '522') return { city: 'Guntur', state: 'Andhra Pradesh' };
  if (prefix === '517') return { city: 'Tirupati', state: 'Andhra Pradesh' };

  // Tamil Nadu
  if (prefix === '600') return { city: 'Chennai', state: 'Tamil Nadu' };
  if (prefix === '641') return { city: 'Coimbatore', state: 'Tamil Nadu' };
  if (prefix === '625') return { city: 'Madurai', state: 'Tamil Nadu' };
  if (prefix === '620') return { city: 'Tiruchirappalli', state: 'Tamil Nadu' };
  if (prefix === '636') return { city: 'Salem', state: 'Tamil Nadu' };

  // Kerala
  if (prefix === '682') return { city: 'Kochi / Ernakulam', state: 'Kerala' };
  if (prefix === '695') return { city: 'Thiruvananthapuram', state: 'Kerala' };
  if (prefix === '673') return { city: 'Kozhikode', state: 'Kerala' };
  if (prefix === '680') return { city: 'Thrissur', state: 'Kerala' };

  // West Bengal
  if (prefix === '700') return { city: 'Kolkata', state: 'West Bengal' };
  if (prefix === '711') return { city: 'Howrah', state: 'West Bengal' };
  if (prefix === '734') return { city: 'Siliguri', state: 'West Bengal' };
  if (prefix === '713') return { city: 'Durgapur / Asansol', state: 'West Bengal' };

  // Gujarat
  if (prefix === '380') return { city: 'Ahmedabad', state: 'Gujarat' };
  if (prefix === '395') return { city: 'Surat', state: 'Gujarat' };
  if (prefix === '390') return { city: 'Vadodara', state: 'Gujarat' };
  if (prefix === '360') return { city: 'Rajkot', state: 'Gujarat' };

  // Rajasthan
  if (prefix === '302') return { city: 'Jaipur', state: 'Rajasthan' };
  if (prefix === '342') return { city: 'Jodhpur', state: 'Rajasthan' };
  if (prefix === '313') return { city: 'Udaipur', state: 'Rajasthan' };
  if (prefix === '324') return { city: 'Kota', state: 'Rajasthan' };
  if (prefix === '305') return { city: 'Ajmer', state: 'Rajasthan' };

  // Uttar Pradesh & Haryana
  if (prefix === '121') return { city: 'Faridabad', state: 'Haryana' };
  if (prefix === '122') return { city: 'Gurugram', state: 'Haryana' };
  if (prefix === '201') return { city: 'Noida / Ghaziabad', state: 'Uttar Pradesh' };
  if (prefix === '208') return { city: 'Kanpur', state: 'Uttar Pradesh' };
  if (prefix === '226') return { city: 'Lucknow', state: 'Uttar Pradesh' };
  if (prefix === '221') return { city: 'Varanasi', state: 'Uttar Pradesh' };
  if (prefix === '282') return { city: 'Agra', state: 'Uttar Pradesh' };
  if (prefix === '211') return { city: 'Prayagraj', state: 'Uttar Pradesh' };
  if (prefix === '250') return { city: 'Meerut', state: 'Uttar Pradesh' };

  // Madhya Pradesh & Chhattisgarh
  if (prefix === '452') return { city: 'Indore', state: 'Madhya Pradesh' };
  if (prefix === '462') return { city: 'Bhopal', state: 'Madhya Pradesh' };
  if (prefix === '474') return { city: 'Gwalior', state: 'Madhya Pradesh' };
  if (prefix === '482') return { city: 'Jabalpur', state: 'Madhya Pradesh' };
  if (prefix === '492') return { city: 'Raipur', state: 'Chhattisgarh' };

  // Punjab, Chandigarh, Bihar, Odisha
  if (prefix === '160') return { city: 'Chandigarh', state: 'Chandigarh' };
  if (prefix === '141') return { city: 'Ludhiana', state: 'Punjab' };
  if (prefix === '143') return { city: 'Amritsar', state: 'Punjab' };
  if (prefix === '800') return { city: 'Patna', state: 'Bihar' };
  if (prefix === '834') return { city: 'Ranchi', state: 'Jharkhand' };
  if (prefix === '751') return { city: 'Bhubaneswar', state: 'Odisha' };
  if (prefix === '248') return { city: 'Dehradun', state: 'Uttarakhand' };
  if (prefix === '171') return { city: 'Shimla', state: 'Himachal Pradesh' };
  if (prefix === '190') return { city: 'Srinagar', state: 'Jammu and Kashmir' };
  if (prefix === '180') return { city: 'Jammu', state: 'Jammu and Kashmir' };
  if (prefix === '781') return { city: 'Guwahati', state: 'Assam' };

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
  if (p2 === '49') return { state: 'Chhattisgarh' };
  if (p2 === '14' || p2 === '15' || p2 === '16') return { state: 'Punjab' };
  if (p2 === '80' || p2 === '81' || p2 === '82' || p2 === '84' || p2 === '85') return { state: 'Bihar' };
  if (p2 === '83') return { state: 'Jharkhand' };
  if (p2 === '75' || p2 === '76' || p2 === '77') return { state: 'Odisha' };
  if (p2 === '24') return { state: 'Uttarakhand' };
  if (p2 === '17') return { state: 'Himachal Pradesh' };
  if (p2 === '18' || p2 === '19') return { state: 'Jammu and Kashmir' };
  if (p2 === '78') return { state: 'Assam' };
  if (p2 === '79') return { state: 'Tripura' };

  return null;
}
