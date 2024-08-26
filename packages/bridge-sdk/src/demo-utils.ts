import { DirectSecp256k1HdWallet, OfflineSigner } from "@cosmjs/proto-signing";
import {
  CosmosChainId,
  cosmosTokens,
  CosmosWallet,
  generateError,
} from "@oraichain/oraidex-common";
import { Network } from "@orbs-network/ton-access";
import { TonWalletVersion } from "./constants";
import TonWallet from "./wallet";

export class CosmosWalletImpl extends CosmosWallet {
  constructor(private readonly mnemonic: string) {
    super();
  }

  async getKeplrAddr(chainId?: CosmosChainId): Promise<string> {
    const signer = await this.createCosmosSigner(chainId);
    const accounts = await signer.getAccounts();
    return accounts[0].address;
  }
  async createCosmosSigner(chainId: CosmosChainId): Promise<OfflineSigner> {
    const chainInfo = cosmosTokens.find((t) => t.chainId === chainId);
    if (!chainInfo)
      throw generateError(
        `Cannot find a matched chain info given a chain id ${chainId}`
      );
    if (!chainInfo.prefix)
      throw generateError(
        `The chain info of the given a chain id ${chainId} does not have a bech32 prefix`
      );
    return DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: chainInfo.prefix,
    });
  }
}

export function initCosmosWallet(mnemonic: string) {
  const cosmosWallet = new CosmosWalletImpl(mnemonic);
  return cosmosWallet;
}

export async function initTonWallet(
  mnemonic: string,
  tonWalletVersion: TonWalletVersion,
  network: Network = "mainnet"
) {
  const tonWallet = await TonWallet.createTonWallet(network, {
    mnemonicData: { mnemonic: mnemonic.split(" "), tonWalletVersion },
  });
  return tonWallet;
}
