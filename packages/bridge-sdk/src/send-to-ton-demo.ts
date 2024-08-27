import { COSMOS_CHAIN_IDS, OraiCommon } from "@oraichain/common";
import { toNano } from "@ton/ton";
import env from "dotenv";
import { TON_ZERO_ADDRESS } from "./constants";
import { initCosmosWallet, initTonWallet } from "./demo-utils";
import { createTonBridgeHandler } from "./utils";
env.config();

export async function demo() {
  const oraiMnemonic = process.env.DEMO_MNEMONIC_ORAI;
  const tonMnemonic = process.env.DEMO_MNEMONIC_TON;
  const cosmosWallet = initCosmosWallet(oraiMnemonic);
  const tonWallet = await initTonWallet(tonMnemonic, "V5R1");
  const cosmosRpc = (
    await OraiCommon.initializeFromGitRaw({
      chainIds: [COSMOS_CHAIN_IDS.ORAICHAIN],
    })
  ).chainInfos.cosmosChains[0].rpc;
  const handler = await createTonBridgeHandler(
    cosmosWallet,
    tonWallet,
    { rpc: cosmosRpc, chainId: COSMOS_CHAIN_IDS.ORAICHAIN }
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
    toNano(3),
    TON_ZERO_ADDRESS
  );
  console.log(result);
}

demo();
