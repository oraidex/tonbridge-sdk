import { Builder } from '@ton/core'
import { Slice } from '@ton/core'
import { beginCell } from '@ton/core'
import { BitString } from '@ton/core'
import { Cell } from '@ton/core'
import { Address } from '@ton/core'
import { ExternalAddress } from '@ton/core'
import { Dictionary } from '@ton/core'
import { DictionaryValue } from '@ton/core'
export function bitLen(n: number) {
    return n.toString(2).length;
}

/*
receive_packet_timeout#64060175 seq:(## 64) src_sender:MsgAddressInt 
src_denom:MsgAddressExt src_channel_num:(## 16) amount:(## 128) timeout_timestamp:(## 64) = ReceivePacketTimeout;
*/

export interface ReceivePacketTimeout {
    readonly kind: 'ReceivePacketTimeout';
    readonly seq: number;
    readonly src_sender: Address;
    readonly src_denom: ExternalAddress | null;
    readonly src_channel_num: number;
    readonly amount: bigint;
    readonly timeout_timestamp: number;
}

// submit_to_ton_info#04E545F4 seq:(## 64) to:MsgAddressInt denom:MsgAddressInt amount:(## 128) crc_src:(## 32) timeout_timestamp:(## 64) = SubmitToTonInfo;

export interface SubmitToTonInfo {
    readonly kind: 'SubmitToTonInfo';
    readonly seq: number;
    readonly to: Address;
    readonly denom: Address;
    readonly amount: bigint;
    readonly crc_src: number;
    readonly timeout_timestamp: number;
}

/*
receive_packet_timeout#64060175 seq:(## 64) src_sender:MsgAddressInt 
src_denom:MsgAddressExt src_channel_num:(## 16) amount:(## 128) timeout_timestamp:(## 64) = ReceivePacketTimeout;
*/

export function loadReceivePacketTimeout(slice: Slice): ReceivePacketTimeout {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x64060175))) {
        slice.loadUint(32);
        let seq: number = slice.loadUint(64);
        let src_sender: Address = slice.loadAddress();
        let src_denom: ExternalAddress | null = slice.loadMaybeExternalAddress();
        let src_channel_num: number = slice.loadUint(16);
        let amount: bigint = slice.loadUintBig(128);
        let timeout_timestamp: number = slice.loadUint(64);
        return {
            kind: 'ReceivePacketTimeout',
            seq: seq,
            src_sender: src_sender,
            src_denom: src_denom,
            src_channel_num: src_channel_num,
            amount: amount,
            timeout_timestamp: timeout_timestamp,
        }

    }
    throw new Error('Expected one of "ReceivePacketTimeout" in loading "ReceivePacketTimeout", but data does not satisfy any constructor');
}

export function storeReceivePacketTimeout(receivePacketTimeout: ReceivePacketTimeout): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x64060175, 32);
        builder.storeUint(receivePacketTimeout.seq, 64);
        builder.storeAddress(receivePacketTimeout.src_sender);
        builder.storeAddress(receivePacketTimeout.src_denom);
        builder.storeUint(receivePacketTimeout.src_channel_num, 16);
        builder.storeUint(receivePacketTimeout.amount, 128);
        builder.storeUint(receivePacketTimeout.timeout_timestamp, 64);
    })

}

// submit_to_ton_info#04E545F4 seq:(## 64) to:MsgAddressInt denom:MsgAddressInt amount:(## 128) crc_src:(## 32) timeout_timestamp:(## 64) = SubmitToTonInfo;

export function loadSubmitToTonInfo(slice: Slice): SubmitToTonInfo {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x04E545F4))) {
        slice.loadUint(32);
        let seq: number = slice.loadUint(64);
        let to: Address = slice.loadAddress();
        let denom: Address = slice.loadAddress();
        let amount: bigint = slice.loadUintBig(128);
        let crc_src: number = slice.loadUint(32);
        let timeout_timestamp: number = slice.loadUint(64);
        return {
            kind: 'SubmitToTonInfo',
            seq: seq,
            to: to,
            denom: denom,
            amount: amount,
            crc_src: crc_src,
            timeout_timestamp: timeout_timestamp,
        }

    }
    throw new Error('Expected one of "SubmitToTonInfo" in loading "SubmitToTonInfo", but data does not satisfy any constructor');
}

export function storeSubmitToTonInfo(submitToTonInfo: SubmitToTonInfo): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x04E545F4, 32);
        builder.storeUint(submitToTonInfo.seq, 64);
        builder.storeAddress(submitToTonInfo.to);
        builder.storeAddress(submitToTonInfo.denom);
        builder.storeUint(submitToTonInfo.amount, 128);
        builder.storeUint(submitToTonInfo.crc_src, 32);
        builder.storeUint(submitToTonInfo.timeout_timestamp, 64);
    })

}

