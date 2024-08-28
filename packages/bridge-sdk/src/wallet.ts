import { getHttpEndpoint, Network } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "@ton/crypto";
import {
  Address,
  beginCell,
  Sender,
  storeStateInit,
  TonClient,
  WalletContractV3R2,
  WalletContractV4,
  WalletContractV5R1,
} from "@ton/ton";
import { TonConnectUI } from "@tonconnect/ui";
import * as dotenv from "dotenv";
import { MAIN_WORKCHAIN, SLEEP_TIME, TonWalletVersion } from "./constants";
import { SupportedTonWalletType } from "./types";
dotenv.config();

export default class TonWallet {
  public constructor(
    public readonly tonClient: TonClient,
    public readonly sender: Sender,
    public readonly publicKey: Buffer
  ) {}

  async waitSeqno(
    seqno: number,
    walletVersion: TonWalletVersion,
    network: Network = "mainnet",
    workchain = MAIN_WORKCHAIN
  ) {
    const walletContract = TonWallet.createWalletContractFromPubKey(
      walletVersion,
      this.publicKey,
      workchain,
      network
    );
    const contract = this.tonClient.open(walletContract);
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
      console.log("waiting for transaction to confirm...");
      await new Promise((resolve) =>
        setTimeout(resolve, SLEEP_TIME.WAIT_SEQNO)
      );
      const seqno = await contract.getSeqno();
      currentSeqno = seqno;
    }
    console.log("transaction confirmed!");
  }

  static async create(
    network: Network,
    {
      mnemonicData: { mnemonic, tonWalletVersion, workchain },
      tonConnector,
    }: {
      mnemonicData?: {
        mnemonic: string[];
        tonWalletVersion: TonWalletVersion;
        workchain?: number;
      };
      tonConnector?: TonConnectUI;
    }
  ) {
    const endpoint = await getHttpEndpoint({ network });
    const client = new TonClient({ endpoint });
    if (!mnemonic && !tonConnector) {
      throw new Error(
        "Need at least mnemonic or TonConnector to initialize the TON Wallet"
      );
    }
    let tonSender: Sender;
    let tonPublicKey: Buffer;
    if (mnemonic) {
      const { publicKey, secretKey } = await this.getWalletFromMnemonic(
        mnemonic
      );
      tonPublicKey = publicKey;
      const wallet = this.createWalletContractFromPubKey(
        tonWalletVersion,
        tonPublicKey,
        workchain,
        network
      );

      const walletContract = client.open(wallet);
      tonSender = {
        address: walletContract.address,
        ...walletContract.sender(secretKey),
      };
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
    return new TonWallet(client, tonSender, tonPublicKey);
  }

  private static createWalletContractFromPubKey(
    tonWalletVersion: TonWalletVersion,
    publicKey: Buffer,
    workchain: number = MAIN_WORKCHAIN,
    network: Network
  ): SupportedTonWalletType {
    let wallet: SupportedTonWalletType = WalletContractV3R2.create({
      publicKey,
      workchain,
    });
    if (network === "testnet") return wallet;
    switch (tonWalletVersion) {
      case "V4":
        wallet = WalletContractV4.create({
          publicKey,
          workchain,
        });
        break;
      case "V5R1":
        wallet = WalletContractV5R1.create({
          workChain: workchain,
          publicKey,
        });
        break;
      case "V3R2":
        break;
      default:
        wallet = WalletContractV4.create({
          publicKey,
          workchain,
        });
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
