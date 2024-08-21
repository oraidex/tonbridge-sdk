import { Coin, StdFee } from "@cosmjs/amino";
import {
  ExecuteResult,
  JsonObject,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate";
import { SimulateCosmWasmClient } from "@oraichain/cw-simulate";
import { TonbridgeBridgeClient } from "@oraichain/tonbridge-contracts-sdk";
import {
  AssetInfo,
  PairQuery,
} from "@oraichain/tonbridge-contracts-sdk/build/TonbridgeBridge.types";

export const mockCw20Contract = "orai1";
export const mockNativeTon =
  "factory/orai1wuvhex9xqs3r539mvc6mtm7n20fcj3qr2m0y9khx6n5vtlngfzes3k0rq9/ton";

export class SimulateCosmWasmClientMock extends SimulateCosmWasmClient {
  execute(
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    fee: StdFee | "auto" | number,
    memo?: string,
    funds?: readonly Coin[]
  ): Promise<ExecuteResult> {
    return {
      senderAddress,
      contractAddress,
      msg,
      memo,
      funds,
    } as any;
  }
}

export class TonbridgeBridgeMock extends TonbridgeBridgeClient {
  constructor(
    client: SigningCosmWasmClient,
    sender: string,
    contractAddress: string
  ) {
    super(client, sender, contractAddress);

    this.bridgeToTon = async (
      { denom, timeout, to }: { denom: string; timeout?: number; to: string },
      _fee?: number | StdFee | "auto",
      memo?: string,
      funds?: Coin[]
    ): Promise<ExecuteResult> => {
      return {
        bridge_to_ton: {
          denom,
          timeout,
          to,
        },
        memo,
        funds,
      } as any;
    };

    this.pairMapping = async ({ key }: { key: string }): Promise<PairQuery> => {
      const localAssetInfo: AssetInfo = key.includes("cw20")
        ? {
            token: {
              contract_addr: mockCw20Contract,
            },
          }
        : {
            native_token: {
              denom: mockNativeTon,
            },
          };
      return {
        key,
        pair_mapping: {
          asset_info: localAssetInfo,
          asset_info_decimals: 9,
          opcode: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 1,
          ],
          remote_decimals: 9,
          token_origin: 529034805,
        },
      };
    };
  }
}
