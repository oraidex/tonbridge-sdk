# tonbridge-sdk

## Overview

This package is an SDK that helps developers integrate the TON Bridge into their favorite applications, enabling cross chain universal swaps for tokens between TON and other networks

## Features

- Cross-chain token bridge & swap from / to TON to / from Bitoin, EVM & Cosmos based networks.
- Simple demos & tutorials on how to create cross-chain bridge & swap using `TonBridgeHandler`.

## Quick start

### Install dependencies

Firstly, we need to install the dependencies and build the package:

```bash
# Install dependencies
yarn

# build
yarn build
```

### Setup env

Since we will be creating cross-chain transactions using the SDK, we need to import a wallet. For simplicity, we use `.env` file with the key: `DEMO_MNEMONIC`.

You need to create a `.env` file at the bridge-sdk/ directory with the content like this:

```sh
DEMO_MNEMONIC=foo bar
```

### Run the demos

You can try running a demo script to bridge TON from Oraichain to TON:

```sh
yarn workspace @oraichain/tonbridge-sdk orai-to-ton-demo
```