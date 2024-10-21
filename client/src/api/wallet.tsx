import { Dispatch } from "react";
import {
  Account,
  ec,
  stark,
  RpcProvider,
  hash,
  Call,
  CallData,
  CairoOption,
  CairoOptionVariant,
  CairoCustomEnum,
  num,
  selector,
} from "starknet";
import {
  GaslessOptions,
  SEPOLIA_BASE_URL,
  fetchBuildTypedData,
  DeploymentData,
  fetchExecuteTransaction,
} from "@avnu/gasless-sdk";

import { AuthAction } from "@/context/AuthContext";
import { encryptPrivateKey } from "@/utils/encryption";

const options: GaslessOptions = {
  baseUrl: SEPOLIA_BASE_URL,
  apiKey: process.env.NEXT_PUBLIC_PAYMASTER_KEY,
};

const createWallet = async (
  userToken: string,
  dispatch: Dispatch<AuthAction>,
  password: string
): Promise<{ success: boolean; data?: string; error?: string }> => {
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL as string,
  });

  // Private key Stark Curve
  const privateKeyAX = stark.randomAddress();
  const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);

  //Argent X Account v0.4.0
  const argentXaccountClassHash = process.env
    .NEXT_PUBLIC_ARGENT_CLASSHASH as string;

  // Calculate future address of the ArgentX account
  const axSigner = new CairoCustomEnum({ Starknet: { pubkey: starkKeyPubAX } });
  const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);
  const AXConstructorCallData = CallData.compile({
    owner: axSigner,
    guardian: axGuardian,
  });
  const AXcontractAddress = hash.calculateContractAddressFromHash(
    starkKeyPubAX,
    argentXaccountClassHash,
    AXConstructorCallData,
    0
  );

  const accountAX = new Account(provider, AXcontractAddress, privateKeyAX);

  const initialValue: Call[] = [
    {
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
      entrypoint:
        process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_GET_COUNTER?.toString() ||
        "get_counter",
      calldata: [AXcontractAddress],
    },
  ];

  try {
    const typeData = await fetchBuildTypedData(
      AXcontractAddress,
      initialValue,
      undefined,
      undefined,
      options,
      argentXaccountClassHash
    );

    const userSignature = await accountAX.signMessage(typeData);

    const deploymentData: DeploymentData = {
      class_hash: argentXaccountClassHash,
      salt: starkKeyPubAX,
      unique: `${num.toHex(0)}`,
      calldata: AXConstructorCallData.map((value) => num.toHex(value)),
    };

    const executeTransaction = await fetchExecuteTransaction(
      AXcontractAddress,
      JSON.stringify(typeData),
      userSignature,
      options,
      deploymentData
    );

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/profile/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          publicKey: AXcontractAddress,
          privateKey: encryptPrivateKey(privateKeyAX, password),
        }),
      }
    );

    if (response.ok) {
      // update local storage with public_key
      let user = JSON.parse(localStorage.getItem("user"));

      if (user) {
        user.public_key = AXcontractAddress;
        localStorage.setItem("user", JSON.stringify(user));

        dispatch({ type: "LOGIN", payload: user });
      }

      return { success: true, data: executeTransaction.transactionHash };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to update profile",
      };
    }
  } catch (error: any) {
    console.log(error);
    console.error("Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
};

export { createWallet };
