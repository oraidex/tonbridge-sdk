import { TON_NATIVE } from "@oraichain/common";
import { WalletContractV5R1, WalletContractV4, WalletContractV3R2 } from "@ton/ton";

export type JettonMasterAddress = string;

export type TonDenom = typeof TON_NATIVE | JettonMasterAddress;

export type SupportedTonWalletType = WalletContractV5R1 | WalletContractV4 | WalletContractV3R2;