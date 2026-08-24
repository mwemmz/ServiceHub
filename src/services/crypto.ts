import * as Crypto from 'expo-crypto';

export async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `servicehub:${password}`);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const next = await hashPassword(password);
  return next === hash;
}
