/**
 * Length-prefixed message framing.
 *
 * bokken/network's TCPClient/TCPServer fire onMessage once per socket
 * read, not once per logical message - back-to-back sends can arrive
 * coalesced into one Message, or a single send can arrive split across
 * two. A 4-byte little-endian length prefix in front of every payload
 * lets us reassemble exact message boundaries regardless of how the
 * underlying reads happen to chunk the stream.
 */

/** Prefixes `payload` with its 4-byte little-endian length. */
export function frame(payload: Uint8Array): Uint8Array {
    const framed = new Uint8Array(4 + payload.length);
    framed[0] = payload.length & 0xff;
    framed[1] = (payload.length >>> 8) & 0xff;
    framed[2] = (payload.length >>> 16) & 0xff;
    framed[3] = (payload.length >>> 24) & 0xff;
    framed.set(payload, 4);
    return framed;
}

function readU32LE(bytes: Uint8Array, offset: number): number {
    return (
        (bytes[offset] |
            (bytes[offset + 1] << 8) |
            (bytes[offset + 2] << 16) |
            (bytes[offset + 3] << 24)) >>>
        0
    );
}

/** Reassembles length-prefixed frames out of a per-connection byte stream. */
export class FrameDecoder {
    private buffer: Uint8Array = new Uint8Array(0);

    push(chunk: Uint8Array): void {
        const merged = new Uint8Array(this.buffer.length + chunk.length);
        merged.set(this.buffer, 0);
        merged.set(chunk, this.buffer.length);
        this.buffer = merged;
    }

    /** Pulls out every complete frame currently buffered, in order. */
    drain(): Uint8Array[] {
        const frames: Uint8Array[] = [];
        let offset = 0;

        while (this.buffer.length - offset >= 4) {
            const len = readU32LE(this.buffer, offset);
            const bodyStart = offset + 4;
            const bodyEnd = bodyStart + len;

            if (this.buffer.length < bodyEnd) break; // incomplete frame - wait for more data

            frames.push(this.buffer.slice(bodyStart, bodyEnd));
            offset = bodyEnd;
        }

        this.buffer = this.buffer.slice(offset);
        return frames;
    }
}