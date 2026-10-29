declare module "bokken/network" {
    class Address {
        readonly host: string;
        readonly port: number;

        toString(): string;
        equals(other: Address): boolean;

        static parse(uri: string): Address;
    }

    class Message {
        readonly byteLength: number;
        readonly bytesRemaining: number;

        constructor(bytes?: Uint8Array);

        peekByte(offset: number): number;
        peekBytes(offset: number, length: number): Uint8Array;

        readUint8(): number;
        readInt8(): number;
        readUint16(): number;
        readInt16(): number;
        readUint32(): number;
        readInt32(): number;
        readFloat32(): number;
        readFloat64(): number;
        readString(length: number): string;      
        readBytes(length: number): Uint8Array;
        readRemaining(): Uint8Array;

        writeUint8(value: number): this;
        writeInt8(value: number): this;
        writeUint16(value: number): this;
        writeInt16(value: number): this;
        writeUint32(value: number): this;
        writeInt32(value: number): this;
        writeFloat32(value: number): this;
        writeFloat64(value: number): this;
        writeString(value: string): this;         
        writeBytes(value: Uint8Array): this;

        seek(offset: number): void;               
        reset(): void;                             

        asBytes(): Uint8Array;
        asJSON<T = unknown>(): T;
    }

    interface TCPClientOptions {    
        autoReconnect?: boolean;
        reconnectDelay?: number;    
        maximumReconnectAttempts?: number; 
        connectTimeout?: number;     

        onConnect?: () => void;
        onDisconnect?: (reason?: Message) => void;
        onError?: (message: Message) => void;
        onMessage?: (message: Message) => void;
    }

    class TCPClient {
        constructor(uri: string, options?: TCPClientOptions);

        readonly isConnected: boolean;
        readonly address: Address;

        readonly bytesSent: number;
        readonly bytesReceived: number;

        send(data: Uint8Array): void;
        close(): void;

        onConnect: (() => void) | null;
        onDisconnect: ((reason?: Message) => void) | null;
        onError: ((message: Message) => void) | null;
        onMessage: ((message: Message) => void) | null;
    }

    interface TCPServerEvents {
        onConnect?: (client: TCPClient) => void;
        onDisconnect?: (client: TCPClient, reason?: Message) => void;
        onError?: (client: TCPClient, message: Message) => void;
        onMessage?: (client: TCPClient, message: Message) => void;
    }

    class TCPServer {
        constructor(uri: string, events?: TCPServerEvents);

        readonly isListening: boolean;
        readonly clients: readonly TCPClient[];

        broadcast(data: Uint8Array): void;
        
        
        broadcastExcept(data: Uint8Array, except: TCPClient): void;
        close(): void;

        onConnect: ((client: TCPClient) => void) | null;
        onDisconnect: ((client: TCPClient, reason?: Message) => void) | null;
        onError: ((client: TCPClient, message: Message) => void) | null;
        onMessage: ((client: TCPClient, message: Message) => void) | null;
    }

    interface UDPClientEvents {
        onMessage?: (message: Message) => void;
        onError?: (message: Message) => void;
    }

    class UDPClient {
        constructor(uri: string, events?: UDPClientEvents);

        readonly isOpen: boolean;
        readonly bytesSent: number;
        readonly bytesReceived: number;

        send(data: Uint8Array): void;
        sendTo(address : Address, data: Uint8Array): void;
        close(): void;

        onMessage: ((message: Message) => void) | null;
        onError: ((message: Message) => void) | null;
    }

    interface UDPServerEvents {
        onMessage?: (message: Message, address: Address) => void;
        onError?: (message: Message) => void;
    }

    class UDPServer {
        constructor(port: number, events?: UDPServerEvents);

        readonly isOpen: boolean;
        readonly bytesSent: number;
        readonly bytesReceived: number;

        sendTo(address : Address, data: Uint8Array): void;
        broadcastToKnownPeers(data: Uint8Array): void;
        close(): void;

        onMessage: ((message: Message, address: Address) => void) | null;
        onError: ((message: Message) => void) | null;
    }
}