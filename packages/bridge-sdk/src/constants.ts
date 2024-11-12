export const TON_ZERO_ADDRESS =
  "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
export const MIN_TON_FOR_EXECUTE = 50000001; // min ton for execute is 20000000, contract requires sent_funds > amount in body + MIN_TON_FOR_EXECUTE

export const SLEEP_TIME = {
  WAIT_SEQNO: 2000,
};

export const MAIN_WORKCHAIN = 0; // TON mainnet masterchain

const TON_WALLET_VERSION = {
  V3R2: "v3r2",
  V4: "v4",
  V5R1: "v5r1",
} as const;

export type TonWalletVersion = keyof typeof TON_WALLET_VERSION;
