import { TON_CHAIN_ID } from "@oraichain/common";
import { toNano } from "@ton/ton";
import env from "dotenv";
import { TON_ZERO_ADDRESS } from "./constants";
import { initCosmosWallet, initTonWallet } from "./demo-utils";
import { createOraichainTonBridgeHandler } from "./utils";
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
  // match with TonKeeper V5 address
  const tonReceiveAddress = handler.tonSender.address.toString({
    urlSafe: true,
    bounceable: false,
  });
  console.log(tonReceiveAddress);
  const result = await handler.sendToTon(
    tonReceiveAddress,
    toNano(5),
    TON_ZERO_ADDRESS
  );
  console.log(result);
}

demo();
