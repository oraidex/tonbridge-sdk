# TON Bridge SDK

<p align="center" width="100%">
  <br />
   <a href="https://github.com/oraichain/tonbridge-sdk/blob/master/LICENSE"><img height="20" src="https://img.shields.io/badge/License-GNU%20GPL-blue.svg"></a>
   <a href="https://www.npmjs.com/package/@oraichain/tonbridge-sdk"><img height="20" src="https://img.shields.io/github/package-json/v/oraichain/tonbridge-sdk?filename=packages%tonbridge-sdk%2Fpackage.json"></a>
</p>

An SDK that helps developers integrate the TON Bridge into their favorite applications, enabling cross chain universal swaps for tokens between TON and other networks.

## Features

- 🚀 Cross-chain token bridge & swap from / to TON to / from Bitoin, EVM & Cosmos based networks.
- 🍰 Simple demos & tutorials on how to create cross-chain bridge & swap using `TonBridgeHandler`.

## Quick start ✈️

### Install dependencies

Firstly, we need to install the dependencies and build the package:

```bash
# Install dependencies
yarn

# build
yarn build
```

### Setup env

Since we will be creating cross-chain transactions using the SDK, we need to import a wallet. For simplicity, we use `.env` file with the following keys: `DEMO_MNEMONIC_ORAI` & `DEMO_MNEMONIC_TON`.

You need to create a `.env` file at the bridge-sdk/ directory with the content like this:

```sh
DEMO_MNEMONIC_ORAI=foo bar
DEMO_MNEMONIC_TON=hello world
```

### Run the demos

You can try running a demo script to bridge TON from Oraichain to TON:

```sh
yarn workspace @oraichain/tonbridge-sdk orai-to-ton-demo
```

## SDK deep dive

### TON -> Cosmos

```ts
const handler = await createTonBridgeHandler(cosmosWallet, tonWallet, {
  rpc: cosmosRpc,
  chainId: COSMOS_CHAIN_IDS.ORAICHAIN,
});
```

First, we initialize the `TonBridgeHandler` by calling the `createTonBridgeHandler` method. It takes several arguments:

- `cosmosWallet`: an instance implementing the `CosmosWallet` interface from the `@oraichain/oraidex-common` package. This interface does not depend on the JavaScript runtime environment -> Browsers and Node.js applications can implement it easily. A simple Node.js implementation can be found [here](./src/demo-utils.ts)

- `tonWallet`: an instance of the `TonWallet` class. You can use the static function `TonWallet.createTonWallet`

Next, we simply create a `sendToCosmos` function to send TON tokens to Oraichain:

```ts
await handler.sendToCosmos(
  handler.wasmBridge.sender,
  toNano(3),
  TON_NATIVE,
  {
    queryId: 0,
    value: toNano(0), // dont care
  },
  calculateTimeoutTimestampTon(3600)
);
```

you can replace `TON_NATIVE` with TON tokens that the protocol supports.

### Cosmos -> TON

For transactions bridging tokens from Cosmos chains -> TON, the SDK exposes a static helper function: `TonBridgeHandler.buildSendToTonEncodeObjects` that builds the bridge messages as `EncodeObject[]` so that these messages can be used in conjunction with other cosmos messages.
