import { calculateTimeoutTimestamp } from "@oraichain/common";
import {
  TonbridgeBridgeClient,
  TonbridgeBridgeInterface,
} from "@oraichain/tonbridge-contracts-sdk";

export function isTonbridgeBridgeClient(
  obj: TonbridgeBridgeInterface
): obj is TonbridgeBridgeClient {
  return obj instanceof TonbridgeBridgeClient;
}

/**
 * 
 * @param timeout timeout difference from now to the timestamp you want in seconds. Eg: 3600
 * @param dateNow current date timestamp in millisecs
 * @returns timeout timestamps in seconds
 */
export function calculateTimeoutTimestampTon(
  timeout: number,
  dateNow?: number
) {
  const timeoutNanoSec = calculateTimeoutTimestamp(timeout, dateNow);
  return BigInt(timeoutNanoSec) / BigInt(Math.pow(10, 9));
}
