import {
  buildSessionAccount,
  createSessionRequest,
  type DappKey,
  type SessionParams,
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
        // Create numeric object from Uint8Array
        const privateKeyObj = {};
        for (let i = 0; i < privateKey.length; i++) {
            privateKeyObj[i] = privateKey[i];
        }
    
   
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
        expiry: expiry * 1000,  // Convert to milliseconds when storing
        wallet: 'argent',
        dappKey: privateKeyObj,
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
   *
  static async getArgentSessionAccount(provider: RpcProvider, address: string) {
    try {
      console.log('=== START getArgentSessionAccount ===');
      
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('User:', JSON.stringify(user, null, 2));

      if (!user?.session) {
        console.log('No session found in user data');
        return null;
      }

      const { session } = user;
      console.log('Session:', JSON.stringify(session, null, 2));

      if (this.isSessionExpired(session)) {
        console.log('Session has expired');
        return null;
      }

      // Log each step
      console.log('Step 1: Creating DappKey');
      const dappKey: DappKey = {
        privateKey: session.dappKey,
        publicKey: session.publicDappKey,
      };

      console.log('Step 2: Creating session request');
      const sessionRequest = createSessionRequest(
        session.allowedMethods,
        Math.floor(session.expiry / 1000),  // Convert back to seconds for request
        {
          projectID: process.env.NEXT_PUBLIC_PROJECT_ID || "invisible-wallet",
          txFees: [],
        },
        dappKey.publicKey,
      );

      console.log('Step 3: Building session account');
      const sessionAccount = await buildSessionAccount({
        accountSessionSignature: session.signature,
        sessionRequest,
        chainId: constants.StarknetChainId.SN_SEPOLIA,
        provider,
        address,
        dappKey,
      });

      console.log('Step 4: Session account built successfully');
      return sessionAccount;

    } catch (error) {
      console.error('=== ERROR in getArgentSessionAccount ===');
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      return null;
    } finally {
      console.log('=== END getArgentSessionAccount ===');
    }
  }
*/

static async getArgentSessionAccount(provider: RpcProvider, address: string) {
  try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.session) {
          console.log('No session found');
          return null;
      }

      const { session } = user;
      
      // Debug log the session data
      console.log('Session data:', {
          dappKeyType: typeof session.dappKey,
          dappKey: session.dappKey
      });

      if (this.isSessionExpired(session)) return null;

      // Convert the numeric object to Uint8Array
      let privateKeyBytes: Uint8Array;
      try {
          // Check if dappKey is an object
          if (session.dappKey && typeof session.dappKey === 'object') {
              // Convert the numeric object to array
              const keyArray = new Uint8Array(32); // Assuming 32 bytes key
              for (let i = 0; i < 32; i++) {
                  keyArray[i] = session.dappKey[i] || 0;
              }
              privateKeyBytes = keyArray;
              
              // Debug log
              console.log('Converted privateKeyBytes:', {
                  length: privateKeyBytes.length,
                  bytes: Array.from(privateKeyBytes)
              });
          } else {
              throw new Error(`Invalid dappKey format: ${typeof session.dappKey}`);
          }
      } catch (error) {
          console.error('Error processing dappKey:', error);
          throw error;
      }

      const dappKey: DappKey = {
          privateKey: privateKeyBytes,
          publicKey: session.publicDappKey
      };

      // Debug log
      console.log('DappKey created:', {
          hasPrivateKey: !!dappKey.privateKey,
          privateKeyLength: dappKey.privateKey.length,
          publicKey: dappKey.publicKey
      });

      const sessionRequest = createSessionRequest(
          session.allowedMethods,
          Math.floor(session.expiry / 1000),
          {
              projectID: process.env.NEXT_PUBLIC_PROJECT_ID || "invisible-wallet",
              txFees: [],
          },
          dappKey.publicKey
      );

      const sessionAccount = await buildSessionAccount({
          accountSessionSignature: session.signature,
          sessionRequest,
          chainId: constants.StarknetChainId.SN_SEPOLIA,
          provider,
          address,
          dappKey,
      });

      return sessionAccount;
  } catch (error) {
      console.error('Error in getArgentSessionAccount:', error);
      throw error;
  }
}

  /**
   * Checks if a session has expired
   * @param session - The session object to check
   * @returns true if session has expired, false otherwise
   */
  static isSessionExpired(session: any): boolean {
    console.log('Checking expiry:', {
      now: Date.now(),
      sessionExpiry: session.expiry,
      hasExpired: Date.now() >= session.expiry,
      difference: (session.expiry - Date.now()) / 1000 / 60, // minutes remaining
    });
    return Date.now() >= session.expiry;  // Both in milliseconds
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

interface StoredSession {
  expiry: number;
  wallet: 'argent';
  dappKey: string;  // Hex string
  publicDappKey: string;
  signature: string[];
  allowedMethods: Array<{
    'Contract Address': string;
    selector: string;
  }>;
}