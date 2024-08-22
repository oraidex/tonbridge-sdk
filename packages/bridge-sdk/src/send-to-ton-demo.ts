import { toAmount, TON_CHAIN_ID } from "@oraichain/common";
import env from "dotenv";
import { createOraichainTonBridgeHandler, TON_ZERO_ADDRESS } from "./utils";
env.config();

export async function demo() {
  const handler = await createOraichainTonBridgeHandler(
    TON_CHAIN_ID.TON_MAINNET
  );
  const result = await handler.sendToTon(
    "UQB0PhtEaJYc94Yku1h7sRubS9Y_6Avdyx5sBuEfpEIb3G__",
    toAmount(7, 9),
    TON_ZERO_ADDRESS
  );
  console.log(result);
}

demo();
