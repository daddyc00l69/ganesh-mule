import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hashes a plaintext password using crypto.scrypt with a random 16-byte salt.
 * Output format: `scrypt$salt$hash`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against an existing scrypt hash using timing-safe comparison.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }

    const salt = parts[1];
    const originalHash = Buffer.from(parts[2], 'hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

    if (originalHash.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(originalHash, derivedKey);
  } catch {
    return false;
  }
}
