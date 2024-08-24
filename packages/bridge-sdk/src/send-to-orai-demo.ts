import { toAmount, TON_CHAIN_ID, TON_NATIVE } from "@oraichain/common";
import { toNano } from "@ton/ton";
import env from "dotenv";
import {
  calculateTimeoutTimestampTon,
  createOraichainTonBridgeHandler,
} from "./utils";
env.config();

export async function demo() {
  const handler = await createOraichainTonBridgeHandler(
    TON_CHAIN_ID.TON_MAINNET
    // { tonCenterUrl: "https://toncenter.com/api/v2/jsonRPC" },
    // process.env.TON_API_KEY
  );
  await handler.sendToCosmos(
    handler.wasmBridge.sender,
    toAmount(3, 9),
    TON_NATIVE,
    {
      queryId: 0,
      value: toNano(0), // dont care
    },
    calculateTimeoutTimestampTon(3600)
  );
}

demo();
