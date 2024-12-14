import {
  SignSessionError,
  SessionParams,
  openSession,
  buildSessionAccount,
  createSessionRequest,
  DappKey,
  OffChainSession
} from "@argent/x-sessions";
import { Account, constants, ec, RpcProvider, stark } from "starknet";

export class SessionService {
  private static SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static async createArgentSession(
    account: Account, 
    contractAddress: string, 
    methodSelector: string
  ) {
    console.log("Creating Argent session with params:", {
      contractAddress,
      methodSelector,
      accountAddress: account.address
    });

    // Generate private key and create DappKey object
    const privateKey = ec.starkCurve.utils.randomPrivateKey();
    const dappKey: DappKey = {
      privateKey,
      publicKey: ec.starkCurve.getStarkKey(privateKey)
    };
    
    console.log("Created DappKey:", {
      privateKeyType: typeof dappKey.privateKey,
      publicKeyType: typeof dappKey.publicKey,
      publicKey: dappKey.publicKey
    });

    const expiry = Math.floor((Date.now() + 1000 * 60 * 60 * 24) / 1000) as any;
    console.log("EXPIRY TYPE:", typeof expiry);

    const sessionParams: SessionParams = {
      allowedMethods: [
        {
          "Contract Address": contractAddress, 
          selector: methodSelector
        }
      ],
      expiry: expiry,
      publicDappKey: dappKey.publicKey,
      metaData: {
        projectID: process.env.NEXT_PUBLIC_PROJECT_ID || "invisible-wallet",
        txFees: []
      }
    };

    try {
        console.log('inicia el try')
        console.log('account: ', account)
        console.log('account type', typeof account)

      // Sign the session request directly with the account
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
      console.log('paso openSession')
      console.log('expiry ',sessionParams.expiry)
      console.log('type expiry', typeof expiry)

      const sessionRequest = createSessionRequest(
        sessionParams.allowedMethods,
        sessionParams.expiry,
        sessionParams.metaData,
        dappKey.publicKey,
      );

      console.log('paso create session')

      // Store session in user data
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('No user found in localStorage');
      }

      user.session = {
        expiry: Number(sessionParams.expiry) * 1000,
        wallet: 'argent',
        dappKey: dappKey.privateKey,
        publicDappKey: dappKey.publicKey,
        signature: stark.formatSignature(accountSessionSignature),
        allowedMethods: sessionParams.allowedMethods
      };

      localStorage.setItem('user', JSON.stringify(user));

      return {
        sessionParams,
        accountSessionSignature,
        sessionRequest,
        dappKey
      };
    } catch (error) {
      console.error('Error creating Argent session:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
      throw error;
    }
  }

  static async getArgentSessionAccount(provider: RpcProvider, address: string) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.session) return null;

    const { session } = user;
    if (this.isSessionExpired(session)) {
      this.clearSession();
      return null;
    }

    const sessionRequest = createSessionRequest(
      session.allowedMethods,
      BigInt(Math.floor(session.expiry / 1000)),
      { projectID: process.env.NEXT_PUBLIC_PROJECT_ID || "invisible-wallet" },
      session.dappKey
    );

    try {
      return await buildSessionAccount({
        accountSessionSignature: session.signature,
        sessionRequest,
        chainId: constants.StarknetChainId.SN_SEPOLIA,
        provider,
        address,
        dappKey: session.dappKey
      });
    } catch (error) {
      console.error('Error building session account:', error);
      this.clearSession();
      return null;
    }
  }

  static isSessionExpired(session: any): boolean {
    return Date.now() >= session.expiry;
  }

  static clearSession() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      delete user.session;
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
}