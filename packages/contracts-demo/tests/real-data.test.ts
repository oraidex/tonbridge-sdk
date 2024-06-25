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
import { ValidatorSignature } from "@oraichain/tonbridge-utils";
import {
  LiteClient,
  LiteEngine,
  LiteRoundRobinEngine,
  LiteSingleEngine,
} from "ton-lite-client";
import { liteServer_masterchainInfoExt } from "ton-lite-client/dist/schema";
import TonWeb from "tonweb";
import { intToIP } from "../src/common";
import {
  queryAllValidatorCandidates,
  queryAllValidators,
  queryKeyBlock,
} from "./common";

describe("Real Ton data tests", () => {
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

  let masterchainInfo: liteServer_masterchainInfoExt;
  let initialVerifiedRootHash: string;
  let initialKeyBlockBoc: string = ""; // in hex form
  let initialKeyBlockSeqNo = 38125645; // the seqno of the boc hardcoded in @oraichain/tonbridge-utils/blockParserLarge.ts

  beforeAll(async function () {
    // setup lite engine server
    const { liteservers } = await fetch(
      "https://ton.org/global.config.json"
    ).then((data) => data.json());

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

    masterchainInfo = await liteClient.getMasterchainInfoExt();
    const { rawBlockData, initialKeyBlockInformation } = await queryKeyBlock(
      liteClient,
      liteEngine,
      masterchainInfo.last.seqno
    );
    initialKeyBlockSeqNo = initialKeyBlockInformation.seqno;
    initialKeyBlockBoc = rawBlockData.data.toString("hex");
    initialVerifiedRootHash = rawBlockData.id.rootHash.toString("hex");

    // deploy contracts
    const validatorDeployResult = await deployContract(
      client,
      sender,
      { boc: initialKeyBlockBoc },
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

  it("after parse validator set contract the initital block should be verified", async () => {
    expect(
      await validator.isVerifiedBlock({ rootHash: initialVerifiedRootHash })
    ).toEqual(true);
    let validators = (await queryAllValidators(validator))
      .filter((validator) => validator.c_type !== 0)
      .map((validator) => ({
        ...validator,
        node_id: "0x" + validator.node_id,
        pubkey: "0x" + validator.pubkey,
      }));

    console.log("validators length: ", validators.length);

    expect(validators.length).toBeGreaterThan(300);
    validators = (await queryAllValidatorCandidates(validator)).filter(
      (validator) => validator.c_type !== 0
    );
    expect(validators.length).toEqual(0);
  });

  it("Verify a block using validator signatures in new block real data", async () => {
    const tonweb = new TonWeb();
    const valSignatures = (await tonweb.provider.send(
      "getMasterchainBlockSignatures",
      {
        seqno: masterchainInfo.last.seqno,
      }
    )) as any;
    const signatures = valSignatures.signatures as ValidatorSignature[];
    const vdata = signatures.map((sig) => {
      const signatureBuffer = Buffer.from(sig.signature, "base64");
      const r = signatureBuffer.subarray(0, 32);
      const s = signatureBuffer.subarray(32);
      return {
        node_id: Buffer.from(sig.node_id_short, "base64").toString("hex"),
        r: r.toString("hex"),
        s: s.toString("hex"),
      };
    });

    const blockHeader = await liteClient.getBlockHeader(masterchainInfo.last);
    await validator.verifyMasterchainBlockByValidatorSignatures({
      blockHeaderProof: blockHeader.headerProof.toString("hex"),
      fileHash: masterchainInfo.last.fileHash.toString("hex"),
      vdata,
    });

    expect(
      await validator.isVerifiedBlock({
        rootHash: masterchainInfo.last.rootHash.toString("hex"),
      })
    ).toEqual(true);

    // candidates now should be empty because we the list has been verified
    const validators = (await queryAllValidatorCandidates(validator)).filter(
      (validator) => validator.c_type !== 0
    );
    expect(validators.length).toEqual(0);
  }, 20000);

  it("Verify updated validator signatures in new block real data", async () => {
    const blockToCheck = initialKeyBlockSeqNo - 1;
    const {
      parsedBlock,
      rawBlockData,
      initialKeyBlockInformation: blockId,
    } = await queryKeyBlock(liteClient, liteEngine, blockToCheck);
    const boc = rawBlockData.data.toString("hex");

    await validator.prepareNewKeyBlock({ keyblockBoc: boc });

    const tonweb = new TonWeb();
    const valSignatures = (await tonweb.provider.send(
      "getMasterchainBlockSignatures",
      {
        seqno: blockId.seqno,
      }
    )) as any;
    const signatures = valSignatures.signatures as ValidatorSignature[];
    const vdata = signatures.map((sig) => {
      const signatureBuffer = Buffer.from(sig.signature, "base64");
      const r = signatureBuffer.subarray(0, 32);
      const s = signatureBuffer.subarray(32);
      return {
        node_id: Buffer.from(sig.node_id_short, "base64").toString("hex"),
        r: r.toString("hex"),
        s: s.toString("hex"),
      };
    });

    await validator.verifyKeyBlock({
      rootHash: rawBlockData.id.rootHash.toString("hex"),
      fileHash: rawBlockData.id.fileHash.toString("hex"),
      vdata,
    });

    for (let i = 0; i < signatures.length; i++) {
      expect(
        await validator.isSignedByValidator({
          validatorNodeId: vdata[i].node_id,
          rootHash: rawBlockData.id.rootHash.toString("hex"),
        })
      ).toEqual(true);
    }
    expect(
      await validator.isVerifiedBlock({
        rootHash: rawBlockData.id.rootHash.toString("hex"),
      })
    ).toEqual(true);

    let validators = (await queryAllValidators(validator)).filter(
      (validator) => validator.c_type !== 0
    );
    expect(validators.length).toBeGreaterThan(1000);

    // candidates now should be empty because we the list has been verified
    validators = (await queryAllValidatorCandidates(validator)).filter(
      (validator) => validator.c_type !== 0
    );

    expect(validators.length).toEqual(0);
  }, 200000);
});
