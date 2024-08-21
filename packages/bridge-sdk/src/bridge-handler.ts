import { ExecuteResult, toBinary } from "@cosmjs/cosmwasm-stargate";
import { coins } from "@cosmjs/proto-signing";
import {
  calculateTimeoutTimestamp,
  DEFAULT_TON_CONFIG,
  isNative,
  TON_NATIVE,
} from "@oraichain/common";
import { Cw20BaseTypes } from "@oraichain/common-contracts-sdk";
import { parseAssetInfo } from "@oraichain/oraidex-common";
import {
  BridgeAdapter,
  JettonMinter,
  JettonWallet,
  ValueOps,
} from "@oraichain/ton-bridge-contracts";
import {
  TonbridgeBridgeClient,
  TonbridgeBridgeTypes,
} from "@oraichain/tonbridge-contracts-sdk";
import { PairQuery } from "@oraichain/tonbridge-contracts-sdk/build/TonbridgeBridge.types";
import { Address, beginCell, OpenedContract, Sender, toNano } from "@ton/core";
import { TonClient, TonClientParameters } from "@ton/ton";
import * as packageJson from "../package.json";
import { TonDenom } from "./types";
import { calculateTimeoutTimestampTon } from "./utils";

export interface CreateTonBridgeHandlerParams {
  tonSender: Sender;
  wasmBridge: TonbridgeBridgeClient;
  tonBridge?: string;
  tonClientParameters?: TonClientParameters;
  tonClient?: TonClient;
}

export interface TonBridgeHandlerArgs {
  tonBridge: OpenedContract<BridgeAdapter>;
  wasmBridge: TonbridgeBridgeClient;
  tonClient: TonClient;
  tonSender: Sender;
}

export class TonBridgeHandler {
  private constructor(
    private readonly tonBridge: OpenedContract<BridgeAdapter>,
    private tonClient: TonClient,
    private tonSender: Sender,
    private wasmBridge: TonbridgeBridgeClient
  ) {}

  static async create(
    params: CreateTonBridgeHandlerParams
  ): Promise<TonBridgeHandler> {
    let tonClient: TonClient | null;
    if (!params.tonClient && !params.tonClientParameters) {
      throw new Error(
        "Either tonClient or tonClientParameters must be provided"
      );
    }
    if (!params.wasmBridge || !params.tonSender) {
      throw new Error("wasmBridge, tonSender must be provided");
    }

    if (params.tonClient) {
      tonClient = params.tonClient;
    } else {
      tonClient = new TonClient(params.tonClientParameters);
    }

    const tonBridge = tonClient.open(
      BridgeAdapter.createFromAddress(
        Address.parse(
          params.tonBridge ?? DEFAULT_TON_CONFIG.ton.tonBridgeAddress
        )
      )
    );
    return new TonBridgeHandler(
      tonBridge,
      tonClient,
      params.tonSender,
      params.wasmBridge
    );
  }

  // // currently, TonBridge have only supported Oraichain
  // async switchCosmosWallet(
  //   offlineSigner: OfflineSigner,
  //   gasPrice: GasPrice,
  //   endpoint: string = "https://rpc.orai.io"
  // ) {
  //   this.cosmosSigner = offlineSigner;
  //   const [sender, cosmosSignerClient] = await Promise.all([
  //     offlineSigner.getAccounts()[0],
  //     SigningCosmWasmClient.connectWithSigner(endpoint, offlineSigner, {
  //       broadcastPollIntervalMs:
  //         this.cosmosSignerClient.broadcastPollIntervalMs,
  //       broadcastTimeoutMs: this.cosmosSignerClient.broadcastTimeoutMs,
  //       gasPrice,
  //     }),
  //   ]);
  //   this.cosmosSignerClient = cosmosSignerClient;
  //   this.wasmBridge = new TonbridgeBridgeClient(
  //     this.cosmosSignerClient,
  //     sender,
  //     this.wasmBridge.contractAddress
  //   );
  // }

  // async switchCosmosAccount(offlineSigner: OfflineSigner) {
  //   const sender = await offlineSigner.getAccounts()[0];
  //   this.wasmBridge = new TonbridgeBridgeClient(
  //     this.cosmosSignerClient,
  //     sender,
  //     this.wasmBridge.contractAddress
  //   );
  // }

  switchTonAccount(tonSender: Sender) {
    if (!tonSender.address) {
      throw new Error("Ton sender address is required");
    }
    this.tonSender = tonSender;
  }

