import TonRocks from "@oraichain/tonbridge-utils";
import { loadBlockExtra } from "@oraichain/tonbridge-utils/build/blockchain/BlockParser";
import { Cell as TonRocksCell } from "@oraichain/tonbridge-utils/build/types/Cell";
import { Address, Cell, loadTransaction } from "@ton/core";
import assert from "assert";
import "dotenv/config";
import {
  LiteClient,
  LiteEngine,
  LiteRoundRobinEngine,
  LiteSingleEngine,
} from "ton-lite-client";

function intToIP(int: number) {
  var part1 = int & 255;
  var part2 = (int >> 8) & 255;
  var part3 = (int >> 16) & 255;
  var part4 = (int >> 24) & 255;

  return part4 + "." + part3 + "." + part2 + "." + part1;
}

// verifying shard block: https://docs.ton.org/develop/data-formats/proofs#shard-block
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
  const engine: LiteEngine = new LiteRoundRobinEngine(engines);
  const client = new LiteClient({ engine });

  // Create Client
  const txCount = 2;
  const master = await client.getMasterchainInfo();
  const addr = Address.parse(
    "EQARXqu9hEzxsSP5ZdI5n3gv5XxFJQu8uPvEt0IJOwadzfA0"
  );
  const accState = await client.getAccountState(addr, master.last);
  const offset = {
    hash: accState.lastTx.hash.toString(16),
    lt: accState.lastTx.lt.toString(10),
  };
  const rawTxs = await client.getAccountTransactions(
    addr,
    offset.lt,
    Buffer.from(offset.hash, "hex"),
    txCount
  );
  assert(rawTxs.ids.length === txCount);
  const txsCells = Cell.fromBoc(rawTxs.transactions);
  assert(txsCells.length === txCount);

  const txs = Cell.fromBoc(rawTxs.transactions).map((cell, i) => ({
    tx: loadTransaction(cell.asSlice()),
    blockId: rawTxs.ids[i],
  }));

  for (let tx of txs) {
    const wantedTxHash = tx.tx.hash().toString("hex");
    console.log("wanted tx hash: ", wantedTxHash);

    const messages = tx.tx.outMessages.values();
    for (const message of messages) {
      // you can have a soft tx filter here, ignoring unrelated txs
      // console.log("message: ", message);
      if (message.info.type === "external-out") {
        //  load op-code
        // do something with your logic
      }
    }
    try {
      // it means this tx is in a shard block -> we verify shard blocks along with materchain block
      if (tx.blockId.workchain !== -1) {
        // verifyShardBlocks(tx.blockId);
      } else {
        // verifyMasterchainBlockByBlockId(tx.blockId);
      }
    } catch (error) {
      // do something here
    }

    // get the actual tx proof -> validate if our tx data is legit or not
    const txWithProof = await client.getAccountTransaction(
      addr,
      tx.tx.lt.toString(10),
      tx.blockId
    );

    const txProof = await TonRocks.types.Cell.fromBoc(txWithProof.proof);
    const txProofFirstRef: TonRocksCell = txProof[0].refs[0];
    const txProofHash = txProofFirstRef.hashes[0];

    assert(
      Buffer.from(txProofHash).toString("hex") ===
        tx.blockId.rootHash.toString("hex")
    );

    // parse block to get block transactions
    const blockExtraCell: TonRocksCell = txProofFirstRef.refs[3];
    const parsedBlockFromTxProof = loadBlockExtra(blockExtraCell, {
      cs: 0,
      ref: 0,
    });
    const accountBlocks = parsedBlockFromTxProof.account_blocks.map;
    let foundWantedTxHash = false;
    for (const entry of accountBlocks.entries()) {
      const txs = entry[1].value.transactions.map;
      for (const [_key, tx] of txs.entries()) {
        const txCell: TonRocksCell = tx.value;
        if (tx.value) {
          const txHash = Buffer.from(txCell.getHash(0)).toString("hex");
          if (txHash === wantedTxHash) foundWantedTxHash = true;
        }
      }
    }

    assert(foundWantedTxHash);
  }

  engine.close();
})();
