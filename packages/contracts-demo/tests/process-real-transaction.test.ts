import { SimulateCosmWasmClient } from "@oraichain/cw-simulate";
import { toAmount } from "@oraichain/oraidex-common";
import { OraiswapTokenClient } from "@oraichain/oraidex-contracts-sdk";
import {
  InstantiateMsg as Cw20InstantiateMsg,
  MinterResponse,
} from "@oraichain/oraidex-contracts-sdk/build/OraiswapToken.types";
import { deployContract } from "@oraichain/tonbridge-contracts-build";
import {
  TonbridgeBridgeClient,
  TonbridgeBridgeTypes,
  TonbridgeValidatorClient,
} from "@oraichain/tonbridge-contracts-sdk";
import { Address } from "@ton/core";
import {
  LiteClient,
  LiteEngine,
  LiteRoundRobinEngine,
  LiteSingleEngine,
} from "ton-lite-client";
import { Functions } from "ton-lite-client/dist/schema";
import { afterAll, beforeAll, describe, it } from "vitest";
import { intToIP } from "../src/common";

describe("Process real transaction tests", () => {
  const client = new SimulateCosmWasmClient({
    chainId: "Oraichain",
    bech32Prefix: "orai",
    metering: true,
  });
  const sender = "orai12zyu8w93h0q2lcnt50g3fn0w3yqnhy4fvawaqz";
  let liteClient: LiteClient;
  let liteEngine: LiteEngine;
  let validator: TonbridgeValidatorClient;
  let bridge: TonbridgeBridgeClient;
  let dummyToken: OraiswapTokenClient;

  beforeAll(async function () {
    // setup lite engine server
    const { liteservers } = await fetch(
      "https://ton.org/global.config.json"
    ).then((data) => data.json());
    // Personal choice. Can choose a different index if needed

    const engines: LiteEngine[] = [];
    engines.push(
      ...liteservers.map(
        (server: any) =>
          new LiteSingleEngine({
            host: `tcp://${intToIP(server.ip)}:${server.port}`,
            publicKey: Buffer.from(server.id.key, "base64"),
          })
      )
    );
    liteEngine = new LiteRoundRobinEngine(engines);
    liteClient = new LiteClient({ engine: liteEngine });

    // deploy contracts
    const validatorDeployResult = await deployContract(
      client,
      sender,
      { boc: undefined },
      "bridge-validator",
      "cw-tonbridge-validator"
    );
    const bridgeDeployResult = await deployContract(
      client,
      sender,
      {
        bridge_adapter: "EQAE8anZidQFTKcsKS_98iDEXFkvuoa1YmVPxQC279zAoV7R",
        relayer_fee_token: {
          native_token: {
            denom: "orai",
          },
        },
        token_fee_receiver: "token_fee",
        relayer_fee_receiver: "relayer_fee",
        swap_router_contract: "router",
        validator_contract_addr: validatorDeployResult.contractAddress,
      } as TonbridgeBridgeTypes.InstantiateMsg,
      "bridge-bridge",
      "cw-tonbridge-bridge"
    );
    const dummyTokenDeployResult = await deployContract(
      client,
      sender,
      {
        decimals: 6,
        initial_balances: [
          { address: sender, amount: toAmount(10000).toString() },
        ],
        name: "Dummy Token",
        symbol: "DUMMY",
        mint: {
          minter: bridgeDeployResult.contractAddress,
        } as MinterResponse,
      } as Cw20InstantiateMsg,
      "dummy-token",
      "oraiswap-token"
    );

    validator = new TonbridgeValidatorClient(
      client,
      sender,
      validatorDeployResult.contractAddress
    );
    bridge = new TonbridgeBridgeClient(
      client,
      sender,
      bridgeDeployResult.contractAddress
    );
    dummyToken = new OraiswapTokenClient(
      client,
      sender,
      dummyTokenDeployResult.contractAddress
    );

    // FIXME: change denom & channel id to correct denom and channel id
    await bridge.updateMappingPair({
      denom: "",
      localAssetInfo: { token: { contract_addr: dummyToken.contractAddress } },
      localChannelId: "",
      localAssetInfoDecimals: 6,
      remoteDecimals: 6,
      opcode:
        "0000000000000000000000000000000000000000000000000000000000000001",
    });
  }, 100000);

  afterAll(() => {
    liteEngine.close();
  });

  it("bridge contract reads real data from masterchain block's transaction", async () => {
    // check if our wanted shard blocks have been verified or not. If not then we verify them
    const isVerified = await validator.isVerifiedBlock({
      rootHash:
        "0299328dbd84b0ece362aec8cb04f89f7f21b1908dd55542ae9983914d81b7d1",
    });
    // verify necessary masterchain and shard blocks so that we can verify our tx
    if (!isVerified) {
      const shardInfo = await liteClient.lookupBlockByID({
        seqno: 43884169,
        shard: "2000000000000000",
        workchain: 0,
      });
      const shardProof = await liteEngine.query(
        Functions.liteServer_getShardBlockProof,
        {
          kind: "liteServer.getShardBlockProof",
          id: {
            kind: "tonNode.blockIdExt",
            ...shardInfo.id,
          },
        }
      );
      const mcBlockRootHash = shardProof.masterchainId.rootHash.toString("hex");
      // assume that the masterchain block is already verified by validator signatures
      await validator.setVerifiedBlock({
        rootHash: mcBlockRootHash,
        seqNo: shardProof.masterchainId.seqno,
      });
      await validator.verifyShardBlocks({
        mcBlockRootHash: mcBlockRootHash,
        shardProofLinks: shardProof.links.map((link) =>
          link.proof.toString("hex")
        ),
      });
    }
    const addressRaw = "UQAQw3YLaG2HvvH1xaJehyAaJ--PX4gFxi70NwC1p_b4nISf";
    const result = await fetch(
      `https://toncenter.com/api/v3/transactions?account=${addressRaw}&limit=100&offset=0&sort=desc`
    ).then((data) => data.json());
    const { block_ref, mc_block_seqno, hash, lt } = result.transactions.find(
      (tx) => {
        return (
          Buffer.from(tx.hash, "base64").toString("hex") ===
          "25d1ed22d37fa5ec44b4426f00f33ee3f59e527e8252b9da266172d342c0f5fd"
        );
      }
    );
    const shardInfo = await liteClient.lookupBlockByID(block_ref);
    // PROVE TX MATCHES THE TX WE EXPECT AND IT IS IN OUR VALIDATED SHARD BLOCK
    const transaction = await liteClient.getAccountTransaction(
      Address.parse(addressRaw),
      lt,
      shardInfo.id
    );
    const response = await bridge.readTransaction({
      txBoc: transaction.transaction.toString("hex"),
      txProof: transaction.proof.toString("hex"),
    });
    console.dir(response, { depth: null });
  }, 100000);
});
