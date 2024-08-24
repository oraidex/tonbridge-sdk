import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import {
  calculateTimeoutTimestamp,
  COSMOS_CHAIN_IDS,
  DEFAULT_TON_CONFIG,
  ORAI,
  OraiCommon,
  TonChainId,
  TonConfig,
} from "@oraichain/common";
import {
  TonbridgeBridgeClient,
  TonbridgeBridgeInterface,
} from "@oraichain/tonbridge-contracts-sdk";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Sender, TonClient, WalletContractV5R1 } from "@ton/ton";
import { TonBridgeHandler } from "./bridge-handler";

export async function createOraichainTonBridgeHandler(
  tonChainId: TonChainId,
  overrideConfig?: TonConfig,
  tonCenterApiKey?: string
) {
  const configEnv = { ...DEFAULT_TON_CONFIG[tonChainId], ...overrideConfig };

  // init ton client
  const client = new TonClient({
    endpoint: configEnv.tonCenterUrl,
    apiKey: tonCenterApiKey,
  });
  const oraiMnemonic = process.env.DEMO_MNEMONIC_ORAI;
  const tonMnemonic = process.env.DEMO_MNEMONIC_TON;
  const keyPair = await mnemonicToWalletKey(tonMnemonic.split(" "));
  const wallet = WalletContractV5R1.create({
    workChain: 0,
    publicKey: keyPair.publicKey,
  });

  const contract = client.open(wallet);
  const tonSender: Sender = {
    address: contract.address,
    ...contract.sender(keyPair.secretKey),
  };

  // init cosmos client
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(oraiMnemonic, {
    prefix: ORAI,
  });
  const accounts = await signer.getAccounts();
  const rpc = (
    await OraiCommon.initializeFromGitRaw({
      chainIds: [COSMOS_CHAIN_IDS.ORAICHAIN],
    })
  ).chainInfos.cosmosChains[0].rpc;
  const cosmwasmClient = await SigningCosmWasmClient.connectWithSigner(
    rpc,
    signer,
    { gasPrice: GasPrice.fromString("0.001orai") }
  );
  const wasmBridge = new TonbridgeBridgeClient(
    cosmwasmClient,
    accounts[0].address,
    configEnv.wasmBridgeAddress
  );

  return TonBridgeHandler.create({
    wasmBridge,
    tonBridge: configEnv.tonBridgeAddress,
    tonSender: tonSender,
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

export const TON_ZERO_ADDRESS =
  "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
