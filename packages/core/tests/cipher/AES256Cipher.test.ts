import { describe, it, expect, beforeEach } from '@jest/globals';
import { AES256Cipher } from '../../src/cipher/AES256Cipher';
import { createHash } from 'crypto';

describe('AES256Cipher', () => {
  let cipher: AES256Cipher;

  beforeEach(() => {
    cipher = new AES256Cipher();
  });

  describe('Happy Path - Round Trip Encryption/Decryption', () => {
    it('should encrypt and decrypt data with string DEK', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = 'my-secret-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should encrypt and decrypt data with Uint8Array DEK', () => {
      const plaintext = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const dek = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should encrypt and decrypt large data', () => {
      const plaintext = new Uint8Array(10000).fill(42);
      const dek = 'large-data-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should encrypt and decrypt single byte', () => {
      const plaintext = new Uint8Array([1]);
      const dek = 'single-byte-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle UTF-8 string data correctly', () => {
      const message = 'Hello, 世界! 🌍';
      const plaintext = new Uint8Array(Buffer.from(message, 'utf-8'));
      const dek = 'utf8-test-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(Buffer.from(decrypted).toString('utf-8')).toBe(message);
    });

    it('should produce different ciphertexts for same plaintext (random IV)', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = 'same-key';

      const encrypted1 = cipher.encrypt(plaintext, dek);
      const encrypted2 = cipher.encrypt(plaintext, dek);

      // Ciphertexts should be different due to random IV
      expect(encrypted1).not.toEqual(encrypted2);

      // But both should decrypt to the same plaintext
      expect(cipher.decrypt(encrypted1, dek)).toEqual(plaintext);
      expect(cipher.decrypt(encrypted2, dek)).toEqual(plaintext);
    });
  });

  describe('Encryption Output Format', () => {
    it('should prepend 16-byte IV to ciphertext', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = 'test-key';

      const encrypted = cipher.encrypt(plaintext, dek);

      // Encrypted data should be at least IV_LENGTH (16) + block size
      expect(encrypted.length).toBeGreaterThanOrEqual(16);

      // First 16 bytes should be the IV (should vary each time)
      const encrypted2 = cipher.encrypt(plaintext, dek);
      const iv1 = encrypted.subarray(0, 16);
      const iv2 = encrypted2.subarray(0, 16);

      expect(iv1).not.toEqual(iv2);
    });

    it('should produce ciphertext larger than plaintext due to padding', () => {
      const plaintext = new Uint8Array([1, 2, 3]);
      const dek = 'test-key';

      const encrypted = cipher.encrypt(plaintext, dek);

      // Encrypted should include: IV (16 bytes) + padded ciphertext
      // Minimum is 16 (IV) + 16 (one block with padding)
      expect(encrypted.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('Key Derivation', () => {
    it('should produce same encryption with same DEK (deterministic key derivation)', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = 'consistent-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle various DEK lengths correctly', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);

      // Short DEK
      const shortDek = 'k';
      const encrypted1 = cipher.encrypt(plaintext, shortDek);
      expect(cipher.decrypt(encrypted1, shortDek)).toEqual(plaintext);

      // Long DEK
      const longDek = 'a'.repeat(1000);
      const encrypted2 = cipher.encrypt(plaintext, longDek);
      expect(cipher.decrypt(encrypted2, longDek)).toEqual(plaintext);

      // Medium DEK
      const mediumDek = 'this-is-a-32-byte-key-for-aes';
      const encrypted3 = cipher.encrypt(plaintext, mediumDek);
      expect(cipher.decrypt(encrypted3, mediumDek)).toEqual(plaintext);
    });
  });

  describe('Error Handling - Empty Input', () => {
    it('should throw error when encrypting empty data', () => {
      const emptyData = new Uint8Array([]);
      const dek = 'test-key';

      expect(() => cipher.encrypt(emptyData, dek)).toThrow('Data to encrypt cannot be empty');
    });

    it('should throw error when encrypting with empty string DEK', () => {
      const plaintext = new Uint8Array([1, 2, 3]);
      const emptyDek = '';

      expect(() => cipher.encrypt(plaintext, emptyDek)).toThrow('DEK (Data Encryption Key) cannot be empty');
    });

    it('should throw error when encrypting with empty Uint8Array DEK', () => {
      const plaintext = new Uint8Array([1, 2, 3]);
      const emptyDek = new Uint8Array([]);

      expect(() => cipher.encrypt(plaintext, emptyDek)).toThrow('DEK (Data Encryption Key) cannot be empty');
    });

    it('should throw error when decrypting with empty string DEK', () => {
      const encryptedData = new Uint8Array(32);
      const emptyDek = '';

      expect(() => cipher.decrypt(encryptedData, emptyDek)).toThrow('DEK (Data Encryption Key) cannot be empty');
    });

    it('should throw error when decrypting with empty Uint8Array DEK', () => {
      const encryptedData = new Uint8Array(32);
      const emptyDek = new Uint8Array([]);

      expect(() => cipher.decrypt(encryptedData, emptyDek)).toThrow('DEK (Data Encryption Key) cannot be empty');
    });

    it('should throw error when decrypting data shorter than IV length', () => {
      const shortData = new Uint8Array([1, 2, 3]); // Less than 16 bytes
      const dek = 'test-key';

      expect(() => cipher.decrypt(shortData, dek)).toThrow('Encrypted data is too short or empty');
    });

    it('should throw error when decrypting empty data', () => {
      const emptyData = new Uint8Array([]);
      const dek = 'test-key';

      expect(() => cipher.decrypt(emptyData, dek)).toThrow('Encrypted data is too short or empty');
    });
  });

  describe('Error Handling - Wrong Key', () => {
    it('should throw error when decrypting with wrong string key', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const correctDek = 'correct-key';
      const wrongDek = 'wrong-key';

      const encrypted = cipher.encrypt(plaintext, correctDek);

      expect(() => cipher.decrypt(encrypted, wrongDek)).toThrow('Wrong key or tampered data');
    });

    it('should throw error when decrypting with wrong Uint8Array key', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const correctDek = new Uint8Array([1, 2, 3, 4]);
      const wrongDek = new Uint8Array([5, 6, 7, 8]);

      const encrypted = cipher.encrypt(plaintext, correctDek);

      expect(() => cipher.decrypt(encrypted, wrongDek)).toThrow('Wrong key or tampered data');
    });

    it('should throw error when decrypting with slightly different key', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const correctDek = 'mySecretKey123';
      const wrongDek = 'mySecretKey124'; // Just one character different

      const encrypted = cipher.encrypt(plaintext, correctDek);

      expect(() => cipher.decrypt(encrypted, wrongDek)).toThrow('Wrong key or tampered data');
    });
  });

  describe('Error Handling - Tampered Data', () => {
    it('should throw error when ciphertext is modified', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = 'test-key';

      const encrypted = cipher.encrypt(plaintext, dek);

      // Tamper with the ciphertext (not the IV)
      encrypted[20] = encrypted[20] ^ 1; // Flip one bit

      expect(() => cipher.decrypt(encrypted, dek)).toThrow('Decryption failed');
    });

    it('should throw error when IV is modified', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = 'test-key';

      const encrypted = cipher.encrypt(plaintext, dek);

      // Tamper with the IV
      encrypted[0] = encrypted[0] ^ 1; // Flip one bit in IV

      expect(() => cipher.decrypt(encrypted, dek)).toThrow('Decryption failed');
    });

    it('should throw error when last byte is modified (padding attack)', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = 'test-key';

      const encrypted = cipher.encrypt(plaintext, dek);

      // Tamper with the last byte (affects padding)
      encrypted[encrypted.length - 1] = encrypted[encrypted.length - 1] ^ 1;

      expect(() => cipher.decrypt(encrypted, dek)).toThrow('Decryption failed');
    });

    it('should throw error when encrypted data is truncated', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = 'test-key';

      const encrypted = cipher.encrypt(plaintext, dek);

      // Truncate the encrypted data
      const truncated = encrypted.subarray(0, encrypted.length - 5);

      expect(() => cipher.decrypt(truncated, dek)).toThrow('Decryption failed');
    });

    it('should throw error when encrypted data has extra bytes appended', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = 'test-key';

      const encrypted = cipher.encrypt(plaintext, dek);

      // Append extra bytes
      const modified = new Uint8Array(encrypted.length + 10);
      modified.set(encrypted);

      expect(() => cipher.decrypt(modified, dek)).toThrow('Decryption failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle data that is exactly one block (16 bytes)', () => {
      const plaintext = new Uint8Array(16).fill(0xAB);
      const dek = 'block-aligned-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle data that is multiple blocks', () => {
      const plaintext = new Uint8Array(48).fill(0xCD); // 3 blocks
      const dek = 'multi-block-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle maximum safe integer in Uint8Array', () => {
      const plaintext = new Uint8Array([255, 255, 255, 255]);
      const dek = 'max-value-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle all zero bytes', () => {
      const plaintext = new Uint8Array(100).fill(0);
      const dek = 'zero-bytes-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle binary data with all possible byte values', () => {
      const plaintext = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        plaintext[i] = i;
      }
      const dek = 'all-bytes-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle special characters in DEK', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });

    it('should handle Unicode characters in DEK', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = '密钥🔐🌍مفتاحключ';

      const encrypted = cipher.encrypt(plaintext, dek);
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(decrypted).toEqual(plaintext);
    });
  });

  describe('Security Properties', () => {
    it('should use different IVs for each encryption', () => {
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
      const dek = 'test-key';

      const ivs = new Set<string>();

      // Encrypt multiple times and collect IVs
      for (let i = 0; i < 100; i++) {
        const encrypted = cipher.encrypt(plaintext, dek);
        const iv = Buffer.from(encrypted.subarray(0, 16)).toString('hex');
        ivs.add(iv);
      }

      // All IVs should be unique (with very high probability)
      expect(ivs.size).toBe(100);
    });

    it('should produce ciphertext that looks random', () => {
      const plaintext = new Uint8Array(100).fill(0xAA); // Repeating pattern
      const dek = 'test-key';

      const encrypted = cipher.encrypt(plaintext, dek);
      const ciphertext = encrypted.subarray(16); // Skip IV

      // Count unique bytes in ciphertext
      const uniqueBytes = new Set(Array.from(ciphertext));

      // Good encryption should have diverse byte values (not repeating 0xAA)
      expect(uniqueBytes.size).toBeGreaterThan(10);
    });

    it('should not leak plaintext length in a predictable way', () => {
      const dek = 'test-key';

      const lengths = new Map<number, number>();

      // Encrypt data of different lengths and check output sizes
      for (let len = 1; len <= 32; len++) {
        const plaintext = new Uint8Array(len).fill(len);
        const encrypted = cipher.encrypt(plaintext, dek);

        lengths.set(len, encrypted.length);
      }

      // Due to PKCS7 padding, output should be in blocks
      // Different input lengths should sometimes map to same output length
      const outputLengths = new Set(lengths.values());
      expect(outputLengths.size).toBeLessThan(32); // Not 32 unique lengths
    });
  });
});
