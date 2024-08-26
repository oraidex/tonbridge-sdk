import { getHttpEndpoint, Network } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "@ton/crypto";
import {
  Address,
  beginCell,
  OpenedContract,
  Sender,
  storeStateInit,
  TonClient,
  WalletContractV3R2,
  WalletContractV4,
  WalletContractV5R1,
} from "@ton/ton";
import { TonConnectUI } from "@tonconnect/ui-react";
import * as dotenv from "dotenv";
import { MAIN_WORKCHAIN, SLEEP_TIME, TonWalletVersion } from "./constants";
dotenv.config();

export default class TonWallet {
  private constructor(
    public readonly tonClient: TonClient,
    public readonly sender: Sender,
    public readonly walletContract: OpenedContract<
      WalletContractV3R2 | WalletContractV4 | WalletContractV5R1
    >
  ) {}

  async waitSeqno(seqno: number) {
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      console.log("waiting for transaction to confirm...");
      await new Promise((resolve) =>
        setTimeout(resolve, SLEEP_TIME.WAIT_SEQNO)
      );
      currentSeqno = await this.walletContract.getSeqno();
    }
    console.log("transaction confirmed!");
  }

  static async createTonWallet(
    tonWalletVersion: TonWalletVersion,
    {
      mnemonic,
      tonConnector,
    }: { mnemonic: string[]; tonConnector?: TonConnectUI } = {
      mnemonic: process.env.WALLET_MNEMONIC?.split(" "),
    },
    { workchain, network }: { workchain: number; network: Network } = {
      workchain: MAIN_WORKCHAIN,
      network: "mainnet",
    }
  ) {
    const endpoint = await getHttpEndpoint({ network });
    const client = new TonClient({ endpoint });
    if (!mnemonic && tonConnector) {
      throw new Error(
        "Need at least mnemonic or TonConnector to initialize the TON Wallet"
      );
    }
    let tonSender: Sender;
    let tonPublicKey: Buffer;
    let tonSecretKey: Buffer;
    if (mnemonic) {
      const { publicKey, secretKey } = await this.getWalletFromMnemonic(
        mnemonic
      );
      tonPublicKey = publicKey;
      tonSecretKey = secretKey;
    }
    // TODO: double check the sender & address returned by wallet connector
    if (tonConnector) {
      const { sender, account } = this.getWalletFromConnector(tonConnector);
      if (!account.publicKey)
        throw new Error("TonConnector account does not have public key!");
      tonSender = sender;
      tonPublicKey = Buffer.from(account.publicKey, "base64");
    }
    if (!tonPublicKey) throw new Error("TON public key is null");
    const wallet = this.createWalletContract(
      tonWalletVersion,
      tonPublicKey,
      workchain
    );

    const walletContract = client.open(wallet);
    if (tonSecretKey) {
      tonSender = {
        address: walletContract.address,
        ...walletContract.sender(tonSecretKey),
      };
    }
    return new TonWallet(client, tonSender, walletContract);
  }

  private static createWalletContract(
    tonWalletVersion: TonWalletVersion,
    publicKey: Buffer,
    workchain: number = MAIN_WORKCHAIN
  ) {
    let wallet: WalletContractV5R1 | WalletContractV4 | WalletContractV3R2 =
      WalletContractV4.create({
        publicKey,
        workchain,
      });
    switch (tonWalletVersion) {
      case "V3R2":
        wallet = WalletContractV3R2.create({
          publicKey,
          workchain,
        });
        break;
      case "V5R1":
        wallet = WalletContractV5R1.create({
          workChain: workchain,
          publicKey,
        });
      default:
        break;
    }
    return wallet;
  }

  private static async getWalletFromMnemonic(mnemonic: string[]) {
    if (!mnemonic) {
      throw new Error("Mnemonic is not set");
    }
    const key = await mnemonicToWalletKey(mnemonic);
    return key;
  }

  private static getWalletFromConnector(connector: TonConnectUI) {
    const sender = this.getSenderFromConnector(connector);
    return { sender, account: connector.account };
  }

  private static getSenderFromConnector(connector: TonConnectUI): Sender {
    return {
      send: async (args) => {
        let initCell = args.init
          ? beginCell().storeWritable(storeStateInit(args.init)).endCell()
          : undefined;
        await connector.sendTransaction({
          validUntil: Date.now() + 5 * 60 * 1000,
          messages: [
            {
              address: args.to.toString({ bounceable: args.bounce }),
              amount: args.value.toString(),
              stateInit: initCell?.toBoc()?.toString("base64"),
              payload: args.body?.toBoc()?.toString("base64"),
            },
          ],
        });
      },
      address: Address.parse(connector.account.address),
    };
  }
}
