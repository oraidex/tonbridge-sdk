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
  TonbridgeValidatorTypes,
} from "@oraichain/tonbridge-contracts-sdk";
import { Cell } from "@ton/core";
import { beforeAll, describe, expect, it } from "vitest";
import { queryAllValidatorCandidates, queryAllValidators } from "./common";
import {
  data,
  findBoc,
  initialValidatorsBlockRootHash,
  initialValidatorsList,
  updateValidators,
  updateValidatorsRootHash,
} from "./data/transaction-1";

describe("Tree of Cells parser tests 1", () => {
  const client = new SimulateCosmWasmClient({
    chainId: "Oraichain",
    bech32Prefix: "orai",
  });
  const sender = "orai12zyu8w93h0q2lcnt50g3fn0w3yqnhy4fvawaqz";
  let validator: TonbridgeValidatorClient;
  let bridge: TonbridgeBridgeClient;
  let dummyToken: OraiswapTokenClient;

  beforeAll(async function () {
    // deploy contracts
    const validatorDeployResult = await deployContract(
      client,
      sender,
      {
        boc: findBoc("set-validators").toString("hex"),
      } as TonbridgeValidatorTypes.InstantiateMsg,
      "bridge-validator",
      "cw-tonbridge-validator"
    );
    const cells = Cell.fromBoc(findBoc("set-validators"));
    const firstCell = Uint8Array.from(cells[0].hash(0));
    console.log("first cell hash: ", firstCell);
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
      opcode:
        "0000000000000000000000000000000000000000000000000000000000000002",
      denom: "",
      localAssetInfo: { token: { contract_addr: dummyToken.contractAddress } },
      localChannelId: "",
      localAssetInfoDecimals: 6,
      remoteDecimals: 6,
    });
  });

  it("Should throw an error when use wrong boc for parseCandidatesRootBlock", async () => {
    const boc = findBoc("state-hash");
    try {
      await validator.prepareNewKeyBlock({ keyblockBoc: boc.toString("hex") });
      expect(false);
    } catch (error) {
      expect(true);
    }
  });

  it("after init contract the initital block should be verified", async () => {
    expect(
      await validator.isVerifiedBlock({
        rootHash: initialValidatorsBlockRootHash,
      })
    ).toEqual(true);
    let validators = (await queryAllValidators(validator))
      .filter((validator) => validator.c_type !== 0)
      .map((validator) => ({
        ...validator,
        node_id: "0x" + validator.node_id,
        pubkey: "0x" + validator.pubkey,
      }));

    validators.forEach((validator) => {
      const item = initialValidatorsList.find(
        (v) => v.node_id === validator.node_id
      );
      expect(item).not.toBeUndefined();
      expect(validator.pubkey).toEqual(item?.pubkey);
    });

    validators = (await queryAllValidatorCandidates(validator)).filter(
      (validator) => validator.c_type !== 0
    );
    expect(validators.length).toEqual(0);
  });

  it("Verify updated validator signatures in new block", async () => {
    const boc = findBoc("proof-validators");
    await validator.prepareNewKeyBlock({ keyblockBoc: boc.toString("hex") });

    let validators = (await queryAllValidatorCandidates(validator))
      .filter((validator) => validator.c_type !== 0)
      .map((validator) => ({
        ...validator,
        node_id: "0x" + validator.node_id,
        pubkey: "0x" + validator.pubkey,
      }));

    expect(validators.length).toEqual(14);

    validators.forEach((validator) => {
      const item = updateValidators.find(
        (v) => v.node_id === validator.node_id
      );
      expect(item).not.toBeUndefined();
      expect(validator.pubkey).toEqual(item?.pubkey);
    });

    const signatures = data.find((el) => el.type === "proof-validators")!
      .signatures!;

    await validator.verifyKeyBlock({
      rootHash:
        "0000000000000000000000000000000000000000000000000000000000000000",
      fileHash: data.find((el) => el.type === "proof-validators")!.id!.fileHash,
      vdata: signatures,
    });

    for (let i = 0; i < signatures.length; i++) {
      expect(
        await validator.isSignedByValidator({
          validatorNodeId: signatures[i].node_id,
          rootHash: updateValidatorsRootHash,
        })
      ).toEqual(true);
    }
    expect(
      await validator.isVerifiedBlock({ rootHash: updateValidatorsRootHash })
    ).toEqual(true);

    validators = (await queryAllValidatorCandidates(validator))
      .filter((validator) => validator.c_type !== 0)
      .map((validator) => ({
        ...validator,
        node_id: "0x" + validator.node_id,
        pubkey: "0x" + validator.pubkey,
      }));

    validators.forEach((validator) => {
      const item = updateValidators.find(
        (v) =>
          v.node_id.toLocaleLowerCase() ===
          validator.node_id.toLocaleLowerCase()
      );
      expect(item).not.toBeUndefined();
      expect(validator.pubkey).toEqual(item?.pubkey);
    });

    // candidates now should be empty because we the list has been verified
    validators = (await queryAllValidatorCandidates(validator)).filter(
      (validator) => validator.c_type !== 0
    );

    expect(validators.length).toEqual(0);
  });
});
