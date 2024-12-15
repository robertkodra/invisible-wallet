import {
  type SessionParams,
  type DappKey,
  type OffChainSession,
  buildSessionAccount,
  createSessionRequest,
} from "@argent/x-sessions";
import { Account, constants, ec, RpcProvider, stark } from "starknet";

/**
 * Service class for managing Argent X sessions
 * Handles creation, retrieval, and management of session keys for gasless transactions
 */
export class SessionService {
  /** Duration of a session in milliseconds (24 hours) */
  private static SESSION_DURATION = 24 * 60 * 60 * 1000;

  /**
   * Creates a new Argent session for gasless transactions
   * @param account - The Starknet account instance
   * @param contractAddress - The address of the contract to interact with
   * @param methodSelector - The method selector (function name) allowed for this session
   * @returns Session creation result including parameters, signature, and keys
   */
  static async createArgentSession(
    account: Account, 
    contractAddress: string, 
    methodSelector: string,
  ) {
    // Generate a new key pair for this session
    const privateKey = ec.starkCurve.utils.randomPrivateKey();
    const dappKey: DappKey = {
      privateKey,
      publicKey: ec.starkCurve.getStarkKey(privateKey),
    };

    // Calculate session expiry (24 hours from now)
    const expiry = Math.floor((Date.now() + 1000 * 60 * 60 * 24) / 1000);

    // Prepare session parameters
    const sessionParams: SessionParams = {
      allowedMethods: [{
        "Contract Address": contractAddress, 
        selector: methodSelector,
      }],
      expiry,
      publicDappKey: dappKey.publicKey,
      metaData: {
        projectID: process.env.NEXT_PUBLIC_PROJECT_ID || "invisible-wallet",
        txFees: [], // Empty array since we're using AVNU paymaster
      },
    };

    try {
      // Sign the session request with the account
      const accountSessionSignature = await account.signMessage({
        domain: {
          name: "Session",
          chainId: constants.StarknetChainId.SN_SEPOLIA,
        },
        types: {
          StarkNetDomain: [
            { name: "name", type: "felt" },
            { name: "chainId", type: "felt" },
          ],
          Session: [
            { name: "key", type: "felt" },
            { name: "expires", type: "felt" },
            { name: "root", type: "felt" },
          ],
        },
        primaryType: "Session",
        message: {
          key: dappKey.publicKey,
          expires: expiry,
          root: contractAddress,
        },
      });

      // Create the session request for future use
      const sessionRequest = createSessionRequest(
        sessionParams.allowedMethods,
        sessionParams.expiry,
        sessionParams.metaData,
        dappKey.publicKey,
      );

      // Store session in localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('No user found in localStorage');
      }

      // Update user's session data
      user.session = {
        expiry: Number(sessionParams.expiry) * 1000, // Convert to milliseconds
        wallet: 'argent',
        dappKey: dappKey.privateKey,
        publicDappKey: dappKey.publicKey,
        signature: stark.formatSignature(accountSessionSignature),
        allowedMethods: sessionParams.allowedMethods,
      };

      localStorage.setItem('user', JSON.stringify(user));

      return {
        sessionParams,
        accountSessionSignature,
        sessionRequest,
        dappKey,
      };
    } catch (error) {
      console.error('Error creating Argent session:', error);
      throw error;
    }
  }

  /**
   * Retrieves a session account if a valid session exists
   * @param provider - The RPC provider instance
   * @param address - The account address
   * @returns Session account if valid, null otherwise
   */
  static async getArgentSessionAccount(provider: RpcProvider, address: string) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.session) return null;

    const { session } = user;
    if (this.isSessionExpired(session)) {
      this.clearSession();
      return null;
    }

    // Recreate session request from stored data
    const sessionRequest = createSessionRequest(
      session.allowedMethods,
      BigInt(Math.floor(session.expiry / 1000)),
      { projectID: process.env.NEXT_PUBLIC_PROJECT_ID || "invisible-wallet" },
      session.dappKey,
    );

    try {
      // Build and return the session account
      return await buildSessionAccount({
        accountSessionSignature: session.signature,
        sessionRequest,
        chainId: constants.StarknetChainId.SN_SEPOLIA,
        provider,
        address,
        dappKey: session.dappKey,
      });
    } catch (error) {
      console.error('Error building session account:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Checks if a session has expired
   * @param session - The session object to check
   * @returns true if session has expired, false otherwise
   */
  static isSessionExpired(session: any): boolean {
    return Date.now() >= session.expiry;
  }

  /**
   * Clears the current session from localStorage
   */
  static clearSession() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      delete user.session;
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
}