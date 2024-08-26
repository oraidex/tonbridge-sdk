import { GasPrice } from "@cosmjs/stargate";
import {
  calculateTimeoutTimestamp,
  CosmosChainId,
  DEFAULT_TON_CONFIG,
  TON_CHAIN_ID,
  TonChainId,
  TonConfig,
} from "@oraichain/common";
import { CosmosWallet } from "@oraichain/oraidex-common";
import {
  TonbridgeBridgeClient,
  TonbridgeBridgeInterface,
} from "@oraichain/tonbridge-contracts-sdk";
import { TonBridgeHandler } from "./bridge-handler";
import TonWallet from "./wallet";

export async function createTonBridgeHandler(
  cosmosWallet: CosmosWallet,
  tonWallet: TonWallet,
  cosmosConfig: {
    rpc: string;
    chainId: CosmosChainId;
    gasPrice?: GasPrice;
  },
  tonConfig?: {
    tonChainId?: TonChainId;
    overrideConfig?: TonConfig;
    tonCenterApiKey?: string;
  }
) {
  const configEnv = {
    ...DEFAULT_TON_CONFIG[tonConfig.tonChainId ?? TON_CHAIN_ID.TON_MAINNET],
    ...tonConfig.overrideConfig,
  };
  const { wallet: cosmosSigner, client: cosmwasmClient } =
    await cosmosWallet.getCosmWasmClient(
      {
        rpc: cosmosConfig.rpc,
        chainId: cosmosConfig.chainId,
      },
      { gasPrice: cosmosConfig.gasPrice ?? GasPrice.fromString("0.001orai") }
    );
  const accounts = await cosmosSigner.getAccounts();
  const wasmBridge = new TonbridgeBridgeClient(
    cosmwasmClient,
    accounts[0].address,
    configEnv.wasmBridgeAddress
  );

  return TonBridgeHandler.create({
    wasmBridge,
    tonBridge: configEnv.tonBridgeAddress,
    tonSender: tonWallet.sender,
    tonClientParameters: {
      endpoint: configEnv.tonCenterUrl,
      apiKey: tonConfig.tonCenterApiKey,
    },
  });
}

export function isTonbridgeBridgeClient(
  obj: TonbridgeBridgeInterface
): obj is TonbridgeBridgeClient {
  return obj instanceof TonbridgeBridgeClient;
}

/**
 *
 * @param timeout timeout difference from now to the timestamp you want in seconds. Eg: 3600
 * @param dateNow current date timestamp in millisecs
 * @returns timeout timestamps in seconds
 */
export function calculateTimeoutTimestampTon(
  timeout: number,
  dateNow?: number
) {
  const timeoutNanoSec = calculateTimeoutTimestamp(timeout, dateNow);
  return BigInt(timeoutNanoSec) / BigInt(Math.pow(10, 9));
}
