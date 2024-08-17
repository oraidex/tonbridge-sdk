import { UserFriendlyValidator } from "@oraichain/tonbridge-contracts-sdk/build/TonbridgeValidator.types";
import {
  pubkeyHexToEd25519DER,
  ValidatorSignature,
} from "@oraichain/tonbridge-utils";
import { Cell } from "@ton/core";
import { sha256 } from "@ton/crypto";
import assert from "assert";
import crypto from "crypto";
import "dotenv/config";
import {
  LiteClient,
  LiteEngine,
  LiteRoundRobinEngine,
  LiteSingleEngine,
} from "ton-lite-client";
import {
  Functions,
  liteServer_MasterchainInfo,
} from "ton-lite-client/dist/schema";
import TonWeb from "tonweb";
import { intToIP, parseBlock } from "./common";

(async () => {
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
  const engine = new LiteRoundRobinEngine(engines);
  const client = new LiteClient({ engine });
  const master = await client.getMasterchainInfo();
  let blockInfo = master.last;
  while (true) {
    // get block
    const block = await engine.query(Functions.liteServer_getBlock, {
      kind: "liteServer.getBlock",
      id: {
        kind: "tonNode.blockIdExt",
        ...blockInfo,
      },
    });

    const parsedBlock = await parseBlock(block);
    if (!parsedBlock.info.key_block) {
      const keyBlockInfo = await client.getFullBlock(
        parsedBlock.info.prev_key_block_seqno
      );
      blockInfo = {
        kind: "tonNode.blockIdExt",
        ...keyBlockInfo.shards.find(
          (shard) => shard.seqno === parsedBlock.info.prev_key_block_seqno
        ),
      };
      continue;
    }
    // next phase, verify masterchain block
    const validators = parsedBlock.extra.custom.config.config.map.get("22");
    let friendlyValidators: UserFriendlyValidator[] = [];
    for (const entry of validators.cur_validators.list.map.entries()) {
      // magic number prefix for a node id of a validator
      const nodeIdPrefix = Buffer.from([0xc6, 0xb4, 0x13, 0x48]);
      const pubkey = entry[1].public_key.pubkey;
      const nodeId = await sha256(Buffer.concat([nodeIdPrefix, pubkey]));
      friendlyValidators.push({
        ...entry[1],
        node_id: nodeId.toString("base64"),
        weight: +entry[1].weight.toString(),
        pubkey,
      });
    }
    await verifyMasterchainBlock(client, master, friendlyValidators);
    break;
  }

  engine.close();
})();

async function verifyMasterchainBlock(
  liteClient: LiteClient,
  masterchainInfo: liteServer_MasterchainInfo,
  validators: UserFriendlyValidator[]
) {
  const blockHeader = await liteClient.getBlockHeader(masterchainInfo.last);
  const blockHash = Cell.fromBoc(blockHeader.headerProof)[0].refs[0].hash(0);
  assert(blockHash.toString("hex") === blockHeader.id.rootHash.toString("hex"));

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
      node_id: sig.node_id_short,
      r,
      s,
    };
  });

  // sort and get the largest top 100 validator weights
  // this is because in TON, when validating a block, only at most 100 validators participated in a pool of 300+ validators
  const sumLargestTotalWeights = validators
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 100)
    .map((val) => val.weight)
    .reduce((prev, cur) => prev + cur);

  const message = Buffer.concat([
    // magic prefix of message signing
    Buffer.from([0x70, 0x6e, 0x0b, 0xc5]),
    blockHash,
    blockHeader.id.fileHash,
  ]);

  let totalWeight = 0;
  for (const item of vdata) {
    const validator = validators.find((val) => val.node_id === item.node_id);
    if (!validator) continue;
    const signature = Buffer.concat([item.r, item.s]);
    const key = pubkeyHexToEd25519DER(validator.pubkey);
    const verifyKey = crypto.createPublicKey({
      format: "der",
      type: "spki",
      key,
    });
    const result = crypto.verify(null, message, verifyKey, signature);
    assert(result === true);
    totalWeight += validator.weight;
  }
  assert(totalWeight > 0);
  assert(totalWeight * 3 > sumLargestTotalWeights * 2);
  console.log("Verified successfully!");
}
