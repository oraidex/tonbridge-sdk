/**
* This file was automatically generated by @oraichain/ts-codegen@0.35.9.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @oraichain/ts-codegen generate command to regenerate this file.
*/

import { CosmWasmClient, SigningCosmWasmClient, ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { StdFee } from "@cosmjs/amino";
import {HexBinary, Boolean} from "./types";
import {Uint128, Addr, AssetInfo, InstantiateMsg, ExecuteMsg, Binary, UpdatePairMsg, BridgeToTonMsg, Cw20ReceiveMsg, TokenFee, Ratio, QueryMsg, MigrateMsg, Amount, ChannelResponse, Coin, Cw20CoinVerified, RouterController, Config, String} from "./TonbridgeBridge.types";
export interface TonbridgeBridgeReadOnlyInterface {
  contractAddress: string;
  owner: () => Promise<String>;
  config: () => Promise<Config>;
  isTxProcessed: ({
    txHash
  }: {
    txHash: HexBinary;
  }) => Promise<Boolean>;
  channelStateData: ({
    channelId
  }: {
    channelId: string;
  }) => Promise<ChannelResponse>;
}
export class TonbridgeBridgeQueryClient implements TonbridgeBridgeReadOnlyInterface {
  client: CosmWasmClient;
  contractAddress: string;

  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client;
    this.contractAddress = contractAddress;
    this.owner = this.owner.bind(this);
    this.config = this.config.bind(this);
    this.isTxProcessed = this.isTxProcessed.bind(this);
    this.channelStateData = this.channelStateData.bind(this);
  }

  owner = async (): Promise<String> => {
    return this.client.queryContractSmart(this.contractAddress, {
      owner: {}
    });
  };
  config = async (): Promise<Config> => {
    return this.client.queryContractSmart(this.contractAddress, {
      config: {}
    });
  };
  isTxProcessed = async ({
    txHash
  }: {
    txHash: HexBinary;
  }): Promise<Boolean> => {
    return this.client.queryContractSmart(this.contractAddress, {
      is_tx_processed: {
        tx_hash: txHash
      }
    });
  };
  channelStateData = async ({
    channelId
  }: {
    channelId: string;
  }): Promise<ChannelResponse> => {
    return this.client.queryContractSmart(this.contractAddress, {
      channel_state_data: {
        channel_id: channelId
      }
    });
  };
}
export interface TonbridgeBridgeInterface extends TonbridgeBridgeReadOnlyInterface {
  contractAddress: string;
  sender: string;
  readTransaction: ({
    txBoc,
    txProof
  }: {
    txBoc: HexBinary;
    txProof: HexBinary;
  }, _fee?: number | StdFee | "auto", _memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  updateMappingPair: ({
    denom,
    localAssetInfo,
    localAssetInfoDecimals,
    localChannelId,
    opcode,
    remoteDecimals
  }: {
    denom: string;
    localAssetInfo: AssetInfo;
    localAssetInfoDecimals: number;
    localChannelId: string;
    opcode: HexBinary;
    remoteDecimals: number;
  }, _fee?: number | StdFee | "auto", _memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  bridgeToTon: ({
    crcSrc,
    denom,
    localChannelId,
    to
  }: {
    crcSrc: number;
    denom: string;
    localChannelId: string;
    to: string;
  }, _fee?: number | StdFee | "auto", _memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  receive: ({
    amount,
    msg,
    sender
  }: {
    amount: Uint128;
    msg: Binary;
    sender: string;
  }, _fee?: number | StdFee | "auto", _memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  submitBridgeToTonInfo: ({
    data
  }: {
    data: HexBinary;
  }, _fee?: number | StdFee | "auto", _memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  updateOwner: ({
    newOwner
  }: {
    newOwner: Addr;
  }, _fee?: number | StdFee | "auto", _memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
  updateConfig: ({
    bridgeAdapter,
    relayerFee,
    relayerFeeReceiver,
    relayerFeeToken,
    swapRouterContract,
    tokenFee,
    tokenFeeReceiver,
    validatorContractAddr
  }: {
    bridgeAdapter?: string;
    relayerFee?: Uint128;
    relayerFeeReceiver?: Addr;
    relayerFeeToken?: AssetInfo;
    swapRouterContract?: string;
    tokenFee?: TokenFee[];
    tokenFeeReceiver?: Addr;
    validatorContractAddr?: Addr;
  }, _fee?: number | StdFee | "auto", _memo?: string, _funds?: Coin[]) => Promise<ExecuteResult>;
}
export class TonbridgeBridgeClient extends TonbridgeBridgeQueryClient implements TonbridgeBridgeInterface {
  client: SigningCosmWasmClient;
  sender: string;
  contractAddress: string;

  constructor(client: SigningCosmWasmClient, sender: string, contractAddress: string) {
    super(client, contractAddress);
    this.client = client;
    this.sender = sender;
    this.contractAddress = contractAddress;
    this.readTransaction = this.readTransaction.bind(this);
    this.updateMappingPair = this.updateMappingPair.bind(this);
    this.bridgeToTon = this.bridgeToTon.bind(this);
    this.receive = this.receive.bind(this);
    this.submitBridgeToTonInfo = this.submitBridgeToTonInfo.bind(this);
    this.updateOwner = this.updateOwner.bind(this);
    this.updateConfig = this.updateConfig.bind(this);
  }

  readTransaction = async ({
    txBoc,
    txProof
  }: {
    txBoc: HexBinary;
    txProof: HexBinary;
  }, _fee: number | StdFee | "auto" = "auto", _memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      read_transaction: {
        tx_boc: txBoc,
        tx_proof: txProof
      }
    }, _fee, _memo, _funds);
  };
  updateMappingPair = async ({
    denom,
    localAssetInfo,
    localAssetInfoDecimals,
    localChannelId,
    opcode,
    remoteDecimals
  }: {
    denom: string;
    localAssetInfo: AssetInfo;
    localAssetInfoDecimals: number;
    localChannelId: string;
    opcode: HexBinary;
    remoteDecimals: number;
  }, _fee: number | StdFee | "auto" = "auto", _memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      update_mapping_pair: {
        denom,
        local_asset_info: localAssetInfo,
        local_asset_info_decimals: localAssetInfoDecimals,
        local_channel_id: localChannelId,
        opcode,
        remote_decimals: remoteDecimals
      }
    }, _fee, _memo, _funds);
  };
  bridgeToTon = async ({
    crcSrc,
    denom,
    localChannelId,
    to
  }: {
    crcSrc: number;
    denom: string;
    localChannelId: string;
    to: string;
  }, _fee: number | StdFee | "auto" = "auto", _memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      bridge_to_ton: {
        crc_src: crcSrc,
        denom,
        local_channel_id: localChannelId,
        to
      }
    }, _fee, _memo, _funds);
  };
  receive = async ({
    amount,
    msg,
    sender
  }: {
    amount: Uint128;
    msg: Binary;
    sender: string;
  }, _fee: number | StdFee | "auto" = "auto", _memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      receive: {
        amount,
        msg,
        sender
      }
    }, _fee, _memo, _funds);
  };
  submitBridgeToTonInfo = async ({
    data
  }: {
    data: HexBinary;
  }, _fee: number | StdFee | "auto" = "auto", _memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      submit_bridge_to_ton_info: {
        data
      }
    }, _fee, _memo, _funds);
  };
  updateOwner = async ({
    newOwner
  }: {
    newOwner: Addr;
  }, _fee: number | StdFee | "auto" = "auto", _memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      update_owner: {
        new_owner: newOwner
      }
    }, _fee, _memo, _funds);
  };
  updateConfig = async ({
    bridgeAdapter,
    relayerFee,
    relayerFeeReceiver,
    relayerFeeToken,
    swapRouterContract,
    tokenFee,
    tokenFeeReceiver,
    validatorContractAddr
  }: {
    bridgeAdapter?: string;
    relayerFee?: Uint128;
    relayerFeeReceiver?: Addr;
    relayerFeeToken?: AssetInfo;
    swapRouterContract?: string;
    tokenFee?: TokenFee[];
    tokenFeeReceiver?: Addr;
    validatorContractAddr?: Addr;
  }, _fee: number | StdFee | "auto" = "auto", _memo?: string, _funds?: Coin[]): Promise<ExecuteResult> => {
    return await this.client.execute(this.sender, this.contractAddress, {
      update_config: {
        bridge_adapter: bridgeAdapter,
        relayer_fee: relayerFee,
        relayer_fee_receiver: relayerFeeReceiver,
        relayer_fee_token: relayerFeeToken,
        swap_router_contract: swapRouterContract,
        token_fee: tokenFee,
        token_fee_receiver: tokenFeeReceiver,
        validator_contract_addr: validatorContractAddr
      }
    }, _fee, _memo, _funds);
  };
}