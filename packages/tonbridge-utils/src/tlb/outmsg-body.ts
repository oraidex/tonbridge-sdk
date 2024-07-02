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

// _ {x:#} buffer:(bits x * 8) = Bytes x;

export interface Bytes {
    readonly kind: 'Bytes';
    readonly x: number;
    readonly buffer: BitString;
}

// dest_denom#_ data:(Bytes 32) = DestDenom;

export interface DestDenom {
    readonly kind: 'DestDenom';
    readonly data: Bytes;
}

// dest_channel#_ data:(bits 16) = DestChannel;

export interface DestChannel {
    readonly kind: 'DestChannel';
    readonly data: BitString;
}

// dest_receiver#_ data:(bits 1023) = DestReceiver;

export interface DestReceiver {
    readonly kind: 'DestReceiver';
    readonly data: BitString;
}

// orai_address#_ data:(bits 1023) = OraiAddress;

export interface OraiAddress {
    readonly kind: 'OraiAddress';
    readonly data: BitString;
}

// msg_dest#_ inner_ref:^DestData = MsgDest;

export interface MsgDest {
    readonly kind: 'MsgDest';
    readonly inner_ref: DestData;
}

// dest_data#_ dest_denom:^DestDenom dest_channel:^DestChannel dest_receiver:^DestReceiver orai_address:^OraiAddress = DestData;

export interface DestData {
    readonly kind: 'DestData';
    readonly dest_denom: DestDenom;
    readonly dest_channel: DestChannel;
    readonly dest_receiver: DestReceiver;
    readonly orai_address: OraiAddress;
}

/*
read_transacion_outmsg_body#540CE379 seq:(## 64) timeout_timestamp:(## 64) src_denom:MsgAddressInt 
src_sender:MsgAddressInt src_channel_num:(## 16) amount:Grams msg_dest:^MsgDest = ReadTransactionOutMsgBody;
*/

export interface ReadTransactionOutMsgBody {
    readonly kind: 'ReadTransactionOutMsgBody';
    readonly seq: number;
    readonly timeout_timestamp: number;
    readonly src_denom: Address;
    readonly src_sender: Address;
    readonly src_channel_num: number;
    readonly amount: bigint;
    readonly msg_dest: MsgDest;
}

// send_packet_timeout_outmsg_body#540CE379 seq:(## 64) = SendPacketTimeoutOutMsgBody;

export interface SendPacketTimeoutOutMsgBody {
    readonly kind: 'SendPacketTimeoutOutMsgBody';
    readonly seq: number;
}

// _ {x:#} buffer:(bits x * 8) = Bytes x;

export function loadBytes(slice: Slice, x: number): Bytes {
    let buffer: BitString = slice.loadBits((x * 8));
    return {
        kind: 'Bytes',
        x: x,
        buffer: buffer,
    }

}

export function storeBytes(bytes: Bytes): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeBits(bytes.buffer);
    })

}

// dest_denom#_ data:(Bytes 32) = DestDenom;

export function loadDestDenom(slice: Slice): DestDenom {
    let data: Bytes = loadBytes(slice, 32);
    return {
        kind: 'DestDenom',
        data: data,
    }

}

export function storeDestDenom(destDenom: DestDenom): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeBytes(destDenom.data)(builder);
    })

}

// dest_channel#_ data:(bits 16) = DestChannel;

export function loadDestChannel(slice: Slice): DestChannel {
    let data: BitString = slice.loadBits(16);
    return {
        kind: 'DestChannel',
        data: data,
    }

}

export function storeDestChannel(destChannel: DestChannel): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeBits(destChannel.data);
    })

}

// dest_receiver#_ data:(bits 1023) = DestReceiver;

export function loadDestReceiver(slice: Slice): DestReceiver {
    let data: BitString = slice.loadBits(1023);
    return {
        kind: 'DestReceiver',
        data: data,
    }

}

export function storeDestReceiver(destReceiver: DestReceiver): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeBits(destReceiver.data);
    })

}

// orai_address#_ data:(bits 1023) = OraiAddress;

export function loadOraiAddress(slice: Slice): OraiAddress {
    let data: BitString = slice.loadBits(1023);
    return {
        kind: 'OraiAddress',
        data: data,
    }

}

export function storeOraiAddress(oraiAddress: OraiAddress): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeBits(oraiAddress.data);
    })

}

// msg_dest#_ inner_ref:^DestData = MsgDest;

export function loadMsgDest(slice: Slice): MsgDest {
    let slice1 = slice.loadRef().beginParse(true);
    let inner_ref: DestData = loadDestData(slice1);
    return {
        kind: 'MsgDest',
        inner_ref: inner_ref,
    }

}

