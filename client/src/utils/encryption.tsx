import CryptoJS from "crypto-js";

/**
 * Encrypts a private key using a password.
 * @param privateKey - The private key to encrypt
 * @param password - The password to use for encryption
 * @returns The encrypted private key as a string
 */
export const encryptPrivateKey = (
  privateKey: string,
  password: string
): string => {
  if (!privateKey || !password) {
    throw new Error("Private key and password are required");
  }

  return CryptoJS.AES.encrypt(privateKey, password).toString();
};

/**
 * Decrypts an encrypted private key using a password.
 * @param encryptedPrivateKey - The encrypted private key
 * @param password - The password to use for decryption
 * @returns The decrypted private key as a string, or null if decryption fails
 */
export const decryptPrivateKey = (
  encryptedPrivateKey: string,
  password: string
): string | null => {
  if (!encryptedPrivateKey || !password) {
    console.error("Encrypted private key and password are required");
    return null;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    // Check if the decrypted string is empty
    if (!decrypted) {
      return null;
    }

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
