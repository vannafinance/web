const VALID_ACCESS_CODE = "2861";
const ENCRYPTION_KEY = "your-encryption-key";

export function encryptAccessCode(code: string): string {
  return btoa(code + ENCRYPTION_KEY); // Simple base64 encoding with a key
}

export function isValidAccessCode(code: string): boolean {
  return encryptAccessCode(code) === encryptAccessCode(VALID_ACCESS_CODE);
}

export function generateToken(): string {
  const expirationTime = Date.now() + 43200000; // 12 hours from now
  return btoa(JSON.stringify({ expiration: expirationTime }));
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const { expiration } = JSON.parse(atob(token));
    return Date.now() < expiration;
  } catch {
    return false;
  }
}