  async switchWasmBridge(wasmBridge: TonbridgeBridgeClient) {
    this.wasmBridge = wasmBridge;
  }

  async sendToCosmos(
    cosmosRecipient: string,
    amount: bigint,
    denom: TonDenom,
    opts: ValueOps,
    timeoutTimestamp: bigint = BigInt(calculateTimeoutTimestamp(3600))
  ) {
    if (denom === TON_NATIVE) {
      return this._sendTonToCosmos(
        cosmosRecipient,
        amount,
        timeoutTimestamp,
        opts
      );
    }
    return this._sendJettonToCosmos(
      cosmosRecipient,
      amount,
      timeoutTimestamp,
      denom,
      opts
    );
  }

  private async _sendJettonToCosmos(
    cosmosRecipient: string,
    amount: bigint,
    timeout: bigint,
    denom: string,
    opts: ValueOps
  ) {
    const jettonMinter = this.tonClient.open(
      JettonMinter.createFromAddress(Address.parse(denom))
    );
    const userJettonWalletAddress = await jettonMinter.getWalletAddress(
      this.tonSender.address
    );
    const jettonWallet = this.tonClient.open(
      JettonWallet.createFromAddress(userJettonWalletAddress)
    );
    await jettonWallet.sendTransfer(
      this.tonSender,
      {
        toAddress: this.tonBridge.address,
        jettonAmount: amount,
        fwdAmount: toNano(0.15),
        remoteReceiver: cosmosRecipient,
        jettonMaster: jettonMinter.address,
        timeout,
        // TODO: update memo for universal swap msg
        memo: beginCell().endCell(),
      },
      opts
    );
  }

  private async _sendTonToCosmos(
    cosmosRecipient: string,
    amount: bigint,
    timeout: bigint,
    opts: ValueOps
  ) {
    await this.tonBridge.sendBridgeTon(
      this.tonSender,
      {
        amount,
        timeout: timeout,
        memo: beginCell().endCell(),
        remoteReceiver: cosmosRecipient,
      },
      opts
    );
  }

  async sendToTon(
    tonRecipient: string,
    amount: bigint,
    tokenDenomOnTon: string,
    timeoutTimestamp: bigint = BigInt(calculateTimeoutTimestampTon(3600))
  ) {
    let pair: PairQuery;
    try {
      pair = await this.wasmBridge.pairMapping({ key: tokenDenomOnTon });
    } catch (error) {
      throw new Error("Pair mapping not found");
    }
    const localDenom = parseAssetInfo(pair.pair_mapping.asset_info);
    if (!isNative(localDenom)) {
      return this._sendCw20ToTon(
        tonRecipient,
        amount,
        timeoutTimestamp,
        localDenom,
        tokenDenomOnTon
      );
    }
    return this._sendNativeToTon(
      tonRecipient,
      amount,
      timeoutTimestamp,
      localDenom,
      tokenDenomOnTon
    );
  }

  private async _sendNativeToTon(
    tonRecipient: string,
    amount: bigint,
    timeout: bigint,
    localDenom: string,
    remoteDenom: string
  ) {
    return this.wasmBridge.bridgeToTon(
      {
        denom: remoteDenom,
        to: tonRecipient,
        timeout: Number(timeout),
      },
      "auto",
      `TonBridgeHandler ${packageJson.version} sendNativeToTon`,
      coins(amount.toString(), localDenom)
    );
  }

  private async _sendCw20ToTon(
    tonRecipient: string,
    amount: bigint,
    timeout: bigint,
    localDenom: string,
    remoteDenom: string
  ): Promise<ExecuteResult> {
    if (!(this.wasmBridge as TonbridgeBridgeClient).client)
      throw new Error(
        "wasm bridge client is not an instance of TonbridgeBridgeClient"
      );
    return (this.wasmBridge as TonbridgeBridgeClient).client.execute(
      this.wasmBridge.sender,
      localDenom,
      {
        send: {
          amount: amount.toString(),
          contract: this.wasmBridge.contractAddress,
          msg: toBinary({
            bridge_to_ton: {
              denom: remoteDenom,
              timeout: Number(timeout),
              to: tonRecipient,
            },
          } as TonbridgeBridgeTypes.ExecuteMsg),
        },
      } as Cw20BaseTypes.ExecuteMsg,
      "auto",
      `TonBridgeHandler ${packageJson.version} sendCw20ToTon`
    );
  }
}
