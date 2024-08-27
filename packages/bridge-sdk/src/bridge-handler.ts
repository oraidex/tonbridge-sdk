import {
  ExecuteInstruction,
  ExecuteResult,
  toBinary,
} from "@cosmjs/cosmwasm-stargate";
import { coins } from "@cosmjs/proto-signing";
import {
  calculateTimeoutTimestamp,
  DEFAULT_TON_CONFIG,
  isNative,
  TON_NATIVE,
} from "@oraichain/common";
import { Cw20BaseTypes } from "@oraichain/common-contracts-sdk";
import {
  getEncodedExecuteContractMsgs,
  parseAssetInfo,
} from "@oraichain/oraidex-common";
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
import { MIN_TON_FOR_EXECUTE } from "./constants";
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
    public readonly tonBridge: OpenedContract<BridgeAdapter>,
    private tonClient: TonClient,
    public tonSender: Sender,
    public wasmBridge: TonbridgeBridgeClient
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

  buildSendToTonExecuteInstruction(
    tonRecipient: string,
    amount: bigint,
    tokenDenomOnTon: string,
    localDenom: string,
    timeoutTimestamp: bigint = BigInt(calculateTimeoutTimestampTon(3600))
  ) {
    // cw20 case
    if (!isNative(localDenom)) {
      const executeInstruction: ExecuteInstruction = {
        contractAddress: localDenom,
        msg: {
          send: {
            amount: amount.toString(),
            contract: this.wasmBridge.contractAddress,
            msg: toBinary({
              bridge_to_ton: {
                denom: tokenDenomOnTon,
                timeout: Number(timeoutTimestamp),
                to: tonRecipient,
              },
            } as TonbridgeBridgeTypes.ExecuteMsg),
          },
        } as Cw20BaseTypes.ExecuteMsg,
      };
      return executeInstruction;
    }
    const executeInstruction: ExecuteInstruction = {
      contractAddress: this.wasmBridge.contractAddress,
      msg: {
        bridge_to_ton: {
          denom: tokenDenomOnTon,
          timeout: Number(timeoutTimestamp),
          to: tonRecipient,
        },
      } as TonbridgeBridgeTypes.ExecuteMsg,
      funds: coins(amount.toString(), localDenom),
    };
    return executeInstruction;
  }

  async buildSendToTonEncodeObjects(
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
    const instruction = this.buildSendToTonExecuteInstruction(
      tonRecipient,
      amount,
      tokenDenomOnTon,
      localDenom,
      timeoutTimestamp
    );
    return getEncodedExecuteContractMsgs(this.wasmBridge.sender, [instruction]);
  }

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
    timeoutTimestamp: bigint = BigInt(calculateTimeoutTimestamp(3600)),
    memo: string = ""
  ) {
    if (denom === TON_NATIVE) {
      return this._sendTonToCosmos(
        cosmosRecipient,
        amount,
        timeoutTimestamp,
        opts,
        memo
      );
    }
    return this._sendJettonToCosmos(
      cosmosRecipient,
      amount,
      timeoutTimestamp,
      denom,
      opts,
      memo
    );
  }

  private async _sendJettonToCosmos(
    cosmosRecipient: string,
    amount: bigint,
    timeout: bigint,
    denom: string,
    opts: ValueOps,
    memo: string = ""
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
    return jettonWallet.sendTransfer(
      this.tonSender,
      {
        toAddress: this.tonBridge.address,
        jettonAmount: amount,
        fwdAmount: toNano(0.15),
        remoteReceiver: cosmosRecipient,
        jettonMaster: jettonMinter.address,
        timeout,
        // TODO: update memo for universal swap msg
        memo: beginCell().storeMaybeStringRefTail(memo).endCell(),
      },
      { ...opts, value: toNano(0) }
    );
  }

  private async _sendTonToCosmos(
    cosmosRecipient: string,
    amount: bigint,
    timeout: bigint,
    opts: ValueOps,
    memo: string = ""
  ) {
    return this.tonBridge.sendBridgeTon(
      this.tonSender,
      {
        amount,
        timeout,
        memo: beginCell().storeMaybeStringRefTail(memo).endCell(),
        remoteReceiver: cosmosRecipient,
      },
      // amount here is similar to sent_funds in Cosmos ecosystem
      { ...opts, value: amount + BigInt(MIN_TON_FOR_EXECUTE) } // MIN_TON_FOR_EXECUTE is the minimum fees required when bridging native TON
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
    const instruction = this.buildSendToTonExecuteInstruction(
      tonRecipient,
      amount,
      remoteDenom,
      localDenom,
      timeout
    );

    return (this.wasmBridge as TonbridgeBridgeClient).client.executeMultiple(
      this.wasmBridge.sender,
      [instruction],
      "auto",
      `TonBridgeHandler ${packageJson.version} sendCw20ToTon`
    );
  }
}
