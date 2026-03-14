/**
 * AES-256-GCM encryption for Figma OAuth tokens.
 * TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).
 */

const KEY_HEX = process.env.TOKEN_ENCRYPTION_KEY ?? '';

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = Buffer.from(hex, 'hex');
  const ab = new ArrayBuffer(bytes.length);
  new Uint8Array(ab).set(bytes);
  return ab;
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    hexToArrayBuffer(KEY_HEX),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const result = Buffer.concat([
    Buffer.from(iv),
    Buffer.from(ciphertext),
  ]);

  return result.toString('base64');
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    hexToArrayBuffer(KEY_HEX),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.subarray(0, 12);
  const encrypted = data.subarray(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}
