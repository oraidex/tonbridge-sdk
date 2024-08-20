import { describe, expect, it } from "vitest";
import { calculateTimeoutTimestampTon } from "../src/utils";

describe("test-utils", () => {
  it("test-calculateTimeoutTimestampTon", () => {
    const now = new Date().getTime(); // millisecs
    const result = calculateTimeoutTimestampTon(3600, now);
    expect(result).toEqual(BigInt(now) / BigInt(1000) + BigInt(3600));
  });
});
