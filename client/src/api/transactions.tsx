import { Account, RpcProvider, Call, num, selector } from "starknet";

import {
  GaslessOptions,
  SEPOLIA_BASE_URL,
  fetchBuildTypedData,
  fetchExecuteTransaction,
} from "@avnu/gasless-sdk";
import { decryptPrivateKey } from "@/utils/encryption";

const options: GaslessOptions = {
  baseUrl: SEPOLIA_BASE_URL,
  apiKey: process.env.NEXT_PUBLIC_PAYMASTER_KEY,
};

const initialValue: Call[] = [
  {
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
    entrypoint:
      process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_INCREASE_COUNTER?.toString() ||
      "increase_counter",
    calldata: [],
  },
];

/**
 * Invokes the contract to increase the counter.
 * @param userAddress - The user's wallet address
 * @param userToken - The user's authentication token
 * @param password - The user's password for decrypting the private key
 * @returns The transaction hash if successful, null otherwise
 */
export const invokeContract = async (
  userAddress: string,
  userToken: string,
  password: string,
  wallet: string
): Promise<string | null> => {
  try {
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
      throw new Error(
        `Failed to fetch the encrypted private key: ${response.statusText}`
      );
    }

    const json = await response.json();
    const privateKeyDecrypted = decryptPrivateKey(json.privateKey, password);

    if (!privateKeyDecrypted) {
      throw new Error("Failed to decrypt private key");
    }

    // Initialising the provider
    const provider = new RpcProvider({
      nodeUrl: process.env.RPC_URL as string,
    });

    const accountAX = new Account(provider, userAddress, privateKeyDecrypted);

    // Build the type data
    const typeData = await fetchBuildTypedData(
      userAddress,
      initialValue,
      undefined,
      undefined,
      options
    );

    // Sign the message
    const userSignature = await accountAX.signMessage(typeData);

    // Execute the transaction
    const executeTransaction = await fetchExecuteTransaction(
      userAddress,
      JSON.stringify(typeData),
      userSignature,
      options
    );

    return executeTransaction.transactionHash;
  } catch (error) {
    console.error("Error invoking contract:", error);
    return null;
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
