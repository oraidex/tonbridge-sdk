import * as ibc from "./blockchain/index";
import * as iStorages from "./providers/Storage";
import * as itypes from "./types/index.js";
import iutils from "./utils/index.js";

export * from "./block-utils";
export * from "./types/Block.js";
export * from "./types/Validator.js";
export * from "./tlb";

export namespace TonRocks {
  export const version = "0.1.0";

  export const bc = ibc;
  export const Storages = iStorages;

  export type bc = typeof ibc;
  export type Storages = typeof iStorages;
  export namespace utils {
    export const BN = iutils.BN;
    export type BN = typeof iutils.BN;
    export const sha256 = iutils.sha256;
    export type sha256 = typeof iutils.sha256;
  }

  export namespace types {
    // export * from './types/index.js';
    export const Address = itypes.Address;
    export const BitString = itypes.BitString;
    export const Cell = itypes.Cell;
    export const Hashmap = itypes.Hashmap;
    export const HashmapE = itypes.HashmapE;
    export const HashmapAug = itypes.HashmapAug;
    export const HashmapAugE = itypes.HashmapAugE;

    export type Address = typeof itypes.Address;
    export type BitString = typeof itypes.BitString;
    export type Cell = any; // typeof itypes.Cell;
    export type Hashmap = typeof itypes.Hashmap;
    export type HashmapE = typeof itypes.HashmapE;
    export type HashmapAug = typeof itypes.HashmapAug;
    export type HashmapAugE = typeof itypes.HashmapAugE;
  }
}

export default TonRocks;
