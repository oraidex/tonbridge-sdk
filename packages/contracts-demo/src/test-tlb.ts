import { OutMsgBody } from "@oraichain/tonbridge-utils";
import { Builder } from "@ton/core";

const testTlb = () => {
  const builderFn = OutMsgBody.storeSendPacketTimeoutOutMsgBody({
    kind: "SendPacketTimeoutOutMsgBody",
    seq: 1,
  });
  let builder = new Builder();
  builderFn(builder);
  let slice = builder.asSlice();
  let seq = OutMsgBody.loadSendPacketTimeoutOutMsgBody(slice);
  console.log(seq);
};

testTlb();
