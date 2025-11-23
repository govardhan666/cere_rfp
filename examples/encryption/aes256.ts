/**
 * AES256Cipher Usage Examples
 *
 * This file demonstrates various use cases for the AES256Cipher
 * in the Cere DDC SDK.
 */

import { AES256Cipher } from '@cere-ddc-sdk/core';

/**
 * Example 1: Basic encryption and decryption with string DEK
 */
function basicExample() {
  console.log('\n=== Example 1: Basic Usage ===\n');

  const cipher = new AES256Cipher();

  // Prepare data
  const message = 'Hello, Cere DDC!';
  const data = new Uint8Array(Buffer.from(message, 'utf-8'));
  const dek = 'my-secret-key';

  // Encrypt
  console.log('Original message:', message);
  const encrypted = cipher.encrypt(data, dek);
  console.log('Encrypted (hex):', Buffer.from(encrypted).toString('hex'));
  console.log('Encrypted size:', encrypted.length, 'bytes');

  // Decrypt
  const decrypted = cipher.decrypt(encrypted, dek);
  const decryptedMessage = Buffer.from(decrypted).toString('utf-8');
  console.log('Decrypted message:', decryptedMessage);
}

/**
 * Example 2: Using Uint8Array DEK
 */
function uint8ArrayDekExample() {
  console.log('\n=== Example 2: Uint8Array DEK ===\n');

  const cipher = new AES256Cipher();

  // Use binary key
  const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const dek = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);

  console.log('Original data:', Array.from(data));

  const encrypted = cipher.encrypt(data, dek);
  console.log('Encrypted (base64):', Buffer.from(encrypted).toString('base64'));

  const decrypted = cipher.decrypt(encrypted, dek);
  console.log('Decrypted data:', Array.from(decrypted));
  console.log('Match:', JSON.stringify(data) === JSON.stringify(decrypted));
}

/**
 * Example 3: Encrypting user data for DDC storage
 */
function userDataExample() {
  console.log('\n=== Example 3: User Data Encryption ===\n');

  const cipher = new AES256Cipher();

  // Simulated user data
  const userData = {
    userId: '12345',
    email: 'user@example.com',
    preferences: {
      theme: 'dark',
      notifications: true
    }
  };

  const dataString = JSON.stringify(userData);
  const data = new Uint8Array(Buffer.from(dataString, 'utf-8'));

  // Use user-specific DEK (in production, derive from user credentials)
  const userDek = '/data/users/12345/encryption-key';

  console.log('User data:', userData);

  const encrypted = cipher.encrypt(data, userDek);
  console.log('Encrypted size:', encrypted.length, 'bytes');

  // Later, retrieve and decrypt
  const decrypted = cipher.decrypt(encrypted, userDek);
  const recoveredData = JSON.parse(Buffer.from(decrypted).toString('utf-8'));
  console.log('Recovered data:', recoveredData);
}

/**
 * Example 4: Handling files/large data
 */
function largeDataExample() {
  console.log('\n=== Example 4: Large Data Encryption ===\n');

  const cipher = new AES256Cipher();

  // Simulate a file (100 KB)
  const fileSize = 100 * 1024;
  const fileData = new Uint8Array(fileSize);

  // Fill with some pattern
  for (let i = 0; i < fileSize; i++) {
    fileData[i] = i % 256;
  }

  const dek = 'file-encryption-key';

  console.log('File size:', fileSize, 'bytes');

  const startEncrypt = Date.now();
  const encrypted = cipher.encrypt(fileData, dek);
  const encryptTime = Date.now() - startEncrypt;

  console.log('Encrypted size:', encrypted.length, 'bytes');
  console.log('Encryption time:', encryptTime, 'ms');

  const startDecrypt = Date.now();
  const decrypted = cipher.decrypt(encrypted, dek);
  const decryptTime = Date.now() - startDecrypt;

  console.log('Decryption time:', decryptTime, 'ms');
  console.log('Data integrity:', Buffer.from(fileData).equals(Buffer.from(decrypted)));
}

