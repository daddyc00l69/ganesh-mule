import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signSessionToken, verifySignedSessionToken } from '@/lib/auth/session';

describe('Authentication & Password Security', () => {
  it('should generate secure scrypt hashes and verify correct passwords', async () => {
    const password = 'SuperSecretPassword@2026';
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^scrypt\$/);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword('IncorrectPassword', hash);
    expect(isWrong).toBe(false);
  });

  it('should sign session tokens and detect signature tampering', () => {
    const rawToken = '6c8f1349a456488d8b9e4a30a8cf92b8';
    const signed = signSessionToken(rawToken);

    // Verify valid signed token
    const extracted = verifySignedSessionToken(signed);
    expect(extracted).toBe(rawToken);

    // Tampered token must be rejected
    const tampered = signed.slice(0, -3) + 'abc';
    const invalidExtracted = verifySignedSessionToken(tampered);
    expect(invalidExtracted).toBeNull();
  });
});
