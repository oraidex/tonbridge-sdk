import { GasPrice } from "@cosmjs/stargate";
import {
  calculateTimeoutTimestamp,
  COSMOS_CHAIN_IDS,
  DEFAULT_TON_CONFIG,
  OraiCommon,
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

export async function createOraichainTonBridgeHandler(
  tonChainId: TonChainId,
  cosmosWallet: CosmosWallet,
  tonWallet: TonWallet,
  overrideConfig?: TonConfig,
  tonCenterApiKey?: string
) {
  const configEnv = { ...DEFAULT_TON_CONFIG[tonChainId], ...overrideConfig };

  // init ton client
  const rpc = (
    await OraiCommon.initializeFromGitRaw({
      chainIds: [COSMOS_CHAIN_IDS.ORAICHAIN],
    })
  ).chainInfos.cosmosChains[0].rpc;
  const { wallet: cosmosSigner, client: cosmwasmClient } =
    await cosmosWallet.getCosmWasmClient(
      {
        rpc,
        chainId: "Oraichain",
      },
      { gasPrice: GasPrice.fromString("0.001orai") }
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
      apiKey: tonCenterApiKey,
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
