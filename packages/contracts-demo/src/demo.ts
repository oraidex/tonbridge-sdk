import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { ORAI } from "@oraichain/oraidex-common";
import { TonbridgeValidatorClient } from "@oraichain/tonbridge-contracts-sdk";

(async () => {
  const signer = await DirectSecp256k1HdWallet.fromMnemonic(
    process.env.MNEMONIC,
    { prefix: ORAI }
  );
  const sender = (await signer.getAccounts())[0];
  const client = await SigningCosmWasmClient.connectWithSigner(
    "https://rpc.orai.io",
    signer,
    { gasPrice: GasPrice.fromString("0.001" + ORAI) }
  );
  const tonValidatorAddress =
    "orai16crw7g2rcvuga7vlnyxgwtdxtan46k8qqjjwhjqdjvjgk96n95es35q8vm";
  const validator = new TonbridgeValidatorClient(
    client,
    sender.address,
    tonValidatorAddress
  );

  await validator.updateOwner({ newOwner: tonValidatorAddress });
})();
