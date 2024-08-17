import {
  HexBinary,
  TonbridgeValidatorInterface,
} from "@oraichain/tonbridge-contracts-sdk";
import { UserFriendlyValidator } from "@oraichain/tonbridge-contracts-sdk/build/TonbridgeValidator.types";
import { ParsedBlock } from "@oraichain/tonbridge-utils";
import { LiteClient, LiteEngine } from "ton-lite-client";
import { Functions } from "ton-lite-client/dist/schema";
import { parseBlock } from "../build/common";
const data = [
  {
    a: "1",
  },
  { b: "2" },
  { a: "1" },
];

export const queryAllValidators = async (
  tonValidator: TonbridgeValidatorInterface
) => {
  let validators: UserFriendlyValidator[] = [];
  let startAfter = "";
  let valCheck = new Set();

  while (true) {
    const validatorsTemp = await tonValidator.getValidators({
      limit: 30,
      startAfter,
    });
    if (validatorsTemp.length === 0) {
      break;
    }
    validators = validators.concat(validatorsTemp);
    startAfter = validatorsTemp[validatorsTemp.length - 1].node_id;
  }

  return validators.filter((val) => {
    if (valCheck.has(val.node_id)) {
      return false;
    }
    valCheck.add(val.node_id);
    return true;
  });
};

export const queryAllValidatorCandidates = async (
  tonValidator: TonbridgeValidatorInterface
) => {
  let candidates: UserFriendlyValidator[] = [];
  let startAfter = 0;

  while (true) {
    const candidatesTemp = await tonValidator.getCandidatesForValidators({
      limit: 30,
      startAfter,
      order: 0,
    });
    if (candidatesTemp.length === 0) {
      break;
    }
    candidates = candidates.concat(candidatesTemp);
    startAfter = candidates.length;
  }
  return candidates;
};

export const queryKeyBlock = async (
  client: LiteClient,
  engine: LiteEngine,
  masterChainSeqNo: number
) => {
  let initBlockSeqno = masterChainSeqNo;
  while (true) {
    const fullBlock = await client.getFullBlock(initBlockSeqno);
    const initialBlockInformation = fullBlock.shards.find(
      (blockRes) => blockRes.seqno === initBlockSeqno
    )!;
    // get block
    const block = await engine.query(Functions.liteServer_getBlock, {
      kind: "liteServer.getBlock",
      id: {
        kind: "tonNode.blockIdExt",
        ...initialBlockInformation,
      },
    });

    const parsedBlock: ParsedBlock = await parseBlock(block);
    if (!parsedBlock.info.key_block) {
      initBlockSeqno = parsedBlock.info.prev_key_block_seqno;
      continue;
    }
    return {
      parsedBlock,
      rawBlockData: block,
      initialKeyBlockInformation: initialBlockInformation,
    };
  }
};

// source: https://keygen.sh/blog/how-to-use-hexadecimal-ed25519-keys-in-node/
export const pubkeyHexToEd25519DER = (publicKey: HexBinary) => {
  const key = Buffer.from(publicKey, "hex");

  // Ed25519's OID
  const oid = Buffer.from([0x06, 0x03, 0x2b, 0x65, 0x70]);

  // Create a byte sequence containing the OID and key
  const elements = Buffer.concat([
    Buffer.concat([
      Buffer.from([0x30]), // Sequence tag
      Buffer.from([oid.length]),
      oid,
    ]),
    Buffer.concat([
      Buffer.from([0x03]), // Bit tag
      Buffer.from([key.length + 1]),
      Buffer.from([0x00]), // Zero bit
      key,
    ]),
  ]);

  // Wrap up by creating a sequence of elements
  const der = Buffer.concat([
    Buffer.from([0x30]), // Sequence tag
    Buffer.from([elements.length]),
    elements,
  ]);

  return der;
};
