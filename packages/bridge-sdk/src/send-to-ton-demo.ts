import { TON_CHAIN_ID } from "@oraichain/common";
import { toNano } from "@ton/ton";
import env from "dotenv";
import { createOraichainTonBridgeHandler, TON_ZERO_ADDRESS } from "./utils";
env.config();

export async function demo() {
  const handler = await createOraichainTonBridgeHandler(
    TON_CHAIN_ID.TON_MAINNET
  );
  // match with TonKeeper V5 address
  const tonReceiveAddress = handler.tonSender.address.toString({
    urlSafe: true,
    bounceable: false,
  });
  console.log(tonReceiveAddress);
  const result = await handler.sendToTon(
    tonReceiveAddress,
    toNano(10),
    TON_ZERO_ADDRESS
  );
  console.log(result);
}

demo();
