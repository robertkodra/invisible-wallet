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
} from "starknet";
import {
  GaslessOptions,
  SEPOLIA_BASE_URL,
  fetchBuildTypedData,
  DeploymentData,
  fetchExecuteTransaction,
} from "@avnu/gasless-sdk";
import { Dispatch } from "react";
import { AuthAction } from "../context/AuthContext";
import { encryptPrivateKey } from "@/utils/encryption";

const options: GaslessOptions = {
  baseUrl: SEPOLIA_BASE_URL,
  apiKey: process.env.NEXT_PUBLIC_PAYMASTER_KEY,
};
const initialValue: Call[] = [
  {
    contractAddress:
      "0x51fde0f43ddd951ab883d2736427a0c6fd96fe4d9b13f7c54cbfce8c1a5a325",
    entrypoint: "get_counter",
    calldata: [],
  },
];

const createWallet = async (
  userToken: string,
  dispatch: Dispatch<AuthAction>,
  password: string
): Promise<string | null | undefined> => {
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL as string,
  });

  const privateKeyAX = stark.randomAddress();
  console.log("AX account Private Key =", privateKeyAX);
  const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
  console.log("AX account Public Key  =", starkKeyPubAX);

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
  console.log("Precalculated account address=", AXcontractAddress);

  const accountAX = new Account(provider, AXcontractAddress, privateKeyAX);

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

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        publicKey: AXcontractAddress,
        privateKey: encryptPrivateKey(privateKeyAX, password),
      }),
    });

    // update local storage with public_key
    let user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      user.public_key = AXcontractAddress;
      localStorage.setItem("user", JSON.stringify(user));

      dispatch({ type: "LOGIN", payload: user });
    }

    return executeTransaction.transactionHash;
  } catch (error: any) {
    console.log("Error:", error);
  }
};

export { createWallet };
