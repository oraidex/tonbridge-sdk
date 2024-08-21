import { toAmount, TON_CHAIN_ID } from "@oraichain/common";
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
    // { tonCenterUrl: "https://toncenter.com/api/v2/jsonRPC" }
  );
  const result = await handler.sendToCosmos(
    "orai1g4h64yjt0fvzv5v2j8tyfnpe5kmnetejvfgs7g",
    toAmount(2, 9),
    "ton",
    {
      queryId: 0,
      value: toNano(0), // dont care
    },
    calculateTimeoutTimestampTon(3600)
  );
  console.log(result);
}

demo();
