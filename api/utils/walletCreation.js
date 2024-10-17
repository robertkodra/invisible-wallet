const {
  Account,
  ec,
  RpcProvider,
  hash,
  CallData,
  CairoOption,
  CairoOptionVariant,
  CairoCustomEnum,
  num,
  json,
} = require("starknet");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const createWallet = async (req, res) => {
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL,
  });

  const argentXaccountClassHash = process.env.ARGENT_CLASSHASH;

  // const privateKeyAX = stark.randomAddress();
  const privateKeyAX =
    "0x6fc5eb49842c02c9e7a451c486f5346ac34137a234bf5967b8cedc025721b48";
  console.log("AX_ACCOUNT_PRIVATE_KEY=", privateKeyAX);
  const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
  console.log("AX_ACCOUNT_PUBLIC_KEY=", starkKeyPubAX);

  // Calculate future address of the ArgentX account
  const axSigner = new CairoCustomEnum({ Starknet: { pubkey: starkKeyPubAX } });
  const axGuardian = new CairoOption(CairoOptionVariant.None);
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

  const deploymentData = {
    classHash: argentXaccountClassHash,
    constructorCalldata: AXConstructorCallData,
    contractAddress: AXcontractAddress,
    addressSalt: starkKeyPubAX,
  };

  const buildTypeData = {
    userAddress: deploymentData.contractAddress,
    calls: [
      {
        contractAddress:
          "0x51fde0f43ddd951ab883d2736427a0c6fd96fe4d9b13f7c54cbfce8c1a5a325",
        entrypoint: "increase_counter",
        calldata: [],
      },
    ],
    accountClassHash: deploymentData.classHash,
  };
  const headers = {
    "Content-Type": "application/json",
    "api-key": `${process.env.PAYMASTER_KEY}`,
  };

  console.log(buildTypeData);

  try {
    const result = await axios.post(
      `https://sepolia.api.avnu.fi/paymaster/v1/build-typed-data`,
      buildTypeData,
      { headers }
    );
    // return res.status(200).json({ message });
    if (result.status === 200) {
      console.log("Build Type Data successfull");
      const userSignature = await accountAX.signMessage(result.data);
      const userSignatureString = [
        num.toHexString(userSignature.r),
        num.toHexString(userSignature.s),
        // num.toHexString(userSignature.recovery) // Not needed
      ];

      const executeData = {
        userAddress: deploymentData.contractAddress,
        typedData: JSON.stringify(result.data),
        signature: userSignatureString,
        deploymentData: {
          class_hash: deploymentData.classHash,
          salt: deploymentData.addressSalt,
          unique: `${num.toHex(0)}`,
          calldata: deploymentData.constructorCalldata.map((value) =>
            num.toHex(value)
          ),
        },
      };

      console.log(userSignature);

      console.log(executeData);
      const executeResult = await axios.post(
        `https://sepolia.api.avnu.fi/paymaster/v1/execute`,
        executeData,
        { headers }
      );

      return res.status(200).json({ transactionHash: executeResult.data });
    } else {
      console.log("HERE2");
      console.log("Internal error when building typeData");
      return res.status(400).json({ error: "BuildTypeData failed" });
    }
  } catch (error) {
    console.log("HERE3");
    console.log(error);
    return res.status(500).json({ error: error });
  }
};
