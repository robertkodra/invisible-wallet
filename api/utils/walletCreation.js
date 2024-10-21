// Wallet Creation on the back-end (NOT USED)
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
} = require("starknet");
const axios = require("axios");

const createWallet = async (req, res) => {
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL,
  });

  const argentXaccountClassHash = process.env.ARGENT_CLASSHASH;

  const privateKeyAX = stark.randomAddress();
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
        contractAddress: process.env.CONTRACT_ADDRESS,
        entrypoint: process.env.CONTRACT_ENTRY_POINT,
        calldata: [],
      },
    ],
    accountClassHash: deploymentData.classHash,
  };
  const headers = {
    "Content-Type": "application/json",
    "api-key": process.env.PAYMASTER_KEY,
  };

  try {
    const result = await axios.post(
      `${process.env.PAYMASTER_URL}/paymaster/v1/build-typed-data`,
      buildTypeData,
      { headers }
    );

    if (result.status === 200) {
      console.log("Build Type Data successfull");
      const userSignature = await accountAX.signMessage(result.data);
      const userSignatureString = [
        num.toHexString(userSignature.r),
        num.toHexString(userSignature.s),
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

      const executeResult = await axios.post(
        `${process.env.PAYMASTER_URL}/paymaster/v1/execute`,
        executeData,
        { headers }
      );

      return res.status(200).json({ transactionHash: executeResult.data });
    } else {
      console.log("Internal error when building typeData");
      return res.status(400).json({ error: "BuildTypeData failed" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
};
