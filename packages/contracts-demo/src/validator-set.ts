import "dotenv/config";
import {
  LiteClient,
  LiteEngine,
  LiteRoundRobinEngine,
  LiteSingleEngine,
} from "ton-lite-client";
import { Functions } from "ton-lite-client/dist/schema";
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
    console.log(
      "parsed block: ",
      parsedBlock.extra.custom.config.config.map.get("22")
    );
    break;
  }

  engine.close();
})();
