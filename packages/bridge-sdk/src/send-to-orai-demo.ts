import { TON_CHAIN_ID, TON_NATIVE } from "@oraichain/common";
import { toNano } from "@ton/ton";
import env from "dotenv";
import { initCosmosWallet, initTonWallet } from "./demo-utils";
import {
  calculateTimeoutTimestampTon,
  createOraichainTonBridgeHandler,
} from "./utils";
env.config();

export async function demo() {
  const oraiMnemonic = process.env.DEMO_MNEMONIC_ORAI;
  const tonMnemonic = process.env.DEMO_MNEMONIC_TON;
  const cosmosWallet = initCosmosWallet(oraiMnemonic);
  const tonWallet = await initTonWallet(tonMnemonic, "V5R1");
  const handler = await createOraichainTonBridgeHandler(
    TON_CHAIN_ID.TON_MAINNET,
    cosmosWallet,
    tonWallet
    // { tonCenterUrl: "https://toncenter.com/api/v2/jsonRPC" },
    // process.env.TON_API_KEY
  );
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
}

demo();
