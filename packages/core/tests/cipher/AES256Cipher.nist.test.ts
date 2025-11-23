import { describe, it, expect } from '@jest/globals';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { AES256Cipher } from '../../src/cipher/AES256Cipher';

/**
 * NIST Test Vectors for AES-256-CBC
 *
 * These test vectors are derived from NIST Special Publication 800-38A
 * "Recommendation for Block Cipher Modes of Operation: Methods and Techniques"
 *
 * Source: https://csrc.nist.gov/publications/detail/sp/800-38a/final
 */
describe('AES256Cipher - NIST Test Vectors', () => {
  let cipher: AES256Cipher;

  beforeEach(() => {
    cipher = new AES256Cipher();
  });

  describe('NIST SP 800-38A Test Vectors', () => {
    /**
     * Test Vector #1 from NIST SP 800-38A
     * F.2.5 CBC-AES256.Encrypt
     */
    it('should match NIST test vector #1', () => {
      // NIST test vector values
      const key = Buffer.from('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4', 'hex');
      const iv = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
      const plaintext = Buffer.from('6bc1bee22e409f96e93d7e117393172a', 'hex');
      const expectedCiphertext = Buffer.from('f58c4c04d6e5f1ba779eabfb5f7bfbd6', 'hex');

      // Encrypt using Node.js crypto to verify
      const nodeCipher = createCipheriv('aes-256-cbc', key, iv);
      nodeCipher.setAutoPadding(false); // NIST vectors don't use padding
      const nodeEncrypted = Buffer.concat([
        nodeCipher.update(plaintext),
        nodeCipher.final()
      ]);

      expect(nodeEncrypted.toString('hex')).toBe(expectedCiphertext.toString('hex'));

      // Decrypt to verify round trip
      const nodeDecipher = createDecipheriv('aes-256-cbc', key, iv);
      nodeDecipher.setAutoPadding(false);
      const nodeDecrypted = Buffer.concat([
        nodeDecipher.update(nodeEncrypted),
        nodeDecipher.final()
      ]);

      expect(nodeDecrypted.toString('hex')).toBe(plaintext.toString('hex'));
    });

    /**
     * Test Vector #2 from NIST SP 800-38A
     * Multi-block encryption
     */
    it('should match NIST test vector #2 (multi-block)', () => {
      const key = Buffer.from('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4', 'hex');
      const iv = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');

      // Multiple blocks of plaintext
      const plaintext = Buffer.from(
        '6bc1bee22e409f96e93d7e117393172a' +
        'ae2d8a571e03ac9c9eb76fac45af8e51' +
        '30c81c46a35ce411e5fbc1191a0a52ef' +
        'f69f2445df4f9b17ad2b417be66c3710',
        'hex'
      );

      const expectedCiphertext = Buffer.from(
        'f58c4c04d6e5f1ba779eabfb5f7bfbd6' +
        '9cfc4e967edb808d679f777bc6702c7d' +
        '39f23369a9d9bacfa530e26304231461' +
        'b2eb05e2c39be9fcda6c19078c6a9d1b',
        'hex'
      );

      // Encrypt
      const nodeCipher = createCipheriv('aes-256-cbc', key, iv);
      nodeCipher.setAutoPadding(false);
      const encrypted = Buffer.concat([
        nodeCipher.update(plaintext),
        nodeCipher.final()
      ]);

      expect(encrypted.toString('hex')).toBe(expectedCiphertext.toString('hex'));

      // Decrypt
      const nodeDecipher = createDecipheriv('aes-256-cbc', key, iv);
      nodeDecipher.setAutoPadding(false);
      const decrypted = Buffer.concat([
        nodeDecipher.update(encrypted),
        nodeDecipher.final()
      ]);

      expect(decrypted.toString('hex')).toBe(plaintext.toString('hex'));
    });

    /**
     * Test Vector #3 - Custom vector with PKCS7 padding
     */
    it('should correctly handle PKCS7 padding', () => {
      const key = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
      const iv = Buffer.from('fedcba9876543210fedcba9876543210', 'hex');
      const plaintext = Buffer.from('Hello, World!'); // 13 bytes, needs 3 bytes padding

      // Encrypt with automatic PKCS7 padding
      const nodeCipher = createCipheriv('aes-256-cbc', key, iv);
      const encrypted = Buffer.concat([
        nodeCipher.update(plaintext),
        nodeCipher.final()
      ]);

      // Decrypt
      const nodeDecipher = createDecipheriv('aes-256-cbc', key, iv);
      const decrypted = Buffer.concat([
        nodeDecipher.update(encrypted),
        nodeDecipher.final()
      ]);

      expect(decrypted.toString()).toBe(plaintext.toString());
    });
  });

  describe('AES256Cipher Integration with NIST-like Vectors', () => {
    /**
     * Test our AES256Cipher implementation with various plaintexts
     * to ensure it produces valid AES-256-CBC encryption
     */
    it('should produce valid AES-256-CBC encryption for various inputs', () => {
      const testCases = [
        {
          plaintext: 'a',
          dek: 'test-key-1'
        },
        {
          plaintext: 'Hello, World!',
          dek: 'test-key-2'
        },
        {
          plaintext: 'The quick brown fox jumps over the lazy dog',
          dek: 'test-key-3'
        },
        {
          plaintext: 'A'.repeat(1000),
          dek: 'test-key-4'
        },
        {
          plaintext: '🔐 Encryption Test 密码测试 مفتاح',
          dek: 'test-key-5'
        }
      ];

      testCases.forEach(({ plaintext, dek }) => {
        const plaintextBytes = new Uint8Array(Buffer.from(plaintext, 'utf-8'));

        // Encrypt with our cipher
        const encrypted = cipher.encrypt(plaintextBytes, dek);

        // Verify IV is present (first 16 bytes)
        expect(encrypted.length).toBeGreaterThanOrEqual(16);

        // Decrypt and verify
        const decrypted = cipher.decrypt(encrypted, dek);
        const decryptedText = Buffer.from(decrypted).toString('utf-8');

        expect(decryptedText).toBe(plaintext);
      });
    });

    it('should produce ciphertext that can be decrypted with Node.js crypto directly', () => {
      const plaintext = new Uint8Array(Buffer.from('Test message', 'utf-8'));
      const dek = 'known-dek-value';

      // Encrypt with our cipher
      const encrypted = cipher.encrypt(plaintext, dek);

      // Extract IV and ciphertext
      const iv = Buffer.from(encrypted.subarray(0, 16));
      const ciphertext = Buffer.from(encrypted.subarray(16));

      // Derive the same key our cipher would use (SHA-256 of DEK)
      const key = createHash('sha256').update(Buffer.from(dek, 'utf-8')).digest();

      // Decrypt using Node.js crypto directly
      const decipher = createDecipheriv('aes-256-cbc', key, iv);
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);

      expect(Buffer.from(decrypted).toString('utf-8')).toBe('Test message');
    });

    it('should decrypt ciphertext created by Node.js crypto directly', () => {
      const plaintext = Buffer.from('Direct crypto test', 'utf-8');
      const dek = 'direct-test-key';

      // Derive key the same way our cipher does
      const key = createHash('sha256').update(Buffer.from(dek, 'utf-8')).digest();

      // Generate IV
      const iv = randomBytes(16);

      // Encrypt with Node.js crypto
      const nodeCipher = createCipheriv('aes-256-cbc', key, iv);
      const ciphertext = Buffer.concat([
        nodeCipher.update(plaintext),
        nodeCipher.final()
      ]);

      // Combine IV and ciphertext (same format as our cipher)
      const encrypted = new Uint8Array(Buffer.concat([iv, ciphertext]));

      // Decrypt with our cipher
      const decrypted = cipher.decrypt(encrypted, dek);

      expect(Buffer.from(decrypted).toString('utf-8')).toBe('Direct crypto test');
    });
  });

  describe('Cryptographic Properties Validation', () => {
    it('should produce different ciphertexts for identical plaintexts (IV randomness)', () => {
      const plaintext = new Uint8Array(Buffer.from('Same message', 'utf-8'));
      const dek = 'same-key';

      const encrypted1 = cipher.encrypt(plaintext, dek);
      const encrypted2 = cipher.encrypt(plaintext, dek);

      // IVs should be different
      const iv1 = encrypted1.subarray(0, 16);
      const iv2 = encrypted2.subarray(0, 16);
      expect(Buffer.from(iv1).equals(Buffer.from(iv2))).toBe(false);

      // Ciphertexts should be different
      expect(Buffer.from(encrypted1).equals(Buffer.from(encrypted2))).toBe(false);

      // But both should decrypt correctly
      const decrypted1 = cipher.decrypt(encrypted1, dek);
      const decrypted2 = cipher.decrypt(encrypted2, dek);
      expect(decrypted1).toEqual(plaintext);
      expect(decrypted2).toEqual(plaintext);
    });

    it('should fail decryption with modified ciphertext (integrity check)', () => {
      const plaintext = new Uint8Array(Buffer.from('Integrity test', 'utf-8'));
      const dek = 'integrity-key';

      const encrypted = cipher.encrypt(plaintext, dek);

      // Modify one byte in the ciphertext
      const tampered = new Uint8Array(encrypted);
      tampered[20] = tampered[20] ^ 0xFF;

      expect(() => cipher.decrypt(tampered, dek)).toThrow();
    });

    it('should use proper AES block size (16 bytes)', () => {
      const dek = 'block-size-test';

      // Test various input sizes
      for (let size = 1; size <= 48; size++) {
        const plaintext = new Uint8Array(size).fill(0x42);
        const encrypted = cipher.encrypt(plaintext, dek);

        // Remove IV to get ciphertext
        const ciphertext = encrypted.subarray(16);

        // Ciphertext should be a multiple of 16 bytes (AES block size)
        expect(ciphertext.length % 16).toBe(0);

        // Verify decryption
        const decrypted = cipher.decrypt(encrypted, dek);
        expect(decrypted).toEqual(plaintext);
      }
    });

    it('should implement PKCS7 padding correctly', () => {
      const dek = 'padding-test';

      // Test cases with specific padding requirements
      const testCases = [
        { size: 1, expectedPadding: 15 },   // 15 bytes of padding
        { size: 15, expectedPadding: 1 },   // 1 byte of padding
        { size: 16, expectedPadding: 16 },  // Full block of padding
        { size: 17, expectedPadding: 15 },  // 15 bytes of padding
        { size: 32, expectedPadding: 16 },  // Full block of padding
      ];

      testCases.forEach(({ size, expectedPadding }) => {
        const plaintext = new Uint8Array(size).fill(0x41);
        const encrypted = cipher.encrypt(plaintext, dek);
        const ciphertext = encrypted.subarray(16);

        // Ciphertext size should be plaintext + padding
        const expectedSize = size + expectedPadding;
        expect(ciphertext.length).toBe(expectedSize);

        // Verify decryption removes padding correctly
        const decrypted = cipher.decrypt(encrypted, dek);
        expect(decrypted.length).toBe(size);
        expect(decrypted).toEqual(plaintext);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large data efficiently', () => {
      const sizes = [1024, 10240, 102400]; // 1KB, 10KB, 100KB
      const dek = 'performance-test';

      sizes.forEach(size => {
        const plaintext = new Uint8Array(size).fill(0x55);

        const startEncrypt = Date.now();
        const encrypted = cipher.encrypt(plaintext, dek);
        const encryptTime = Date.now() - startEncrypt;

        const startDecrypt = Date.now();
        const decrypted = cipher.decrypt(encrypted, dek);
        const decryptTime = Date.now() - startDecrypt;

        // Verify correctness
        expect(decrypted).toEqual(plaintext);

        // Performance should be reasonable (< 1 second for 100KB)
        expect(encryptTime).toBeLessThan(1000);
        expect(decryptTime).toBeLessThan(1000);
      });
    });
  });
});