/**
 * Example 5: Switching from NaclCipher to AES256Cipher
 */
function switchingCiphersExample() {
  console.log('\n=== Example 5: Switching Ciphers ===\n');

  // Before: Using NaclCipher (conceptual)
  console.log('Before:');
  console.log('  import { NaclCipher } from "@cere-ddc-sdk/core";');
  console.log('  const cipher = new NaclCipher();');

  // After: Using AES256Cipher
  console.log('\nAfter:');
  console.log('  import { AES256Cipher } from "@cere-ddc-sdk/core";');
  console.log('  const cipher = new AES256Cipher();');

  console.log('\nThe API remains the same:');
  const cipher = new AES256Cipher();
  const data = new Uint8Array([1, 2, 3, 4, 5]);
  const dek = 'my-key';

  const encrypted = cipher.encrypt(data, dek);
  const decrypted = cipher.decrypt(encrypted, dek);

  console.log('  cipher.encrypt(data, dek)');
  console.log('  cipher.decrypt(encrypted, dek)');
  console.log('  ✓ Same API, stronger encryption!');
}

/**
 * Example 6: Error handling
 */
function errorHandlingExample() {
  console.log('\n=== Example 6: Error Handling ===\n');

  const cipher = new AES256Cipher();

  // Example 6a: Empty data
  try {
    cipher.encrypt(new Uint8Array([]), 'key');
  } catch (error) {
    console.log('Empty data error:', (error as Error).message);
  }

  // Example 6b: Wrong key during decryption
  try {
    const data = new Uint8Array([1, 2, 3]);
    const encrypted = cipher.encrypt(data, 'correct-key');
    cipher.decrypt(encrypted, 'wrong-key');
  } catch (error) {
    console.log('Wrong key error:', (error as Error).message);
  }

  // Example 6c: Tampered data
  try {
    const data = new Uint8Array([1, 2, 3]);
    const encrypted = cipher.encrypt(data, 'key');

    // Tamper with the data
    encrypted[10] = encrypted[10] ^ 0xFF;

    cipher.decrypt(encrypted, 'key');
  } catch (error) {
    console.log('Tampered data error:', (error as Error).message);
  }
}

/**
 * Example 7: Best practices for DEK management
 */
function dekManagementExample() {
  console.log('\n=== Example 7: DEK Management Best Practices ===\n');

  const cipher = new AES256Cipher();

  // ✅ GOOD: Use path-based or content-based DEK
  const contentId = '0x1234567890abcdef';
  const userId = 'user-12345';

  const goodDek1 = `/data/${userId}/${contentId}`;
  console.log('✅ Path-based DEK:', goodDek1);

  // ✅ GOOD: Derive DEK from user credentials (in production use KDF)
  const userSecret = 'user-specific-secret-from-authentication';
  const goodDek2 = `${userSecret}:${contentId}`;
  console.log('✅ Derived DEK: [hidden]');

  // ✅ GOOD: Use environment-specific prefix
  const environment = process.env.NODE_ENV || 'development';
  const goodDek3 = `${environment}:${userId}:${contentId}`;
  console.log('✅ Environment-specific DEK:', goodDek3);

  // ❌ BAD: Don't hardcode DEKs
  const badDek1 = 'hardcoded-key-12345'; // Don't do this!
  console.log('❌ Hardcoded DEK (avoid!)');

  // Demonstrate usage
  const data = new Uint8Array(Buffer.from('Sensitive data', 'utf-8'));
  const encrypted = cipher.encrypt(data, goodDek1);
  console.log('\nEncrypted with path-based DEK successfully');
}

/**
 * Example 8: Integration with DDC Client (conceptual)
 */
