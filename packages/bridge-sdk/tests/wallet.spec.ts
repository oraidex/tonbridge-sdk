import { mnemonicNew } from "@ton/crypto";
import { describe, expect, it } from "vitest";
import { TonWalletVersion } from "../src/constants";
import { initTonWallet } from "../src/demo-utils";

describe("test-ton-wallet", () => {
  // FIXME: fix the expected ton address cases
  it.each<[TonWalletVersion, string]>([
    ["V5R1", "foobar"],
    ["V4", "hello-world"],
    ["V3R2", "yeye"],
  ])(
    "test-createTonWallet-should-return-correct-address",
    async (tonWalletVersion, expectedTonAddress) => {
      // FIXME: use a hard-coded empty mnemonic for testing here for deterministic result
      const mnemonics = await mnemonicNew();
      const tonWallet = await initTonWallet(
        mnemonics.join(" "),
        tonWalletVersion
      );
      expect(tonWallet.sender.address).not.undefined;
      expect(tonWallet.sender.address?.toString()).toEqual(expectedTonAddress);
    }
  );
});
