import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import {
  COSMOS_CHAIN_IDS,
  DEFAULT_TON_CONFIG,
  ORAI,
  OraiCommon,
  TON_CHAIN_ID,
  TonChainId,
  TonConfig,
} from "@oraichain/common";
import { TonbridgeBridgeClient } from "@oraichain/tonbridge-contracts-sdk";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { TonClient, WalletContractV4 } from "@ton/ton";
import env from "dotenv";
import { TonBridgeHandler } from "./bridge-handler";
env.config();

export async function demo() {
  const handler = await createOraichainTonBridgeHandler(
    TON_CHAIN_ID.TON_MAINNET
  );
  const result = await handler.sendToTon(
    "UQB0PhtEaJYc94Yku1h7sRubS9Y_6Avdyx5sBuEfpEIb3G__",
    2n,
    "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
  );
  console.log(result);
}

demo();

export async function createOraichainTonBridgeHandler(
  tonChainId: TonChainId,
  overrideConfig?: TonConfig,
  tonCenterApiKey?: string
) {
  const configEnv = { ...DEFAULT_TON_CONFIG[tonChainId], ...overrideConfig };

  // init ton client
  const client = new TonClient({
    endpoint: configEnv.tonCenterUrl,
  });
  const mnemonic = process.env.DEMO_MNEMONIC;
  const keyPair = await mnemonicToPrivateKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });
  const contract = client.open(wallet);
  const tonSender = contract.sender(keyPair.secretKey);

  // init cosmos client
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(
    process.env.DEMO_MNEMONIC,
    { prefix: ORAI }
  );
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