export function storeMsgDest(msgDest: MsgDest): (builder: Builder) => void {
    return ((builder: Builder) => {
        let cell1 = beginCell();
        storeDestData(msgDest.inner_ref)(cell1);
        builder.storeRef(cell1);
    })

}

// dest_data#_ dest_denom:^DestDenom dest_channel:^DestChannel dest_receiver:^DestReceiver orai_address:^OraiAddress = DestData;

export function loadDestData(slice: Slice): DestData {
    let slice1 = slice.loadRef().beginParse(true);
    let dest_denom: DestDenom = loadDestDenom(slice1);
    let slice2 = slice.loadRef().beginParse(true);
    let dest_channel: DestChannel = loadDestChannel(slice2);
    let slice3 = slice.loadRef().beginParse(true);
    let dest_receiver: DestReceiver = loadDestReceiver(slice3);
    let slice4 = slice.loadRef().beginParse(true);
    let orai_address: OraiAddress = loadOraiAddress(slice4);
    return {
        kind: 'DestData',
        dest_denom: dest_denom,
        dest_channel: dest_channel,
        dest_receiver: dest_receiver,
        orai_address: orai_address,
    }

}

export function storeDestData(destData: DestData): (builder: Builder) => void {
    return ((builder: Builder) => {
        let cell1 = beginCell();
        storeDestDenom(destData.dest_denom)(cell1);
        builder.storeRef(cell1);
        let cell2 = beginCell();
        storeDestChannel(destData.dest_channel)(cell2);
        builder.storeRef(cell2);
        let cell3 = beginCell();
        storeDestReceiver(destData.dest_receiver)(cell3);
        builder.storeRef(cell3);
        let cell4 = beginCell();
        storeOraiAddress(destData.orai_address)(cell4);
        builder.storeRef(cell4);
    })

}

/*
read_transacion_outmsg_body#540CE379 seq:(## 64) timeout_timestamp:(## 64) src_denom:MsgAddressInt 
src_sender:MsgAddressInt src_channel_num:(## 16) amount:Grams msg_dest:^MsgDest = ReadTransactionOutMsgBody;
*/

export function loadReadTransactionOutMsgBody(slice: Slice): ReadTransactionOutMsgBody {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x540CE379))) {
        slice.loadUint(32);
        let seq: number = slice.loadUint(64);
        let timeout_timestamp: number = slice.loadUint(64);
        let src_denom: Address = slice.loadAddress();
        let src_sender: Address = slice.loadAddress();
        let src_channel_num: number = slice.loadUint(16);
        let amount: bigint = slice.loadCoins();
        let slice1 = slice.loadRef().beginParse(true);
        let msg_dest: MsgDest = loadMsgDest(slice1);
        return {
            kind: 'ReadTransactionOutMsgBody',
            seq: seq,
            timeout_timestamp: timeout_timestamp,
            src_denom: src_denom,
            src_sender: src_sender,
            src_channel_num: src_channel_num,
            amount: amount,
            msg_dest: msg_dest,
        }

    }
    throw new Error('Expected one of "ReadTransactionOutMsgBody" in loading "ReadTransactionOutMsgBody", but data does not satisfy any constructor');
}

export function storeReadTransactionOutMsgBody(readTransactionOutMsgBody: ReadTransactionOutMsgBody): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x540CE379, 32);
        builder.storeUint(readTransactionOutMsgBody.seq, 64);
        builder.storeUint(readTransactionOutMsgBody.timeout_timestamp, 64);
        builder.storeAddress(readTransactionOutMsgBody.src_denom);
        builder.storeAddress(readTransactionOutMsgBody.src_sender);
        builder.storeUint(readTransactionOutMsgBody.src_channel_num, 16);
        builder.storeCoins(readTransactionOutMsgBody.amount);
        let cell1 = beginCell();
        storeMsgDest(readTransactionOutMsgBody.msg_dest)(cell1);
        builder.storeRef(cell1);
    })

}

// send_packet_timeout_outmsg_body#540CE379 seq:(## 64) = SendPacketTimeoutOutMsgBody;

export function loadSendPacketTimeoutOutMsgBody(slice: Slice): SendPacketTimeoutOutMsgBody {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x540CE379))) {
        slice.loadUint(32);
        let seq: number = slice.loadUint(64);
        return {
            kind: 'SendPacketTimeoutOutMsgBody',
            seq: seq,
        }

    }
    throw new Error('Expected one of "SendPacketTimeoutOutMsgBody" in loading "SendPacketTimeoutOutMsgBody", but data does not satisfy any constructor');
}

export function storeSendPacketTimeoutOutMsgBody(sendPacketTimeoutOutMsgBody: SendPacketTimeoutOutMsgBody): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x540CE379, 32);
        builder.storeUint(sendPacketTimeoutOutMsgBody.seq, 64);
    })

}

