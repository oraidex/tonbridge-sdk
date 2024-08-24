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