import { Coin, coins } from "@cosmjs/amino";
import { ExecuteInstruction, toBinary } from "@cosmjs/cosmwasm-stargate";
import { COSMOS_CHAIN_IDS, DEFAULT_TON_CONFIG, ORAI } from "@oraichain/common";
import { Cw20BaseTypes } from "@oraichain/common-contracts-sdk";
import { getEncodedExecuteContractMsgs } from "@oraichain/oraidex-common";
import {
  TonbridgeBridgeClient,
  TonbridgeBridgeTypes,
} from "@oraichain/tonbridge-contracts-sdk";
import { mnemonicNew } from "@ton/crypto";
import { Sender } from "@ton/ton";
import { beforeAll, describe, expect, it } from "vitest";
import * as packageJson from "../package.json";
import { TonBridgeHandler } from "../src/bridge-handler";
import { initTonWallet } from "../src/demo-utils";
import { calculateTimeoutTimestampTon } from "../src/utils";
import TonWallet from "../src/wallet";
import {
  mockCw20Contract,
  mockNativeTon,
  SimulateCosmWasmClientMock,
  TonbridgeBridgeMock,
} from "./mocks";

describe("test-bridge-handler", () => {
  const sender = "orai1g4h64yjt0fvzv5v2j8tyfnpe5kmnetejvfgs7g";
  const mockContract = "orai1g4h64yjt0fvzv5v2j8tyfnpe5kmnetejvfgs79";
  const recipient = "UQB0PhtEaJYc94Yku1h7sRubS9Y_6Avdyx5sBuEfpEIb3G__";
  const amount = 100n;
  const tokenDenomOnTon = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
  let bridgeHandler: TonBridgeHandler;
  let wasmBridge: TonbridgeBridgeClient;
  let tonSender: Sender;
  let tonWallet: TonWallet;
  const configEnv = DEFAULT_TON_CONFIG["ton"];
  const now = new Date().getTime();

  beforeAll(async () => {
    let mnemonics = await mnemonicNew();
    tonWallet = await initTonWallet(mnemonics.join(" "), "V5R1");
    tonSender = tonWallet.sender;
  });

  describe("test-bridge-handler-send-to-ton", () => {
    beforeAll(async () => {
      const cwClient = new SimulateCosmWasmClientMock({
        chainId: COSMOS_CHAIN_IDS.ORAICHAIN,
        bech32Prefix: ORAI,
        metering: true,
      });
      wasmBridge = new TonbridgeBridgeMock(cwClient, sender, mockContract);
      bridgeHandler = await TonBridgeHandler.create({
        wasmBridge,
        tonBridge: configEnv.tonBridgeAddress,
        tonSender: tonSender,
        tonClientParameters: {
          endpoint: configEnv.tonCenterUrl!,
        },
      });
    });

    it("test-send-to-ton-native", async () => {
      const timestamp = calculateTimeoutTimestampTon(3600, now);
      const result = await bridgeHandler.sendToTon(
        recipient,
        amount,
        tokenDenomOnTon,
        timestamp
      );
      expect(result).toMatchObject({
        bridge_to_ton: {
          denom: tokenDenomOnTon,
          timeout: Number(timestamp),
          to: recipient,
        },
        memo: `TonBridgeHandler ${packageJson.version} sendNativeToTon`,
        funds: [{ amount: amount.toString(), denom: mockNativeTon }] as Coin[],
      });
    });

    it("test-buildSendToTonExecuteInstruction-ton-native", () => {
      const timestamp = calculateTimeoutTimestampTon(3600, now);
      const localDenom = mockNativeTon;
      const result = bridgeHandler.buildSendToTonExecuteInstruction(
        recipient,
        amount,
        tokenDenomOnTon,
        localDenom,
        timestamp
      );
      expect(result).toMatchObject({
        contractAddress: bridgeHandler.wasmBridge.contractAddress,
        msg: {
          bridge_to_ton: {
            denom: tokenDenomOnTon,
            timeout: Number(timestamp),
            to: recipient,
          },
        } as TonbridgeBridgeTypes.ExecuteMsg,
        funds: coins(amount.toString(), localDenom),
      } as ExecuteInstruction);
    });

    it("test-buildSendToTonEncodeObjects-ton-native", async () => {
      const timestamp = calculateTimeoutTimestampTon(3600, now);
      const localDenom = mockNativeTon;
      const result = await bridgeHandler.buildSendToTonEncodeObjects(
        recipient,
        amount,
        tokenDenomOnTon,
        timestamp
      );
      expect(result).toMatchObject(
        getEncodedExecuteContractMsgs(sender, [
          {
            contractAddress: bridgeHandler.wasmBridge.contractAddress,
            msg: {
              bridge_to_ton: {
                denom: tokenDenomOnTon,
                timeout: Number(timestamp),
                to: recipient,
              },
            } as TonbridgeBridgeTypes.ExecuteMsg,
            funds: coins(amount.toString(), localDenom),
          } as ExecuteInstruction,
        ])
      );
    });

    it("test-send-to-ton-cw20", async () => {
      const tokenDenomOnTon =
        "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c-cw20";
      const timestamp = calculateTimeoutTimestampTon(3600, now);
      const result: any = await bridgeHandler.sendToTon(
        recipient,
        amount,
        tokenDenomOnTon,
        timestamp
      );
      const instruction = bridgeHandler.buildSendToTonExecuteInstruction(
        recipient,
        amount,
        tokenDenomOnTon,
        mockCw20Contract,
        timestamp
      );
      const expectedResult = {
        senderAddress: sender,
        instructions: [instruction],
        memo: `TonBridgeHandler ${packageJson.version} sendCw20ToTon`,
      };
      expect(expectedResult).toMatchObject(result);
    });

    it("test-buildSendToTonExecuteInstruction-ton-cw20", () => {
      const timestamp = calculateTimeoutTimestampTon(3600, now);
      const localDenom = mockCw20Contract;
      const result = bridgeHandler.buildSendToTonExecuteInstruction(
        recipient,
        amount,
        tokenDenomOnTon,
        localDenom,
        timestamp
      );
      expect(result).toMatchObject({
        contractAddress: localDenom,
        msg: {
          send: {
            amount: amount.toString(),
            contract: bridgeHandler.wasmBridge.contractAddress,
            msg: toBinary({
              bridge_to_ton: {
                denom: tokenDenomOnTon,
                timeout: Number(timestamp),
                to: recipient,
              },
            } as TonbridgeBridgeTypes.ExecuteMsg),
          },
        } as Cw20BaseTypes.ExecuteMsg,
      } as ExecuteInstruction);
    });

    it("test-buildSendToTonEncodeObjects-ton-cw20", async () => {
      const tokenDenomOnTon =
        "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c-cw20";
      const timestamp = calculateTimeoutTimestampTon(3600, now);
      const result = await bridgeHandler.buildSendToTonEncodeObjects(
        recipient,
        amount,
        tokenDenomOnTon,
        timestamp
      );
      expect(result).toMatchObject(
        getEncodedExecuteContractMsgs(sender, [
          {
            contractAddress: mockCw20Contract,
            msg: {
              send: {
                amount: amount.toString(),
                contract: bridgeHandler.wasmBridge.contractAddress,
                msg: toBinary({
                  bridge_to_ton: {
                    denom: tokenDenomOnTon,
                    timeout: Number(timestamp),
                    to: recipient,
                  },
                } as TonbridgeBridgeTypes.ExecuteMsg),
              },
            } as Cw20BaseTypes.ExecuteMsg,
          } as ExecuteInstruction,
        ])
      );
    });
  });

  // TODO: write test cases for sending to orai
  // describe("test-bridge-handler-send-to-orai", () => {
  //   it("test-send-to-orai", async () => {
  //     expect(true).toEqual(false);
  //   });
  // });
});
