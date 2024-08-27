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

You can try running a demo script to bridge TON from / to Oraichain to / from TON:

```sh
# Oraichain to TON
yarn workspace @oraichain/tonbridge-sdk orai-to-ton-demo
# TON to Oraichain
yarn workspace @oraichain/tonbridge-sdk ton-to-orai-demo
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

For transactions bridging tokens from Cosmos chains -> TON, the SDK exposes a helper function: `TonBridgeHandler().buildSendToTonEncodeObjects` that builds the bridge messages as `EncodeObject[]` so that these messages can be used in conjunction with other cosmos messages.

```ts
async buildSendToTonEncodeObjects(
    tonRecipient: string,
    amount: bigint,
    tokenDenomOnTon: string,
    timeoutTimestamp: bigint = BigInt(calculateTimeoutTimestampTon(3600))
  ) {
  let pair: PairQuery;
  try {
    pair = await this.wasmBridge.pairMapping({ key: tokenDenomOnTon });
  } catch (error) {
    throw new Error("Pair mapping not found");
  }
  const localDenom = parseAssetInfo(pair.pair_mapping.asset_info);
  const instruction = this.buildSendToTonExecuteInstruction(
    tonRecipient,
    amount,
    tokenDenomOnTon,
    localDenom,
    timeoutTimestamp
  );
  return getEncodedExecuteContractMsgs(this.wasmBridge.sender, [instruction]);
  }
```

if you prefer using multiple cosmwasm messages in the form of `ExecuteInstruction`, you can use the `buildSendToTonExecuteInstruction` helper function:

```ts
buildSendToTonExecuteInstruction(
  tonRecipient: string,
  amount: bigint,
  tokenDenomOnTon: string,
  localDenom: string,
  timeoutTimestamp: bigint = BigInt(calculateTimeoutTimestampTon(3600))
) {
  // cw20 case
  if (!isNative(localDenom)) {
    const executeInstruction: ExecuteInstruction = {
      contractAddress: localDenom,
      msg: {
        send: {
          amount: amount.toString(),
          contract: this.wasmBridge.contractAddress,
          msg: toBinary({
            bridge_to_ton: {
              denom: tokenDenomOnTon,
              timeout: Number(timeoutTimestamp),
              to: tonRecipient,
            },
          } as TonbridgeBridgeTypes.ExecuteMsg),
        },
      } as Cw20BaseTypes.ExecuteMsg,
    };
    return executeInstruction;
  }
  const executeInstruction: ExecuteInstruction = {
    contractAddress: this.wasmBridge.contractAddress,
    msg: {
      bridge_to_ton: {
        denom: tokenDenomOnTon,
        timeout: Number(timeoutTimestamp),
        to: tonRecipient,
      },
    } as TonbridgeBridgeTypes.ExecuteMsg,
    funds: coins(amount.toString(), localDenom),
  };
  return executeInstruction;
}
```

You can also simply call the `sendToTon` method if you simply want to bridge a supported token on Oraichain to TON:

```ts
const handler = await createTonBridgeHandler(cosmosWallet, tonWallet, {
  rpc: cosmosRpc,
  chainId: COSMOS_CHAIN_IDS.ORAICHAIN,
});
const tonReceiveAddress = handler.tonSender.address.toString({
  urlSafe: true,
  bounceable: false,
});
console.log(tonReceiveAddress);
const result = await handler.sendToTon(
  tonReceiveAddress,
  toNano(3),
  TON_ZERO_ADDRESS
);
```

The `cosmosWallet` and `tonWallet` are initialized similarly to the [TON -> Cosmos section](#ton---cosmos).
