# Invisible Wallets

## Table of Contents

- [Installation & Run](#run-from-source)
- [Motivation](#motivation)
- [Core Functionalities](#core-functionalities)
- [Future work](#future-work)
- [Contribute](#contribute)

## Requirements & Installation

### Requirements

- Install Node (>= v18.17) [(instructions)](https://nodejs.org/en/download/package-manager)
- Install asdf [(instructions)](https://asdf-vm.com/guide/getting-started.html)
- Install Scarb 2.8.5 via asdf [(instructions)](https://docs.swmansion.com/scarb/download.html#install-via-asdf)
- Install Starknet Foundry 0.33.0 via asdf [(instructions)](https://foundry-rs.github.io/starknet-foundry/getting-started/installation.html)
- Install Rust via [(instructions)](https://www.rust-lang.org/tools/install)

### Installation

#### Client Server

Install dependencies:

```
npm install
```

Run the client server:

```
npm run dev
```

#### Backend Server

Install the dependencies:

```
npm install
```

Run the backend server:

```
npm run dev
```

## Motivation

The greatest challenge for Web3 remains the onboarding of Web2 users through a seamless experience without requiring extension installations, seed-phrase backups, or gas fee payments.

Account Abstraction, which is natively supported on Starknet, solves some of these challenges and brings us closer to simplifying the process of onboarding Web2 users. However, there are still some hurdles along the way. Users typically need to install a wallet provider extension and create a wallet. Additionally, businesses face specific challenges in creating a seamless experience for their Web2 users as there isn't an out-of-the-box solution that satisfies their needs.

This is why we created Invisible Wallets, which aims to help businesses integrate a seamless experience to onboard users without installing any external extensions.

To provide such an experience, we will showcase how to create a non-custodial wallet utilizing Argent and Braavos for each user and cover their transaction fees using AVNU's Paymaster SDK.

There are several ways to handle users' private keys:

- Enable users to use passkeys and store them on their device, transforming their wallet into a hardware wallet
- Encrypt the private key client-side and store it in the database

In the next chapter, we will explain some of the core functionality of Invisible Wallets and how to implement these features.

<!-- // explain the server side encryption which we will focus on, but also you can do pass keys or other options. -->

## Core Functionalities

The solution consists of four essential components that work together to provide a seamless Web3 experience:

1. **Account Wallet Creation**

   - Creates new accounts using either Argent or Braavos implementations
   - Generates necessary cryptographic keys and account parameters
   - Precalculates the account address before deployment

2. **Gasless Wallet Deployment**

   - Leverages AVNU's Paymaster service for deployment
   - Handles all gas fees on behalf of the user
   - Manages the account deployment process

3. **Secure Private Key Management**

   - Implements client-side encryption of private keys
   - Uses AES encryption with user-provided passwords
   - Stores encrypted keys securely in the database

4. **Gasless Interaction**
   - Enables seamless interaction with Starknet smart contracts
   - Integrates AVNU's Paymaster for gasless transactions
   - Handles transaction signing and execution

Each of these functionalities is designed to work together to create a frictionless user experience.

### Account Wallet Creation

To create an account for a user, the dApp has the option to choose between Argent and Braavos.

#### Argent Account

The `createArgentWallet` function handles the creation of an Argent account on Starknet. This process involves several key steps:

1. Initialisation of variables

   In this step, we initialize the `provider` and `accountClassHash`, which will be used in subsequent steps to deploy the account and interact with it. To find Argent’s latest deployed class hashes, refer to the [account.txt](https://github.com/argentlabs/argent-contracts-starknet/blob/main/deployments/account.txt)

   ```typescript
   // Setting the options for the Paymaster
   const options: GaslessOptions = {
     baseUrl: SEPOLIA_BASE_URL,
     apiKey: process.env.NEXT_PUBLIC_PAYMASTER_KEY,
   };
   // Initialising the provider
   const provider = new RpcProvider({
     nodeUrl: process.env.RPC_URL as string,
   });
   // Using Argent X Account v0.4.0 class hash
   const accountClassHash = process.env.NEXT_PUBLIC_ARGENT_CLASSHASH as string;
   ```

2. Generating the private and public keys
   In this step, we generate the private key using the Stark curve, and then derive the corresponding public key from it.
   ```typescript
   // Generating the private key with Stark Curve
   const privateKeyAX = stark.randomAddress();
   const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
   ```
3. Account Constructor Setup
   In this step, we set up the constructor arguments, which require a `signer` and a `guardian`. Here, the dApp can designate itself as the `guardian`, enabling it to trigger an escape hatch if the user forgets the password used to encrypt their private key.

   The dApp can then initiate the recovery phase, during which the user must wait for the default security period of 7 days. This security period can be modified by calling the `set_escape_security_period()` function within the account, but this change must be authorized by both the user and the guardian. For more details, refer to the [Guardian Recovery Docs](https://github.com/argentlabs/argent-contracts-starknet/blob/main/docs/argent_account.md).

   ```typescript
   // Define the signer of the account
   const axSigner = new CairoCustomEnum({
     Starknet: { pubkey: starkKeyPubAX },
   });
   // Define the dApp Guardian Address
   const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None); // Define the dApp Guardian Address
   ```

4. Calculating the future account address:
   In this step, we can finally precalculate the contract address by providing the public key, the Argent account class hash, and the constructor arguments created in the previous steps.

   Lastly, we initialize the `account`, which will be used later to sign transactions.

   ```typescript
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

   // Initialise Account
   const account = new Account(provider, contractAddress, privateKeyAX);
   ```

#### Braavos Account

To create a Braavos account, it follows the same steps as in creating an Argent account. However, there are some differences between them and the first one is at the constructor argument where Braavos requires only the public key of the user.

Additionally Braavos has an additional argument that it passes to the constructor function namely the `sigdata` which basically accounts for setting up the features of the Braavos account namely session keys,

TODO: Description to be added.

### Gasless Wallet Deployment

AVNU supports gasless payments, also known as Paymaster, which allows a dApp to use this service and incur the fees on behalf of its users. Please refer to [AVNU's API Docs](https://doc.avnu.fi/starknet-paymaster/api-references) for more information.

#### Deploying an Argent Account

1.  Initial Transaction Setup
    The process begins by creating an initial transaction call that will be executed once the account is deployed:

    ```typescript
    // Creating the call that will be executed
    const initialValue: Call[] = [
      {
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
        entrypoint:
          process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_GET_COUNTER?.toString() ||
          "get_counter",
        calldata: [contractAddress],
      },
    ];
    ```

    This initial call is structured to:

    - Target a specific contract (defined in environment variables)
    - Call a specific entry point (in this case, get_counter)
    - Include the new account's address in the calldata

2.  Building Typed Data
    This step creates a structured representation of the transaction that follows Starknet's typing system. The typed data includes:

    - The account's address
    - The initial transaction details
    - The account's class hash
    - Additional deployment parameters

    ```typescript
    // Building the typed data from the call
    const typeData = await fetchBuildTypedData(
      contractAddress,
      initialValue,
      undefined,
      undefined,
      options,
      accountClassHash
    );
    ```

3.  Message Signing
    After receiving the type data back from AVNU's API, this is signed using the account's private key:
    ```typescript
    // Signinig the typed data message by the account
    const userSignature = await account.signMessage(typeData);
    ```
4.  Deployment Data Preparation
    In this step, we are preparing the deployment data which includes:

    - class_hash: Identifies the type of account being deployed
    - salt: Uses the public key as a unique identifier
    - unique: A hex-encoded value to ensure deployment uniqueness
    - calldata: Constructor arguments converted to hex format

    ```typescript
    // Creating the deployment data for the account

    const deploymentData: DeploymentData = {
      class_hash: accountClassHash,
      salt: starkKeyPubAX,
      unique: `${num.toHex(0)}`,
      calldata: AXConstructorCallData.map((value) => num.toHex(value)),
    };
    ```

5.  Transaction Execution
    The final step executes the deployment through a gasless service, which:

    - Deploys the account contract
    - Executes the initial transaction
    - Handles gas fees on behalf of the user
    - Returns the transaction hash for tracking

    ```typescript
    // Executing the call by using the gasless service
    const executeTransaction = await fetchExecuteTransaction(
      contractAddress,
      JSON.stringify(typeData),
      userSignature,
      options,
      deploymentData
    );
    ```

#### Deploying a Braavos Account

TODO: To be described

### Secure Private Key Management

The `encryptPrivateKey` function is responsible for encrypting a user's private key with their password before storing it. It uses the AES (Advanced Encryption Standard) algorithm from the CryptoJS library to encrypt the private key and returns the encrypted version, ensuring it can be safely stored in the database.

```typescript
export const encryptPrivateKey = (
  privateKey: string,
  password: string
): string => {
  if (!privateKey || !password) {
    throw new Error("Private key and password are required");
  }

  return CryptoJS.AES.encrypt(privateKey, password).toString();
};
```

### Gasless Interaction

The `invokeContract` function enables users to interact with smart contracts on Starknet through AVNU's Paymaster service. This process involves several key steps:

1.  Initialisation of variables

    ```typescript
    // Setting the options for the Paymaster
    const options: GaslessOptions = {
      baseUrl: SEPOLIA_BASE_URL,
      apiKey: process.env.NEXT_PUBLIC_PAYMASTER_KEY,
    };

    // Creating the call that will be executed
    const initialValue: Call[] = [
      {
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
        entrypoint:
          process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_INCREASE_COUNTER?.toString() ||
          "increase_counter",
        calldata: [],
      },
    ];

    // Setup the account for signing
    const provider = new RpcProvider({
      nodeUrl: process.env.RPC_URL as string,
    });
    ```

2.  Private Key Retrieval & Decryption

    In this step, we securely make an API call to retrieve the user's encrypted private key from the database. Once retrieved, the encrypted private key is decrypted using the `decryptPrivateKey` function, converting it back into a usable form.

    Finally, the account is initialized with the decrypted private key, enabling it to be used for signing transactions securely.

    ```typescript
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
    const privateKeyDecrypted = decryptPrivateKey(json.privateKey, password);

    // Initialise Account
    const accountAX = new Account(provider, userAddress, privateKeyDecrypted);
    ```

3.  Building Typed Data and
    This step creates a structured representation of the transaction that follows Starknet's typing system. The typed data includes:

    - The account's address
    - The initial transaction details
    - The account's class hash
    - Additional deployment parameters

    ```typescript
    // Building the typed data from the call
    const typeData = await fetchBuildTypedData(
      userAddress,
      initialValue,
      undefined,
      undefined,
      options
    );
    ```

4.  Message Signing
    After receiving the type data back from AVNU's API, this is signed using the account's private key:

    ```typescript
    // Signing the typed data message by the account
    const userSignature = await accountAX.signMessage(typeData);
    ```

5.  Transaction Execution
    The final step executes the deployment through a gasless service, which:

    - Deploys the account contract
    - Executes the initial transaction
    - Handles gas fees on behalf of the user
    - Returns the transaction hash for tracking

    ```typescript
    // Executing the call by using the gasless service
    const executeTransaction = await fetchExecuteTransaction(
      userAddress,
      JSON.stringify(typeData),
      userSignature,
      options
    );
    ```

## Future work:

TODO: To be added

## Contribute

TODO: To be added
