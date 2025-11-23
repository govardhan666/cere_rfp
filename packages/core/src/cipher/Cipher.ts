/**
 * Cipher interface for encrypting and decrypting data in the DDC SDK.
 *
 * All cipher implementations must implement this interface to ensure
 * compatibility with the DDC SDK encryption system.
 *
 * @interface Cipher
 */
export interface Cipher {
  /**
   * Encrypts data using the provided data encryption key (DEK).
   *
   * @param data - The plaintext data to encrypt as a Uint8Array
   * @param dek - The data encryption key, can be a string or Uint8Array
   * @returns The encrypted data as a Uint8Array
   * @throws {Error} If encryption fails or invalid parameters are provided
   */
  encrypt(data: Uint8Array, dek: string | Uint8Array): Uint8Array;

  /**
   * Decrypts encrypted data using the provided data encryption key (DEK).
   *
   * @param encryptedData - The encrypted data as a Uint8Array
   * @param dek - The data encryption key, can be a string or Uint8Array
   * @returns The decrypted plaintext data as a Uint8Array
   * @throws {Error} If decryption fails, key is incorrect, or data is tampered
   */
  decrypt(encryptedData: Uint8Array, dek: string | Uint8Array): Uint8Array;
}
