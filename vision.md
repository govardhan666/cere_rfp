https://dorahacks.io/hackathon/bounty/1196
🚨Reminder: Review the Contribution Guidelines! 🚨
Don't start coding! Submit your proposal first in our Github using the official template. Please make sure to carefully review the Contribution Guidelines. ✅
Objective
Today the DDC SDK encrypts user data only if the caller plugs in a cipher (e.g. NaclCipher). We want encryption out-of-the-box so every developer gets strong, audited protection without extra work.

Within the first 2 days we expect you to deliver the first built-in cipher: AES-256 (CBC mode + PKCS7 padding), mirroring the existing NaclCipher API.

Scope of Work - Milestone 1

AES256Cipher implementation – pure TypeScript, zero external deps except Node crypto.
Plug-in registration – export the class from @cere-ddc-sdk/core/src/cipher/ alongside NaclCipher.
Unit tests – full round-trip coverage (happy path + bad key/iv, tampered ciphertext, etc.).
Docs & Typedoc – short “how to switch ciphers” snippet in packages/core/README.md.
Upon timely & successful completion of Milestone 1, you can move forward with Milestone 2 & 3 and integrate this new functionality into the Playerground & CLI.

Deliverables

New source under packages/core/src/cipher/AES256Cipher.ts
≥ 95 % line coverage for the cipher folder
Example usage in examples/encryption/aes256.ts
CHANGELOG entry + semver bump (e.g. v0.5.0-aes)
PR passes CI (lint ➜ build ➜ tests ➜ type-check)
Success criteria

encrypt() + decrypt() return identical plaintext for all NIST test vectors.
No existing SDK tests regress; bundle-size increase ≤ 5 KB gzipped.
No new eslint-plugin-security / no-weak-crypto warnings.
Milestone 1 completes in 1 dev-day
