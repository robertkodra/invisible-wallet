import CryptoJS from "crypto-js";

export const encryptPrivateKey = (
  privateKey: string,
  password: string
): string => {
  return CryptoJS.AES.encrypt(privateKey, password).toString();
};

export const decryptPrivateKey = (
  encryptedPrivateKey: string,
  password: string
): string | null => {
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
