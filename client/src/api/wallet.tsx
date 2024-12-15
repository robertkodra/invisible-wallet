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
  type BigNumberish,
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
import { SessionService } from "@/services/SessionService";

const options: GaslessOptions = {
  baseUrl: SEPOLIA_BASE_URL,
  apiKey: process.env.NEXT_PUBLIC_PAYMASTER_KEY,
};

const createArgentWallet = async (
  userToken: string,
  dispatch: Dispatch<AuthAction>,
  password: string
): Promise<{ success: boolean; data?: string; error?: string }> => {
  console.log("Starting Argent wallet creation...");
  
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL as string,
  });

  // Generating the private key with Stark Curve
  const privateKeyAX = stark.randomAddress();
  const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
  console.log("Generated keys - Public key:", starkKeyPubAX);

  const accountClassHash = process.env.NEXT_PUBLIC_ARGENT_CLASSHASH as string;
  console.log("Using Argent class hash:", accountClassHash);

  const axSigner = new CairoCustomEnum({ Starknet: { pubkey: starkKeyPubAX } });
  const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);

  const AXConstructorCallData = CallData.compile({
    owner: axSigner,
    guardian: axGuardian,
  });

  const contractAddress = hash.calculateContractAddressFromHash(
    starkKeyPubAX,
    accountClassHash,
    AXConstructorCallData,
    0
  );
  console.log("Calculated contract address:", contractAddress);

  const account = new Account(provider, contractAddress, privateKeyAX);

  const initialValue: Call[] = [
    {
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
      entrypoint:
        process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_GET_COUNTER?.toString() ||
        "get_counter",
      calldata: [contractAddress],
    },
  ];

  try {
    console.log("Building typed data for deployment...");
    const typeData = await fetchBuildTypedData(
      contractAddress,
      initialValue,
      undefined,
      undefined,
      options,
      accountClassHash
    );

    console.log("Signing deployment message...");
    const userSignature = await account.signMessage(typeData);

    const deploymentData: DeploymentData = {
      class_hash: accountClassHash,
      salt: starkKeyPubAX,
      unique: `${num.toHex(0)}`,
      calldata: AXConstructorCallData.map((value) => num.toHex(value)),
    };

    console.log("Executing deployment transaction...");
    const executeTransaction = await fetchExecuteTransaction(
      contractAddress,
      JSON.stringify(typeData),
      userSignature,
      options,
      deploymentData
    );

    console.log("Deployment transaction hash:", executeTransaction.transactionHash);

    console.log("Updating backend with wallet information...");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/profile/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          publicKey: contractAddress,
          privateKey: encryptPrivateKey(privateKeyAX, password),
          account: "argent",
        }),
      }
    );

    if (response.ok) {
      let user = JSON.parse(localStorage.getItem("user"));

      if (user) {
        console.log("Updating user data with new wallet...");
        user.argent_account = contractAddress;
        user.argent_public_key = starkKeyPubAX; // Store public key for session usage
        
        // Create session after successful wallet deployment
        try {
          console.log("Creating initial Argent session...");
          const sessionResult = await SessionService.createArgentSession(
            account,
            process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
            process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_INCREASE_COUNTER || "increase_counter"
          );
          
          console.log("Session created successfully:", {
            expiry: sessionResult.sessionParams?.expiry 
              ? new Date(Number(sessionResult.sessionParams.expiry) * 1000).toISOString()
              : "No expiry",
            dappKey: sessionResult.dappKey ? "Present" : "Missing"
          });

          // Re-fetch user from localStorage as it was updated by SessionService
          user = JSON.parse(localStorage.getItem("user"));
          console.log("Updated user data with session:", {
            hasSession: !!user.session,
            sessionExpiry: user.session?.expiry 
              ? new Date(user.session.expiry).toISOString()
              : "None"
          });
        } catch (sessionError) {
          console.error("Failed to create initial session:", sessionError);
          // Continue with wallet deployment even if session creation fails
        }

        localStorage.setItem("user", JSON.stringify(user));
        dispatch({ type: "LOGIN", payload: user });
        console.log("User state updated successfully");
      }

      return { success: true, data: executeTransaction.transactionHash };
    }

    throw new Error(`Failed to update profile: ${response.statusText}`);
  } catch (error) {
    console.error("Error in wallet creation:", error);
    return { success: false, error: error.message };
  }
};

