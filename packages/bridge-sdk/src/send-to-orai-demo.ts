import { COSMOS_CHAIN_IDS, OraiCommon, TON_NATIVE } from "@oraichain/common";
import { toNano } from "@ton/ton";
import env from "dotenv";
import { initCosmosWallet, initTonWallet } from "./demo-utils";
import { calculateTimeoutTimestampTon, createTonBridgeHandler } from "./utils";
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
  console.log("finished")
}

demo();