function ddcIntegrationExample() {
  console.log('\n=== Example 8: DDC Client Integration (Conceptual) ===\n');

  console.log('// Initialize DDC Client with AES256Cipher');
  console.log('import { DdcClient, AES256Cipher } from "@cere-ddc-sdk/core";');
  console.log('');
  console.log('const cipher = new AES256Cipher();');
  console.log('const client = new DdcClient({');
  console.log('  clusterAddress: "...",');
  console.log('  cipher: cipher  // Use AES-256 encryption');
  console.log('});');
  console.log('');
  console.log('// All data stored will be encrypted with AES-256-CBC');
  console.log('await client.store(bucketId, data, { dek: "/my/data/key" });');
}

/**
 * Example 9: Benchmark different data sizes
 */
function benchmarkExample() {
  console.log('\n=== Example 9: Performance Benchmark ===\n');

  const cipher = new AES256Cipher();
  const sizes = [1024, 10240, 102400, 1024000]; // 1KB, 10KB, 100KB, 1MB

  console.log('Data Size | Encrypt Time | Decrypt Time | Throughput');
  console.log('----------|--------------|--------------|------------');

  sizes.forEach(size => {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = i % 256;
    }

    const dek = 'benchmark-key';

    // Encrypt
    const encryptStart = process.hrtime.bigint();
    const encrypted = cipher.encrypt(data, dek);
    const encryptEnd = process.hrtime.bigint();
    const encryptTimeMs = Number(encryptEnd - encryptStart) / 1_000_000;

    // Decrypt
    const decryptStart = process.hrtime.bigint();
    cipher.decrypt(encrypted, dek);
    const decryptEnd = process.hrtime.bigint();
    const decryptTimeMs = Number(decryptEnd - decryptStart) / 1_000_000;

    const throughputMBps = (size / 1024 / 1024) / (encryptTimeMs / 1000);

    const sizeLabel = size >= 1024000 ? `${size / 1024000}MB` :
                      size >= 1024 ? `${size / 1024}KB` :
                      `${size}B`;

    console.log(
      `${sizeLabel.padEnd(9)} | ${encryptTimeMs.toFixed(2).padStart(12)}ms | ${decryptTimeMs.toFixed(2).padStart(12)}ms | ${throughputMBps.toFixed(1)} MB/s`
    );
  });
}

/**
 * Example 10: Unicode and special characters
 */
function unicodeExample() {
  console.log('\n=== Example 10: Unicode Support ===\n');

  const cipher = new AES256Cipher();

  const messages = [
    'Hello, World! 👋',
    '你好，世界！',
    'مرحبا بالعالم',
    'Привет, мир!',
    '🔐 Encrypted with AES-256 🔐',
    'Mixed: ABC 中文 🌍 مرحبا 123'
  ];

  messages.forEach((message, index) => {
    const data = new Uint8Array(Buffer.from(message, 'utf-8'));
    const dek = `unicode-key-${index}`;

    const encrypted = cipher.encrypt(data, dek);
    const decrypted = cipher.decrypt(encrypted, dek);
    const result = Buffer.from(decrypted).toString('utf-8');

    console.log(`Original:  ${message}`);
    console.log(`Decrypted: ${result}`);
    console.log(`Match: ${message === result ? '✓' : '✗'}\n`);
  });
}

// Run all examples
function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       AES256Cipher Examples - Cere DDC SDK                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  basicExample();
  uint8ArrayDekExample();
  userDataExample();
  largeDataExample();
  switchingCiphersExample();
  errorHandlingExample();
  dekManagementExample();
  ddcIntegrationExample();
  benchmarkExample();
  unicodeExample();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Examples Complete                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Execute if run directly
if (require.main === module) {
  runAllExamples();
}

export {
  basicExample,
  uint8ArrayDekExample,
  userDataExample,
  largeDataExample,
  switchingCiphersExample,
  errorHandlingExample,
  dekManagementExample,
  ddcIntegrationExample,
  benchmarkExample,
  unicodeExample,
  runAllExamples
};
