import { decryptPrivateKey } from "@/utils/encryption";
import { SessionService } from "@/services/SessionService";
import {
  fetchBuildTypedData,
  fetchExecuteTransaction,
  type GaslessOptions,
  SEPOLIA_BASE_URL,
} from "@avnu/gasless-sdk";
import { Account, RpcProvider, constants, num, selector } from "starknet";
import { toast } from "react-toastify";

const options: GaslessOptions = {
  baseUrl: SEPOLIA_BASE_URL,
  apiKey: process.env.NEXT_PUBLIC_PAYMASTER_KEY,
};

/**
 * Invokes the contract to increase the counter using either session or password.
 * @param userAddress - The user's wallet address
 * @param userToken - The user's authentication token
 * @param password - Optional password for non-session transactions
 * @param wallet - The wallet type ('argent' or 'braavos')
 * @returns The transaction hash if successful, null otherwise
 */
export const invokeContract = async (
  userAddress: string,
  userToken: string,
  password: string | null,
  wallet: "argent" | "braavos"
): Promise<string | null> => {
  try {
    const provider = new RpcProvider({
      nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://starknet-sepolia.public.blastapi.io",
    });

    // Try to get session account first
    if (wallet === "argent") {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log("Session check:", {
        walletAddress: userAddress,
        hasSession: !!user?.session,
        wallet,
        sessionWallet: user?.session?.wallet
      });

      if (user?.session?.wallet === wallet) {
        const sessionAccount = await SessionService.getArgentSessionAccount(
          provider, 
          userAddress
        );
        
        if (sessionAccount) {
          console.log("Using session for transaction");
          const tx = await sessionAccount.execute({
            contractAddress: user.session.allowedMethods[0]["Contract Address"],
            entrypoint: "increase_counter",
            calldata: []
          });
          return tx.transaction_hash;
        }
      }
    }

    // If we get here, we need a password
    if (!password) {
      throw new Error("Password required for transaction");
    }

    // Fetch the encrypted private key
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/profile/${wallet}/privatekey`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch private key");
    }

    const json = await response.json();
    const privateKeyDecrypted = decryptPrivateKey(json.privateKey, password);

    if (!privateKeyDecrypted) {
      throw new Error("Failed to decrypt private key");
    }

    // Create regular account instance
    const account = new Account(provider, userAddress, privateKeyDecrypted);

    // Build type data for AVNU's paymaster
    const contractCall = {
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
      entrypoint: process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_INCREASE_COUNTER || "increase_counter",
      calldata: []
    };

    const typeData = await fetchBuildTypedData(
      userAddress,
      [contractCall],
      undefined,
      undefined,
      options
    );

    // Sign and execute transaction
    const userSignature = await account.signMessage(typeData);

    const executeTransaction = await fetchExecuteTransaction(
      userAddress,
      JSON.stringify(typeData),
      userSignature,
      options
    );

    // If this was an Argent wallet, create a new session after successful transaction
    if (wallet === "argent") {
      try {
        await SessionService.createArgentSession(
          account,
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
          process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_INCREASE_COUNTER || "increase_counter",
          json.publicKey
        );
        toast.success("Created new session for future transactions");
      } catch (error) {
        console.error("Failed to create session:", error);
        // Don't throw - transaction was still successful
      }
    }

    return executeTransaction.transactionHash;
  } catch (error) {
    console.error("Error invoking contract:", error);
    throw error;
  }
};

/**
 * Retrieves the current counter value from the contract.
 * @returns The current counter value, or 0 if an error occurs
 */
export const getCounterValue = async (userAddress: string): Promise<number> => {
  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL ||
    "https://free-rpc.nethermind.io/sepolia-juno/";

  const requestBody = {
    jsonrpc: "2.0",
    method: "starknet_call",
    id: 1,
    params: [
      {
        contract_address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
        entry_point_selector: selector.getSelectorFromName(
          process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_GET_COUNTER?.toString() ||
            "get_counter"
        ),
        calldata: [userAddress],
      },
      "latest",
    ],
  };

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    const newCounterValue = num.hexToDecimalString(data.result[0]);

    return Number(newCounterValue);
  } catch (error) {
    console.error("Error calling starknet function:", error);
    return 0;
  }
};