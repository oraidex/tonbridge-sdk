import { describe, expect, it } from "vitest";
import { TonWalletVersion } from "../src/constants";
import { initTonWallet } from "../src/demo-utils";

describe("test-ton-wallet", () => {
  // FIXME: fix the expected ton address cases
  it.each<[TonWalletVersion, string]>([
    ["V5R1", "UQDCVS5-w5KEO2VpBFL92sRshBUanse8ECU-mcyTtmLvxNL4"],
    ["V4", "UQDcC4b7Rcg1pFdE9i2NfLLdta1jVBbPtyk9KNOyo7v5AQxs"],
    ["V3R2", "UQADd9TWo7iV_gjHiZIn5Rd6pMCWH84W3xBXpYE7rFf2nbGM"],
  ])(
    "test-TonWallet.create-should-return-correct-address",
    async (tonWalletVersion, expectedTonAddress) => {
      // MNEMONIC for TEST CASE ONLY. DO NOT USE!!!
      const mnemonic =
        "monkey found drop image matrix begin announce arrow tape scissors only beyond donate emerge win coffee announce culture result multiply crazy cattle kitchen fury";
      // const mnemonics = await mnemonicNew();
      const tonWallet = await initTonWallet(mnemonic, tonWalletVersion);
      expect(tonWallet.sender.address).not.undefined;
      expect(tonWallet.sender.address?.toString({ bounceable: false })).toEqual(
        expectedTonAddress
      );
    }
  );
});