const createBraavosWallet = async (
  userToken: string,
  dispatch: Dispatch<AuthAction>,
  password: string
) => {
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL as string,
  });

  // Braavos Account Class Hash
  const accountClassHash = process.env.NEXT_PUBLIC_BRAAVOS_CLASSHASH as string;

  // Calculate future address of the Braavos account
  const privateKeyBraavosBase = stark.randomAddress();
  console.log("Braavos account Private Key =", privateKeyBraavosBase);
  const starkKeyPubBraavosBase = ec.starkCurve.getStarkKey(
    privateKeyBraavosBase
  );
  console.log("Braavos account Public Key  =", starkKeyPubBraavosBase);

  type StarkPubKey = { pub_key: BigNumberish };
  const myPubKey: StarkPubKey = { pub_key: starkKeyPubBraavosBase };
  const constructorBraavosCallData = CallData.compile({
    stark_pub_key: myPubKey,
  });
  const contractAddress = hash.calculateContractAddressFromHash(
    starkKeyPubBraavosBase,
    process.env.NEXT_PUBLIC_BRAAVOS_CLASSHASH ||
      "0x0734c40a769c2da1a8fbeea1819e79a0d8c2336fc82f5c9ae0ad2038ee0ee737",
    constructorBraavosCallData,
    0
  );
  console.log("Precalculated account address=", contractAddress);

  const account = new Account(provider, contractAddress, privateKeyBraavosBase);

  const initialValue: Call[] = [
    {
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
      entrypoint:
        process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_GET_COUNTER?.toString() ||
        "get_counter",
      calldata: [contractAddress],
    },
  ];

  try {
    const typeData = await fetchBuildTypedData(
      contractAddress,
      initialValue,
      undefined,
      undefined,
      options,
      accountClassHash
    );

    const userSignature = await account.signMessage(typeData);

    // braavos v1.0.0 specific deployment signature :
    // sig[0: 1] - r,s from stark sign on txn_hash
    // sig[2] - actual impl hash - the impl hash we will replace class into
    // sig[3: n - 2] -  auxiliary data - hws public key, multisig, daily withdrawal limit etc
    // sig[n - 2] -  chain_id - guarantees aux sig is not replayed from other chain ids
    // sig[n - 1: n] -  r,s from stark sign on poseidon_hash(sig[2: n-2])

    const parsedOtherSigner = Array(9).fill(0);
    const chainId = await provider.getChainId();

    const txnHashPoseidon = hash.computePoseidonHashOnElements([
      accountClassHash,
      ...parsedOtherSigner,
      chainId,
    ]);

    const { r: rPoseidon, s: sPoseidon } = ec.starkCurve.sign(
      txnHashPoseidon,
      num.toHex(privateKeyBraavosBase)
    );

    const signature = [
      accountClassHash,
      ...parsedOtherSigner.map((e) => num.toHex(e.toString())),
      chainId.toString(),
      num.toHex(rPoseidon.toString()),
      num.toHex(sPoseidon.toString()),
    ];

    console.log("Braavos special signature =", signature);

    const deploymentData: DeploymentData = {
      class_hash: accountClassHash,
      salt: starkKeyPubBraavosBase,
      unique: `${num.toHex(0)}`,
      calldata: constructorBraavosCallData.map((value) => num.toHex(value)),
      sigdata: signature,
    };

    console.log("Braavos deployment data:", deploymentData);

    const executeTransaction = await fetchExecuteTransaction(
      contractAddress,
      JSON.stringify(typeData),
      userSignature,
      options,
      deploymentData
    );

    console.log(executeTransaction);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/profile/`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          publicKey: contractAddress,
          privateKey: encryptPrivateKey(privateKeyBraavosBase, password),
        }),
      }
    );

    if (response.ok) {
      let user = JSON.parse(localStorage.getItem("user"));

      if (user) {
        user.braavos_account = contractAddress;
        localStorage.setItem("user", JSON.stringify(user));

        dispatch({ type: "LOGIN", payload: user });
      }

      return { success: true, data: executeTransaction.transactionHash };
    }
  } catch (error) {
    console.log(error);
  }
};

export { createArgentWallet, createBraavosWallet };
