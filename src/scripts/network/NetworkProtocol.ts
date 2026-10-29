import { Message } from "bokken/network";

/**
 * The host is always id 0. Connected clients get 1, 2, 3, ... in the
 * order they connect - assigned by the host and communicated back via
 * an AssignId message.
 */
export const HOST_PLAYER_ID = 0;

export enum MessageType {
    AssignId = 0,
    PlayerJoined = 1,
    PlayerLeft = 2,
    Position = 3,
    Animation = 4,
    Attack = 5,
    FlipX = 6,
}

export function encodeAssignId(id: number): Uint8Array {
    return new Message().writeUint8(MessageType.AssignId).writeUint32(id).asBytes();
}

export function encodePlayerJoined(id: number): Uint8Array {
    return new Message().writeUint8(MessageType.PlayerJoined).writeUint32(id).asBytes();
}

export function encodePlayerLeft(id: number): Uint8Array {
    return new Message().writeUint8(MessageType.PlayerLeft).writeUint32(id).asBytes();
}

export function encodePosition(id: number, x: number, y: number): Uint8Array {
    return new Message()
        .writeUint8(MessageType.Position)
        .writeUint32(id)
        .writeFloat32(x)
        .writeFloat32(y)
        .asBytes();
}

export function encodeAnimation(id: number, clipName: string): Uint8Array {
    return new Message()
        .writeUint8(MessageType.Animation)
        .writeUint32(id)
        .writeString(clipName)
        .asBytes();
}

export function encodeAttack(id: number): Uint8Array {
    return new Message().writeUint8(MessageType.Attack).writeUint32(id).asBytes();
}

export function encodeFlipX(id: number, flipX: boolean): Uint8Array {
    return new Message()
        .writeUint8(MessageType.FlipX)
        .writeUint32(id)
        .writeUint8(flipX ? 1 : 0)
        .asBytes();
}

/** Reads the human-readable text out of a bokken/network error Message. */
export function errorText(message: Message): string {
    return message.readString(message.bytesRemaining);
}