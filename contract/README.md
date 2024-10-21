# Starknet's Counter Workshop

This workshop is the simple version of [Counter Workshop](https://github.com/starknet-edu/counter-workshop). If you want to learn how to create a simple Starknet smart contract, implement public functions, and events, access external contracts, and use OpenZeppelin's Ownable contract, please follow that [Full Counter Workshop](https://github.com/starknet-edu/counter-workshop).

## Contract Deployment

To deploy your account contract to Starknet's testnet using the `deploy.ts` script found in the `scripts` folder.

### Dependencies

Run the command below from the project's root folder to install the deployment script dependencies.

```bash
npm install
```

### Deployer Wallet

Create a wallet that the script can use to pay for the declaration of your account contract.

### Steps

1. Create a wallet on Starknet testnet using the [Argent X](https://www.argent.xyz/argent-x/) or [Braavos](https://braavos.app/) browser extension.
2. Fund the wallet by using the [Faucet](https://starknet-faucet.vercel.app/) or the [Bridge](https://sepolia.starkgate.starknet.io/).
3. Create a file in the project's root folder called `.env`
4. Export the private key of the funded wallet and paste it into the `.env` file using the key `DEPLOYER_PRIVATE_KEY`.

```bash
DEPLOYER_PRIVATE_KEY=<YOUR_FUNDED_TESTNET_WALLET_PRIVATE_KEY>
```

5. Export the public key of the funded wallet and paste it into the `.env` file using the key `DEPLOYER_ADDRESS`

```bash
DEPLOYER_ADDRESS=<YOUR_FUNDED_TESTNET_WALLET_PUBLIC_ADDRESS>
```

### RPC Endpoint

To successfully deploy the contract with the script on the Starknet Testnet, you will need to provide an RPC URL. For our workshop, we will use Blast's Public RPC Endpoint.

Add the following line in your `.env` file:

```bash
RPC_ENDPOINT=https://starknet-sepolia.public.blastapi.io/
```

Refer to [Blast](https://blastapi.io/public-api/starknet) to learn more about their Starknet RPC Endpoints.

### Run the Script

Run the script that will declare and deploy your smart contract on the Starknet Testnet and ensure that you adjust the constructor inputs in your `deploy.ts` file appropriately.

> **Note:** Ensure that the variable names in the `deploy.ts` constructor are the same as in the `counter.cairo` constructor function.

```typescript
const constructor = myCallData.compile("constructor", {
  initial_counter: 100,
});
```

#### Steps

1. From the project's root folder run `npm run deploy`
2. Follow the instructions from the terminal

If the script finishes successfully your smart contract is ready to be used on Starknet testnet. Congratulations!
