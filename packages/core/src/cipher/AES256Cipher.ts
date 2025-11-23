import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { Cipher } from './Cipher';

/**
 * AES-256-CBC cipher implementation with PKCS7 padding.
 *
 * This cipher provides strong, audited encryption out-of-the-box for DDC SDK users.
 * It uses AES-256 in CBC mode with PKCS7 padding, which are industry-standard
 * cryptographic primitives available in Node.js crypto module.
 *
 * @remarks
 * - Key derivation: SHA-256 hash of the DEK ensures consistent 256-bit keys
 * - IV generation: Cryptographically secure random 16-byte IV for each encryption
 * - IV storage: IV is prepended to ciphertext (first 16 bytes)
 * - Padding: PKCS7 padding is handled automatically by Node.js crypto
 *
 * @example
 * ```typescript
 * import { AES256Cipher } from '@cere-ddc-sdk/core';
 *
 * const cipher = new AES256Cipher();
 * const data = new Uint8Array([1, 2, 3, 4]);
 * const dek = "my-secret-key";
 *
 * const encrypted = cipher.encrypt(data, dek);
 * const decrypted = cipher.decrypt(encrypted, dek);
 * ```
 *
 * @implements {Cipher}
 */
export class AES256Cipher implements Cipher {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly IV_LENGTH = 16; // 128 bits for AES (16 bytes)

  /**
   * Derives a consistent 256-bit encryption key from the provided DEK.
   *
   * Uses SHA-256 to ensure the key is always 32 bytes regardless of input DEK length.
   *
   * @param dek - The data encryption key (string or Uint8Array)
   * @returns A 256-bit (32-byte) key suitable for AES-256
   * @private
   */
  private deriveKey(dek: string | Uint8Array): Buffer {
    const dekBuffer = typeof dek === 'string' ? Buffer.from(dek, 'utf-8') : Buffer.from(dek);
    return createHash('sha256').update(dekBuffer).digest();
  }

  /**
   * Encrypts data using AES-256-CBC with PKCS7 padding.
   *
   * The encryption process:
   * 1. Derives a 256-bit key from the DEK using SHA-256
   * 2. Generates a cryptographically secure random 16-byte IV
   * 3. Encrypts the data using AES-256-CBC
   * 4. Prepends the IV to the ciphertext (IV || ciphertext)
   *
   * @param data - The plaintext data to encrypt
   * @param dek - The data encryption key (string or Uint8Array)
   * @returns Encrypted data with IV prepended (first 16 bytes are IV)
   * @throws {Error} If data is empty, DEK is empty, or encryption fails
   *
   * @example
   * ```typescript
   * const cipher = new AES256Cipher();
   * const plaintext = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
   * const encrypted = cipher.encrypt(plaintext, "my-secret-key");
   * ```
   */
  encrypt(data: Uint8Array, dek: string | Uint8Array): Uint8Array {
    // Input validation
    if (!data || data.length === 0) {
      throw new Error('Data to encrypt cannot be empty');
    }

    if (!dek || (typeof dek === 'string' && dek.length === 0) ||
        (dek instanceof Uint8Array && dek.length === 0)) {
      throw new Error('DEK (Data Encryption Key) cannot be empty');
    }

    try {
      // Derive a consistent 256-bit key from the DEK
      const key = this.deriveKey(dek);

      // Generate a cryptographically secure random IV
      const iv = randomBytes(AES256Cipher.IV_LENGTH);

      // Create cipher and encrypt
      const cipher = createCipheriv(AES256Cipher.ALGORITHM, key, iv);
      const encrypted = Buffer.concat([
        cipher.update(Buffer.from(data)),
        cipher.final()
      ]);

      // Prepend IV to ciphertext (standard practice)
      // Format: [IV (16 bytes)][Ciphertext (variable)]
      const result = Buffer.concat([iv, encrypted]);

      return new Uint8Array(result);
    } catch (error) {
      // Re-throw with context. Encryption errors are rare and usually indicate system issues.
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypts data that was encrypted with AES-256-CBC.
   *
   * The decryption process:
   * 1. Extracts the IV from the first 16 bytes of encrypted data
   * 2. Derives the same 256-bit key from the DEK using SHA-256
   * 3. Decrypts the remaining ciphertext using AES-256-CBC
   * 4. PKCS7 padding is automatically removed
   *
   * @param encryptedData - The encrypted data with IV prepended
   * @param dek - The data encryption key (must match the one used for encryption)
   * @returns The decrypted plaintext data
   * @throws {Error} If encrypted data is too short, DEK is empty, wrong key, or data is tampered
   *
   * @example
   * ```typescript
   * const cipher = new AES256Cipher();
   * const encrypted = new Uint8Array([...]); // Previously encrypted data
   * const decrypted = cipher.decrypt(encrypted, "my-secret-key");
   * ```
   */
  decrypt(encryptedData: Uint8Array, dek: string | Uint8Array): Uint8Array {
    // Input validation
    if (!encryptedData || encryptedData.length <= AES256Cipher.IV_LENGTH) {
      throw new Error('Encrypted data is too short or empty (must be > 16 bytes)');
    }

    if (!dek || (typeof dek === 'string' && dek.length === 0) ||
        (dek instanceof Uint8Array && dek.length === 0)) {
      throw new Error('DEK (Data Encryption Key) cannot be empty');
    }

    try {
      const buffer = Buffer.from(encryptedData);

      // Extract IV from the first 16 bytes
      const iv = buffer.subarray(0, AES256Cipher.IV_LENGTH);

      // Extract the actual ciphertext
      const ciphertext = buffer.subarray(AES256Cipher.IV_LENGTH);

      // Derive the same key from the DEK
      const key = this.deriveKey(dek);

      // Create decipher and decrypt
      const decipher = createDecipheriv(AES256Cipher.ALGORITHM, key, iv);
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final() // This will throw if padding is invalid (tampered data)
      ]);

      return new Uint8Array(decrypted);
    } catch (error) {
      // Most decryption errors are due to wrong key or tampered data
      // This includes padding errors, block size errors, etc.
      throw new Error('Decryption failed: Wrong key or tampered data');
    }
  }
}
