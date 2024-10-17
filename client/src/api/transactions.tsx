import { Account, RpcProvider, Call, num } from "starknet";

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
    contractAddress:
      "0x51fde0f43ddd951ab883d2736427a0c6fd96fe4d9b13f7c54cbfce8c1a5a325",
    entrypoint: "increase_counter",
    calldata: [],
  },
];

const invokeContract = async (
  userAddress: string,
  userToken: string,
  password: string
): Promise<string | null | undefined> => {
  // get private key
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/profile/privatekey`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
    }
  );
  const json = await response.json();
  const privateKeyDecrypted = decryptPrivateKey(json.privateKey, password);

  console.log(userAddress);

  // setup the account
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL as string,
  });

  const accountAX = new Account(provider, userAddress, privateKeyDecrypted);

  try {
    // build the type data
    const typeData = await fetchBuildTypedData(
      userAddress,
      initialValue,
      undefined,
      undefined,
      options
    );

    // sign the message
    const userSignature = await accountAX.signMessage(typeData);

    // execute
    const executeTransaction = await fetchExecuteTransaction(
      userAddress,
      JSON.stringify(typeData),
      userSignature,
      options
    );

    console.log("Increased counter successfully! ");
    return executeTransaction.transactionHash;
  } catch (error) {
    console.log(error);
  }
};

const getCounterValue = async (): Promise<number> => {
  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL ||
    "https://free-rpc.nethermind.io/sepolia-juno/";

  const requestBody = {
    jsonrpc: "2.0",
    method: "starknet_call",
    id: 1,
    params: [
      {
        contract_address:
          "0x51fde0f43ddd951ab883d2736427a0c6fd96fe4d9b13f7c54cbfce8c1a5a325",
        entry_point_selector:
          "0x03370263ab53343580e77063a719a5865004caff7f367ec136a6cdd34b6786ca",
        calldata: [],
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

export { invokeContract, getCounterValue };
