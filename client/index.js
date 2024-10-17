import {
  Account,
  ec,
  json,
  stark,
  RpcProvider,
  hash,
  CallData,
} from "starknet";

// connect provider
// const provider = new RpcProvider({ nodeUrl: `${myNodeUrl}` });
const provider = new RpcProvider({
  nodeUrl: `https://starknet-sepolia.public.blastapi.io`,
});
// 0x032612545afa27bb26cae46b25d86c98dbad47f0fc1b361a0c8a17c642149436
//new Argent X account v0.3.0
const argentXaccountClassHash =
  "0x1a736d6ed154502257f02b1ccdf4d9d1089f80811cd6acad48e6b6a9d1f2003";

// Generate public and private key pair.
// const privateKeyAX = stark.randomAddress();
const privateKeyAX =
  "0x20819c67885139214554541841e4290df26e93a8e159c588c401db2d5e746b5";
console.log(privateKeyAX);
console.log("AX_ACCOUNT_PRIVATE_KEY=", privateKeyAX);
const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
console.log("AX_ACCOUNT_PUBLIC_KEY=", starkKeyPubAX);

// Calculate future address of the ArgentX account
const AXConstructorCallData = CallData.compile({
  owner: starkKeyPubAX,
  guardian: "0",
});

const AXcontractAddress = hash.calculateContractAddressFromHash(
  starkKeyPubAX,
  argentXaccountClassHash,
  AXConstructorCallData,
  0
);
console.log("Precalculated account address=", AXcontractAddress);

const accountAX = new Account(provider, AXcontractAddress, privateKeyAX);

const deployAccountPayload = {
  classHash: argentXaccountClassHash,
  constructorCalldata: AXConstructorCallData,
  contractAddress: AXcontractAddress,
  addressSalt: starkKeyPubAX,
};

const { transaction_hash: AXdAth, contract_address: AXcontractFinalAddress } =
  await accountAX.deployAccount(deployAccountPayload);
console.log("✅ ArgentX wallet deployed at:", AXcontractFinalAddress);
